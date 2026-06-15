const admin = require("firebase-admin");

// Inicializa com suas credenciais
const serviceAccount = require("./serviceAccountKey.json"); // ajuste o caminho

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixUsername() {
  const UID = "7Ffs8WGcmaWGailJk9Mb4WKV1xq2";
  const CORRECT_USERNAME = "Líder da porra toda!!!";

  const snapshot = await db
    .collection("bets")
    .where("uid", "==", UID)
    .where("username", "!=", CORRECT_USERNAME)
    .get();

  if (snapshot.empty) {
    console.log("Nenhum documento encontrado para corrigir.");
    return;
  }

  console.log(`Documentos a corrigir: ${snapshot.size}`);

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    console.log(`  Corrigindo doc ${doc.id} — username atual: "${doc.data().username}"`);
    batch.update(doc.ref, { username: CORRECT_USERNAME });
  });

  await batch.commit();
  console.log("✅ Todos os documentos foram corrigidos!");
}

fixUsername().catch(console.error);