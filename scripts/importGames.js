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
      "https://raw.githubusercontent.com/luizdepra/have-fun/master/football-teams/Brazil/Cruzeiro/logo.png",

    teamB: "Santos",

    emojiB:
      "https://raw.githubusercontent.com/luizdepra/have-fun/master/football-teams/Brazil/Santos/logo.png",

    phase: "Brasileirão",

    matchDate:
      "2026-05-23T18:30"
  },

  {
    teamA: "Internacional",

    emojiA:
      "https://raw.githubusercontent.com/luizdepra/have-fun/master/football-teams/Brazil/Internacional/logo.png",

    teamB: "Athletico-PR",

    emojiB:
      "https://raw.githubusercontent.com/luizdepra/have-fun/master/football-teams/Brazil/Athletico%20Paranaense/logo.png",

    phase: "Brasileirão",

    matchDate:
      "2026-05-23T18:30"
  },

  {
    teamA: "São Paulo",

    emojiA:
      "https://raw.githubusercontent.com/luizdepra/have-fun/master/football-teams/Brazil/Sao%20Paulo/logo.png",

    teamB: "Vasco",

    emojiB:
      "https://raw.githubusercontent.com/luizdepra/have-fun/master/football-teams/Brazil/Vasco/logo.png",

    phase: "Brasileirão",

    matchDate:
      "2026-05-23T21:00"
  },

  {
    teamA: "Palmeiras",

    emojiA:
      "https://raw.githubusercontent.com/luizdepra/have-fun/master/football-teams/Brazil/Palmeiras/logo.png",

    teamB: "Vitória",

    emojiB:
      "https://raw.githubusercontent.com/luizdepra/have-fun/master/football-teams/Brazil/Vitoria/logo.png",

    phase: "Brasileirão",

    matchDate:
      "2026-05-24T11:00"
  },

  {
    teamA: "Grêmio",

    emojiA:
      "https://raw.githubusercontent.com/luizdepra/have-fun/master/football-teams/Brazil/Gremio/logo.png",

    teamB: "Flamengo",

    emojiB:
      "https://raw.githubusercontent.com/luizdepra/have-fun/master/football-teams/Brazil/Flamengo/logo.png",

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