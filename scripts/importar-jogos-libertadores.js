/**
 * importar-jogos-libertadores.js
 *
 * Cria os 16 jogos das oitavas de final da Libertadores 2026
 * (8 confrontos, ida e volta) na coleção `games`, já com
 * torneioId: "libertadores2026".
 *
 * Não depende do config/appConfig — o torneioId é fixo neste
 * script, então você pode rodar isso a qualquer momento.
 *
 * Uso:
 *   node importar-jogos-libertadores.js --dry-run   (só mostra o que criaria)
 *   node importar-jogos-libertadores.js --apply     (cria de verdade)
 */

const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const TORNEIO_ID = "libertadores2026";
const FASE = "Oitavas";

const DRY_RUN = !process.argv.includes("--apply");

// =========================
// ESCUDOS
// Só os times brasileiros repetem logo de public/logos/ (já usados
// na Copa do Brasil). Os demais (clubes de outros países) ainda não
// têm arquivo — vão cair no fallback ⚽ até você adicionar os PNGs
// correspondentes em public/logos/.
// =========================

const ESCUDOS = {
  "Corinthians": "/logos/corinthians.png",
  "Cruzeiro": "/logos/cruzeiro.png",
  "Flamengo": "/logos/flamengo.png",
  "Mirassol": "/logos/mirassol.png",
  "Palmeiras": "/logos/palmeiras.png",
  "Fluminense": "/logos/fluminense.png",
  "Estudiantes": "/logos/estudientes.png", 
  "Universidad Católica": "/logos/universidad catolica.png",
  "Rosario Central": "/logos/rosario central.png",
  "Tolima": "/logos/tolima.png", 
  "Independiente del Valle": "/logos/independiente del valle.png", 
  "LDU": "/logos/ldu.png",
  "Cerro Porteño": "/logos/cerro porteño.png",
  "Platense": "/logos/platense.png",
  "Coquimbo Unido": "/logos/coquimbo unido.png", 
  "Independiente Rivadavia": "/logos/independiente rivadavia.png",
  // sem escudo mapeado ainda (usam ⚽ até você adicionar o arquivo):
  // "Estudiantes", "Universidad Católica", "Rosario Central",
  // "Tolima", "Independiente del Valle", "LDU", "Cerro Porteño",
  // "Platense", "Coquimbo Unido", "Independiente Rivadavia"
};

// =========================
// JOGOS (ida e volta)
// Horários conforme tabela oficial — ajuste o fuso se necessário.
// =========================

const jogos = [
  // ── Jogo 1 ──
  { teamA: "Estudiantes", teamB: "Universidad Católica", matchDate: "2026-08-11T21:30" },
  { teamA: "Universidad Católica", teamB: "Estudiantes", matchDate: "2026-08-18T21:30" },

  // ── Jogo 2 ──
  { teamA: "Rosario Central", teamB: "Corinthians", matchDate: "2026-08-13T21:30" },
  { teamA: "Corinthians", teamB: "Rosario Central", matchDate: "2026-08-20T21:30" },

  // ── Jogo 3 ──
  { teamA: "Cruzeiro", teamB: "Flamengo", matchDate: "2026-08-12T21:30" },
  { teamA: "Flamengo", teamB: "Cruzeiro", matchDate: "2026-08-19T21:30" },

  // ── Jogo 4 ──
  { teamA: "Tolima", teamB: "Independiente del Valle", matchDate: "2026-08-11T21:30" },
  { teamA: "Independiente del Valle", teamB: "Tolima", matchDate: "2026-08-18T21:30" },

  // ── Jogo 5 ──
  { teamA: "Mirassol", teamB: "LDU", matchDate: "2026-08-13T19:00" },
  { teamA: "LDU", teamB: "Mirassol", matchDate: "2026-08-20T19:00" },

  // ── Jogo 6 ──
  { teamA: "Palmeiras", teamB: "Cerro Porteño", matchDate: "2026-08-12T19:00" },
  { teamA: "Cerro Porteño", teamB: "Palmeiras", matchDate: "2026-08-19T19:00" },

  // ── Jogo 7 ──
  { teamA: "Platense", teamB: "Coquimbo Unido", matchDate: "2026-08-12T19:00" },
  { teamA: "Coquimbo Unido", teamB: "Platense", matchDate: "2026-08-19T19:00" },

  // ── Jogo 8 ──
  { teamA: "Fluminense", teamB: "Independiente Rivadavia", matchDate: "2026-08-11T19:00" },
  { teamA: "Independiente Rivadavia", teamB: "Fluminense", matchDate: "2026-08-18T19:00" },
];

async function main() {

  console.log(
    DRY_RUN
      ? "=== MODO DRY-RUN (nada será criado) ==="
      : "=== MODO APPLY (criando jogos de verdade) ==="
  );

  console.log(`Torneio: ${TORNEIO_ID} | Fase: ${FASE} | Total de jogos: ${jogos.length}\n`);

  const timesSemEscudo = new Set();
  jogos.forEach((jogo) => {
    if (!ESCUDOS[jogo.teamA]) timesSemEscudo.add(jogo.teamA);
    if (!ESCUDOS[jogo.teamB]) timesSemEscudo.add(jogo.teamB);
  });
  if (timesSemEscudo.size > 0) {
    console.log(
      `⚠ Sem escudo mapeado (vai usar ⚽): ${Array.from(timesSemEscudo).join(", ")}\n`
    );
  }

  let criados = 0;

  for (const jogo of jogos) {

    const match = `${jogo.teamA} x ${jogo.teamB}`;

    console.log(`  ${jogo.matchDate}  —  ${match}`);

    if (DRY_RUN) {
      criados++;
      continue;
    }

    await db.collection("games").add({
      match,
      teamA: jogo.teamA,
      teamB: jogo.teamB,
      emojiA: ESCUDOS[jogo.teamA] || "⚽",
      emojiB: ESCUDOS[jogo.teamB] || "⚽",
      fase: FASE,
      matchDate: jogo.matchDate,
      torneioId: TORNEIO_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    criados++;
  }

  console.log(
    `\n${DRY_RUN ? "Seriam criados" : "Criados"}: ${criados} jogo(s).`
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao importar jogos:", err);
  process.exit(1);
});