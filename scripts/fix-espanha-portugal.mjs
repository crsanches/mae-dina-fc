// fix-espanha-portugal.mjs
// Uso:
//   node fix-espanha-portugal.mjs           → só consulta e faz backup (DRY RUN)
//   node fix-espanha-portugal.mjs --apply   → executa a migração de verdade

import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const MATCH_ANTIGO = "Espanha x Portugal";
const MATCH_NOVO = "Portugal x Espanha";
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "🔥 MODO APPLY — vai gravar!" : "🔍 DRY RUN — só leitura\n");

  // ── 1. Localiza o jogo ──────────────────────────────
  const gamesSnap = await db
    .collection("games")
    .where("teamA", "==", "Espanha")
    .where("teamB", "==", "Portugal")
    .get();

  if (gamesSnap.empty) {
    console.log("❌ Jogo Espanha x Portugal não encontrado. Abortando.");
    return;
  }
  if (gamesSnap.size > 1) {
    console.log("⚠️ Mais de um jogo encontrado! Verifique manualmente:");
    gamesSnap.docs.forEach((d) => console.log("  -", d.id, d.data().matchDate));
    return;
  }

  const gameDoc = gamesSnap.docs[0];
  const game = gameDoc.data();
  console.log("🎮 Jogo encontrado:", gameDoc.id);
  console.log("   ", game.teamA, "x", game.teamB, "|", game.matchDate);
  console.log("    fase:", game.fase, "| grupo:", game.grupo ?? "-");
  console.log("    finished:", game.finished ?? false, "\n");

  // ── 2. Consulta as apostas (todos os grupos) ────────
  const betsSnap = await db
    .collection("bets")
    .where("match", "==", MATCH_ANTIGO)
    .get();

  console.log(`🎯 ${betsSnap.size} apostas encontradas para "${MATCH_ANTIGO}"\n`);

  const porGrupo = {};
  betsSnap.docs.forEach((d) => {
    const b = d.data();
    porGrupo[b.groupId] = (porGrupo[b.groupId] || 0) + 1;
    console.log(
        `   ${d.id} | grupo ${b.groupId} | ${b.nome} | palpite ${b.golsA} x ${b.golsB}`
      );
  });
  console.log("\n📊 Por grupo:", porGrupo);

  // ── 3. Backup em JSON ───────────────────────────────
  const backup = {
    exportadoEm: new Date().toISOString(),
    game: { id: gameDoc.id, ...game },
    bets: betsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
  const backupFile = `backup-espanha-portugal-${Date.now()}.json`;
  writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`\n💾 Backup salvo em ${backupFile}`);

  if (!APPLY) {
    console.log("\n✅ Dry run concluído. Revise o backup e rode com --apply para migrar.");
    return;
  }

  // ── 4. Migração em batch (atômica) ──────────────────
  const batch = db.batch();

  const gameUpdate = {
    teamA: game.teamB,
    teamB: game.teamA,
    emojiA: game.emojiB,
    emojiB: game.emojiA,
  };
  if (game.match) gameUpdate.match = MATCH_NOVO;
  if (game.resultadoA != null && game.resultadoB != null) {
    gameUpdate.resultadoA = game.resultadoB;
    gameUpdate.resultadoB = game.resultadoA;
  }
  batch.update(gameDoc.ref, gameUpdate);

  betsSnap.docs.forEach((d) => {
    const b = d.data();
    batch.update(d.ref, {
      match: MATCH_NOVO,
      golsA: b.golsB,
      golsB: b.golsA,
    });
  });

  await batch.commit();
  console.log(`\n✅ Migração concluída: 1 jogo + ${betsSnap.size} apostas invertidos.`);
  console.log("   Agora o jogo está como Portugal x Espanha, alinhado com a API.");
}

main().then(() => process.exit(0));