const { initializeApp } = require("firebase/app");

const {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyDG-I0M_P9qtINf9kmceaeNOrOMSx7XIQg",
    authDomain: "mae-dina-fc.firebaseapp.com",
    projectId: "mae-dina-fc",
    storageBucket: "mae-dina-fc.firebasestorage.app",
    messagingSenderId: "204520739342",
    appId: "1:204520739342:web:d41610e7796cd0ed1ea25f"
  };

const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);

  /*
const games = [

  {
    teamA: "México",
    emojiA: "🇲🇽",

    teamB: "África do Sul",
    emojiB: "🇿🇦",

    phase: "Grupo A",

    matchDate:
      "2026-06-10T16:00"
  },

  {
    teamA: "Canadá",
    emojiA: "🇨🇦",

    teamB: "Bósnia",
    emojiB: "🇧🇦",

    phase: "Grupo B",

    matchDate:
      "2026-06-10T19:00"
  },

  {
    teamA: "Brasil",
    emojiA: "🇧🇷",

    teamB: "Marrocos",
    emojiB: "🇲🇦",

    phase: "Grupo C",

    matchDate:
      "2026-06-11T16:00"
  },

  {
    teamA: "EUA",
    emojiA: "🇺🇸",

    teamB: "Paraguai",
    emojiB: "🇵🇾",

    phase: "Grupo D",

    matchDate:
      "2026-06-11T19:00"
  },

  {
    teamA: "Alemanha",
    emojiA: "🇩🇪",

    teamB: "Costa do Marfim",
    emojiB: "🇨🇮",

    phase: "Grupo E",

    matchDate:
      "2026-06-12T13:00"
  },

  {
    teamA: "Espanha",
    emojiA: "🇪🇸",

    teamB: "Cabo Verde",
    emojiB: "🇨🇻",

    phase: "Grupo F",

    matchDate:
      "2026-06-12T16:00"
  },

  {
    teamA: "Argentina",
    emojiA: "🇦🇷",

    teamB: "Uruguai",
    emojiB: "🇺🇾",

    phase: "Grupo G",

    matchDate:
      "2026-06-12T19:00"
  },

  {
    teamA: "França",
    emojiA: "🇫🇷",

    teamB: "Senegal",
    emojiB: "🇸🇳",

    phase: "Grupo H",

    matchDate:
      "2026-06-13T13:00"
  },

  {
    teamA: "Noruega",
    emojiA: "🇳🇴",

    teamB: "Iraque",
    emojiB: "🇮🇶",

    phase: "Grupo I",

    matchDate:
      "2026-06-13T16:00"
  },

  {
    teamA: "Portugal",
    emojiA: "🇵🇹",

    teamB: "Japão",
    emojiB: "🇯🇵",

    phase: "Grupo J",

    matchDate:
      "2026-06-13T19:00"
  },

  {
    teamA: "Holanda",
    emojiA: "🇳🇱",

    teamB: "Colômbia",
    emojiB: "🇨🇴",

    phase: "Grupo K",

    matchDate:
      "2026-06-14T16:00"
  },

  {
    teamA: "Inglaterra",
    emojiA: "🏴",

    teamB: "Croácia",
    emojiB: "🇭🇷",

    phase: "Grupo L",

    matchDate:
      "2026-06-14T19:00"
  }

];
*/

const games = [
  {
    teamA: "EC Vitória",
    emojiA: "/logos/vitoria.png",
    teamB: "Internacional",
    emojiB: "/logos/internacional.png",
    phase: "Brasileirão",
    matchDate: "2026-05-23T17:00"
  },
  {
    teamA: "São Paulo",
    emojiA: "/logos/sao-paulo.png",
    teamB: "Botafogo",
    emojiB: "/logos/botafogo.png",
    phase: "Brasileirão",
    matchDate: "2026-05-23T17:00"
  },
  {
    teamA: "Grêmio",
    emojiA: "/logos/gremio.png",
    teamB: "Santos",
    emojiB: "/logos/santos.png",
    phase: "Brasileirão",
    matchDate: "2026-05-23T19:00"
  },
  {
    teamA: "Mirassol",
    emojiA: "/logos/mirassol.png",
    teamB: "Fluminense",
    emojiB: "/logos/fluminense.png",
    phase: "Brasileirão",
    matchDate: "2026-05-23T19:00"
  },
  {
    teamA: "Flamengo",
    emojiA: "/logos/flamengo.png",
    teamB: "Palmeiras",
    emojiB: "/logos/palmeiras.png",
    phase: "Brasileirão",
    matchDate: "2026-05-23T21:00"
  },
  {
    teamA: "Remo",
    emojiA: "/logos/remo.png",
    teamB: "Athletico-PR",
    emojiB: "/logos/athletico-pr.png",
    phase: "Brasileirão",
    matchDate: "2026-05-24T16:00"
  },
  {
    teamA: "Cruzeiro",
    emojiA: "/logos/cruzeiro.png",
    teamB: "Chapecoense",
    emojiB: "/logos/chapecoense.png",
    phase: "Brasileirão",
    matchDate: "2026-05-24T16:00"
  },
  {
    teamA: "Corinthians",
    emojiA: "/logos/corinthians.png",
    teamB: "Atlético-MG",
    emojiB: "/logos/atletico-mg.png",
    phase: "Brasileirão",
    matchDate: "2026-05-24T18:30"
  },
  {
    teamA: "Vasco da Gama",
    emojiA: "/logos/vasco.png",
    teamB: "Bragantino",
    emojiB: "/logos/bragantino.png",
    phase: "Brasileirão",
    matchDate: "2026-05-24T20:30"
  },
  {
    teamA: "Coritiba",
    emojiA: "/logos/coritiba.png",
    teamB: "Bahia",
    emojiB: "/logos/bahia.png",
    phase: "Brasileirão",
    matchDate: "2026-05-25T20:00"
  }
];

async function importGames() {

  for (const game of games) {

    await addDoc(
      collection(db, "games"),
      {

        match:
          `${game.teamA} x ${game.teamB}`,

        ...game,

        finished: false,

        resultadoA: null,

        resultadoB: null,

        createdAt:
          serverTimestamp()

      }
    );

    console.log(
      `✅ ${game.teamA} x ${game.teamB}`
    );

  }

  console.log(
    "🔥 Todos os jogos importados!"
  );

}

importGames();