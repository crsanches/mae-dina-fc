const admin =
  require("firebase-admin");

const serviceAccount =
  require("./serviceAccountKey.json");

admin.initializeApp({
  credential:
    admin.credential.cert(
      serviceAccount
    )
});

const db =
  admin.firestore();

async function migrar() {

  const betsSnapshot =
    await db
      .collection("bets")
      .get();

  const usersSnapshot =
    await db
      .collection("users")
      .get();

  const users = [];

  usersSnapshot.forEach((doc) => {

    users.push({
      id: doc.id,
      ...doc.data()
    });

  });

  for (const betDoc of betsSnapshot.docs) {

    const bet =
      betDoc.data();

    // pula se já migrou
    if (
      bet.username &&
      bet.nome
    ) {
      continue;
    }

    const nomeReal =
      bet.userName;

    if (!nomeReal) {
      continue;
    }

    // tenta encontrar usuário
    const user =
      users.find((u) =>

        u.displayName === nomeReal ||

        u.nome === nomeReal ||

        u.name === nomeReal ||

        u.username === nomeReal
      );

    if (!user) {

      console.log(
        "Usuário não encontrado:",
        nomeReal
      );

      continue;

    }

    await betDoc.ref.update({

      username:

        user.username ||

        nomeReal,

      nome:
        nomeReal

    });

    console.log(
      "Migrado:",
      nomeReal,
      "→",
      user.username
    );

  }

  console.log(
    "Migração concluída 😄"
  );

}

migrar();