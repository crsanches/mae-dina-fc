// fix-bet-ids.mjs
// Uso:
//   node fix-bet-ids.mjs           → DRY RUN (só mostra o que faria)
//   node fix-bet-ids.mjs --apply   → executa

import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync("../serviceAccount.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "🔥 MODO APPLY — vai gravar!\n" : "🔍 DRY RUN — só leitura\n");

  const betsSnap = await db
    .collection("bets")
    .where("match", "==", "Portugal x Espanha")
    .get();

  console.log(`🎯 ${betsSnap.size} apostas com match "Portugal x Espanha"\n`);

  const paraMigrar = betsSnap.docs.filter((d) =>
    d.id.includes("-Espanha-Portugal")
  );

  console.log(`📦 ${paraMigrar.length} com ID antigo (Espanha-Portugal):\n`);

  const batch = db.batch();

  for (const d of paraMigrar) {
    const novoId = d.id.replace("-Espanha-Portugal", "-Portugal-Espanha");
    console.log(`   ${d.id}`);
    console.log(`   → ${novoId}\n`);

    if (APPLY) {
      const novoRef = db.collection("bets").doc(novoId);
      batch.set(novoRef, d.data());
      batch.delete(d.ref);
    }
  }

  if (!APPLY) {
    console.log("✅ Dry run concluído. Rode com --apply para migrar os IDs.");
    return;
  }

  await batch.commit();
  console.log(`✅ ${paraMigrar.length} apostas migradas para os novos IDs.`);
}

main().then(() => process.exit(0));