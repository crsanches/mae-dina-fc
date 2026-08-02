const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

const db = admin.firestore();

async function migrarBets() {
  console.log("Lendo jogos...");

  const gamesSnap = await db.collection("games").get();

  const gamesMap = new Map();

  gamesSnap.forEach((doc) => {
    const data = doc.data();

    if (data.match && data.torneioId) {
      gamesMap.set(data.match, data.torneioId);
    }
  });

  console.log(`${gamesMap.size} jogos carregados.`);

  const betsSnap = await db.collection("bets").get();

  let migradas = 0;
  let ignoradas = 0;
  let semJogo = 0;

  for (const docSnap of betsSnap.docs) {

    const bet = docSnap.data();

    // já migrada
    if (bet.torneioId) {
        ignoradas++;
        continue;
    }

    const torneioId = gamesMap.get(bet.match);

    if (!torneioId) {
        console.log(`❌ Não encontrei jogo: ${bet.match}`);
        semJogo++;
        continue;
    }

    const [teamA, teamB] = bet.match.split(" x ");

    const novoId =
        `${torneioId}-${bet.groupId}-${bet.userName}-${teamA}-${teamB}`;

    const novoRef = db.collection("bets").doc(novoId);

    await novoRef.set({
        ...bet,
        torneioId,
    });

    console.log("✅", novoId);

    migradas++;
}


  console.log("");
  console.log("=========== MIGRAÇÃO ===========");
  console.log("Migradas :", migradas);
  console.log("Ignoradas:", ignoradas);
  console.log("Sem jogo :", semJogo);
  console.log("================================");
}

migrarBets()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });