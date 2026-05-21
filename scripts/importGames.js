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
    teamA: "Cruzeiro",

    emojiA:
      "https://www.thesportsdb.com/images/media/team/badge/yvwvtu1448813215.png",

    teamB: "Santos",

    emojiB:
      "https://www.thesportsdb.com/images/media/team/badge/uwtpvp1422030158.png",

    phase: "Brasileirão",

    matchDate:
      "2026-05-23T18:30"
  },

  {
    teamA: "Internacional",

    emojiA:
      "https://www.thesportsdb.com/images/media/team/badge/xwvutr1421432011.png",

    teamB: "Athletico-PR",

    emojiB:
      "https://www.thesportsdb.com/images/media/team/badge/rvwtus1421432058.png",

    phase: "Brasileirão",

    matchDate:
      "2026-05-23T18:30"
  },

  {
    teamA: "São Paulo",

    emojiA:
      "https://www.thesportsdb.com/images/media/team/badge/qxxwrs1421431864.png",

    teamB: "Vasco",

    emojiB:
      "https://www.thesportsdb.com/images/media/team/badge/vwpvrr1421432114.png",

    phase: "Brasileirão",

    matchDate:
      "2026-05-23T21:00"
  },

  {
    teamA: "Palmeiras",

    emojiA:
      "https://www.thesportsdb.com/images/media/team/badge/d0q2oh1720287148.png",

    teamB: "Vitória",

    emojiB:
      "https://www.thesportsdb.com/images/media/team/badge/wtsxrp1421432083.png",

    phase: "Brasileirão",

    matchDate:
      "2026-05-24T11:00"
  },

  {
    teamA: "Grêmio",

    emojiA:
      "https://www.thesportsdb.com/images/media/team/badge/xqvwrt1421432031.png",

    teamB: "Flamengo",

    emojiB:
      "https://www.thesportsdb.com/images/media/team/badge/uyrwrr1421431897.png",

    phase: "Brasileirão",

    matchDate:
      "2026-05-24T16:00"
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