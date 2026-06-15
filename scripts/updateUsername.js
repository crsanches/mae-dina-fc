const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateUsername() {
  const snapshot = await db.collection("bets")
    //.where("uid", "==", "3jqD2ezE1JRataognzD7u1cnXKh1")  
    .where("uid", "==", "7Ffs8WGcmaWGailJk9Mb4WKV1xq2")
    .get();

  if (snapshot.empty) {
    console.log("Nenhum documento encontrado.");
    return;
  }

  const batch = db.batch();

  snapshot.forEach((doc) => {
    //batch.update(doc.ref, { username: "AvalloNini" });
    batch.update(doc.ref, { username: "Líder da porra toda!!!" });
  });

  await batch.commit();
  console.log(`✅ ${snapshot.size} documentos atualizados com sucesso.`);
}

updateUsername().catch(console.error);