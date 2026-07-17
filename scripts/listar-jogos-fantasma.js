/**
 * Lista jogos que o ranking conta mas o histórico não:
 * resultadoA/B preenchidos e finished !== true.
 * Também mostra os detalhes dos 5 jogos suspeitos.
 *
 * Uso: node scripts/listar-jogos-fantasma.js ./serviceAccount.json
 */

const admin = require("firebase-admin");
const fs = require("fs");

const SUSPEITOS = [
  "Alemanha x Paraguai",
  "Bélgica x Senegal",
  "Holanda x Marrocos",
  "França x Espanha",
  "Inglaterra x Argentina",
];

async function main() {
  const keyPath = process.argv[2];
  if (!keyPath) {
    console.error("Uso: node listar-jogos-fantasma.js serviceAccountKey.json");
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))),
  });
  const db = admin.firestore();

  const snap = await db.collection("games").get();

  console.log("=== JOGOS COM PLACAR MAS NÃO FINALIZADOS (contam no ranking, não no histórico) ===");
  let encontrou = false;
  snap.forEach((d) => {
    const g = d.data();
    if (g.resultadoA != null && g.resultadoB != null && g.finished !== true) {
      encontrou = true;
      console.log(`⚠️ [${d.id}] ${g.match || `${g.teamA} x ${g.teamB}`}`);
      console.log(`   placar: ${g.resultadoA} x ${g.resultadoB} | fase: ${g.fase} | status: ${g.status} | matchDate: ${g.matchDate} | idEventSportsDB: ${g.idEventSportsDB || "—"}`);
    }
  });
  if (!encontrou) console.log("Nenhum.");

  console.log("\n=== DETALHES DOS 5 JOGOS SUSPEITOS ===");
  snap.forEach((d) => {
    const g = d.data();
    const nome = g.match || `${g.teamA} x ${g.teamB}`;
    if (SUSPEITOS.includes(nome)) {
      console.log(`[${d.id}] ${nome}`);
      console.log(`   fase: ${g.fase} | matchDate: ${g.matchDate} | finished: ${g.finished} | placar: ${g.resultadoA ?? "—"} x ${g.resultadoB ?? "—"} | status: ${g.status ?? "—"} | idEventSportsDB: ${g.idEventSportsDB || "—"}`);
    }
  });
}

main().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});