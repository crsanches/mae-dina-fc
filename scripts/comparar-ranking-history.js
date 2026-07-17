/**
 * Diagnóstico: compara a pontuação calculada do jeito do buildRanking
 * (agrupando por uid) com a do buildLeagueHistory (agrupando por
 * string de username), para localizar usuários "divididos".
 *
 * Uso: node scripts/comparar-ranking-history.js ./serviceAccount.json GROUP_ID
 * Ex.: node scripts/comparar-ranking-history.js ./serviceAccount.json S45ZeKwxkKSeYTqq2p45
 */

const admin = require("firebase-admin");
const fs = require("fs");

// ⚠️ Confira com lib/copas.ts (obterPesoDaFase)
const PESOS = {
  Grupos: 1,
  Fase32: 3,
  Oitavas: 5,
  Quartas: 8,
  Semi: 12,
  Terceiro: 12,
  Final: 12,
};

// Réplica de lib/calculatePoints.ts
function calculatePoints({ apostaA, apostaB, resultadoA, resultadoB }) {
  if (resultadoA == null || resultadoB == null) return 0;
  if (apostaA === resultadoA && apostaB === resultadoB) return 5;
  if (apostaA === apostaB && resultadoA === resultadoB) return 2;
  if (
    (apostaA > apostaB && resultadoA > resultadoB) ||
    (apostaA < apostaB && resultadoA < resultadoB)
  ) return 3;
  return 0;
}

async function main() {
  const [keyPath, groupId] = process.argv.slice(2);
  if (!keyPath || !groupId) {
    console.error("Uso: node comparar-ranking-history.js serviceAccountKey.json GROUP_ID");
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))),
  });
  const db = admin.firestore();

  // Jogos finalizados
  const gamesSnap = await db.collection("games").get();
  const gamesMap = {}; // "teamA x teamB" -> game
  gamesSnap.forEach((d) => {
    const g = d.data();
    if (g.finished && g.resultadoA != null && g.resultadoB != null) {
      gamesMap[`${g.teamA} x ${g.teamB}`] = g;
      if (g.match) gamesMap[g.match] = g; // cobre diferença entre match e "teamA x teamB"
    }
  });

  // Usuários (para o fallback de username do buildRanking)
  const usersSnap = await db.collection("users").get();
  const usersMap = {};
  usersSnap.forEach((d) => (usersMap[d.id] = d.data()));

  // Apostas do grupo, deduplicadas (mesma regra dos dois builds)
  const betsSnap = await db.collection("bets").where("groupId", "==", groupId).get();
  const latest = {};
  betsSnap.forEach((d) => {
    const b = d.data();
    const key = `${b.uid || b.userName}__${b.match}`;
    const cur = latest[key];
    if (!cur || (b.createdAt?.seconds || 0) > (cur.createdAt?.seconds || 0)) latest[key] = b;
  });
  const bets = Object.values(latest);

  // Acumula dos dois jeitos
  const porUid = {};      // rankingKey -> { username, points }
  const porUsername = {}; // username-string -> points  (jeito do history)
  const variantesPorUid = {}; // uid -> Set de strings de nome vistas nas apostas
  const semJogo = new Set();

  for (const bet of bets) {
    const game = gamesMap[bet.match];
    if (!game) { semJogo.add(bet.match); continue; }

    const pts = calculatePoints({
      apostaA: Number(bet.golsA),
      apostaB: Number(bet.golsB),
      resultadoA: Number(game.resultadoA),
      resultadoB: Number(game.resultadoB),
    });
    const fase = game.fase || "Grupos";
    const peso = PESOS[fase] != null ? PESOS[fase] : 1;
    const ponderado = pts * peso;

    // ----- Jeito do buildLeagueHistory (string de username) -----
    const nomeHistory = bet.username || bet.userName || bet.nome || "Anônimo";
    porUsername[nomeHistory] = (porUsername[nomeHistory] || 0) + ponderado;

    // ----- Jeito do buildRanking (uid como chave) -----
    const nome = bet.username || bet.userName || bet.nome || "Anônimo";
    let username = nome;
    if (!bet.username && bet.uid) {
      username = usersMap[bet.uid]?.username || nome;
    }
    const rankingKey = bet.uid || username;
    if (!porUid[rankingKey]) porUid[rankingKey] = { username, points: 0 };
    porUid[rankingKey].points += ponderado;

    if (bet.uid) {
      (variantesPorUid[bet.uid] ||= new Set()).add(nomeHistory);
    }
  }

  // Relatório
  const ranking = Object.values(porUid).sort((a, b) => b.points - a.points);
  console.log("=== RANKING (agrupado por uid — jeito do buildRanking) ===");
  ranking.forEach((r, i) =>
    console.log(`${String(i + 1).padStart(2)}. ${r.username.padEnd(28)} ${r.points}`)
  );

  console.log("\n=== HISTORY (agrupado por username — jeito do buildLeagueHistory) ===");
  Object.entries(porUsername)
    .sort((a, b) => b[1] - a[1])
    .forEach(([u, p], i) => console.log(`${String(i + 1).padStart(2)}. ${u.padEnd(28)} ${p}`));

  console.log("\n=== DIVERGÊNCIAS (ranking vs history, pelo username do ranking) ===");
  let houveDivergencia = false;
  for (const r of ranking) {
    const h = porUsername[r.username] || 0;
    if (h !== r.points) {
      houveDivergencia = true;
      console.log(`⚠️ ${r.username}: ranking=${r.points} | history=${h} | diff=${r.points - h}`);
    }
  }
  if (!houveDivergencia) console.log("Nenhuma — os dois cálculos batem.");

  console.log("\n=== UIDs COM MAIS DE UMA GRAFIA DE NOME NAS APOSTAS ===");
  let houveVariante = false;
  for (const [uid, nomes] of Object.entries(variantesPorUid)) {
    if (nomes.size > 1) {
      houveVariante = true;
      console.log(`⚠️ uid ${uid}: ${[...nomes].map((n) => `"${n}"`).join(" | ")}`);
    }
  }
  if (!houveVariante) console.log("Nenhum.");

  if (semJogo.size) {
    console.log("\nℹ️ Apostas cujo match não casou com nenhum jogo finalizado:");
    semJogo.forEach((m) => console.log(`   - ${m}`));
  }
}

main().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});