const { initializeApp } = require("firebase/app");

const WORLD_CUP_TEAMS = {
  "México": "🇲🇽",
  "África do Sul": "🇿🇦",
  "Coreia do Sul": "🇰🇷",
  "Tchéquia": "🇨🇿",

  "Canadá": "🇨🇦",
  "Bósnia e Herzegovina": "🇧🇦",
  "Catar": "🇶🇦",
  "Suíça": "🇨🇭",

  "Brasil": "🇧🇷",
  "Marrocos": "🇲🇦",
  "Haiti": "🇭🇹",
  "Escócia": "🏴",

  "Estados Unidos": "🇺🇸",
  "Paraguai": "🇵🇾",
  "Austrália": "🇦🇺",
  "Turquia": "🇹🇷",

  "Alemanha": "🇩🇪",
  "Curaçao": "🇨🇼",
  "Costa do Marfim": "🇨🇮",
  "Equador": "🇪🇨",

  "Holanda": "🇳🇱",
  "Japão": "🇯🇵",
  "Suécia": "🇸🇪",
  "Tunísia": "🇹🇳",

  "Bélgica": "🇧🇪",
  "Egito": "🇪🇬",
  "Irã": "🇮🇷",
  "Nova Zelândia": "🇳🇿",

  "Espanha": "🇪🇸",
  "Cabo Verde": "🇨🇻",
  "Arábia Saudita": "🇸🇦",
  "Uruguai": "🇺🇾",

  "França": "🇫🇷",
  "Senegal": "🇸🇳",
  "Iraque": "🇮🇶",
  "Noruega": "🇳🇴",

  "Argentina": "🇦🇷",
  "Argélia": "🇩🇿",
  "Áustria": "🇦🇹",
  "Jordânia": "🇯🇴",

  "Portugal": "🇵🇹",
  "RD Congo": "🇨🇩",
  "Uzbequistão": "🇺🇿",
  "Colômbia": "🇨🇴",

  "Inglaterra": "🏴",
  "Croácia": "🇭🇷",
  "Gana": "🇬🇭",
  "Panamá": "🇵🇦"
};

function createGame(
  teamA,
  teamB,
  grupo,
  matchDate
) {
  return {

    teamA,
    emojiA:
      WORLD_CUP_TEAMS[teamA],

    teamB,
    emojiB:
      WORLD_CUP_TEAMS[teamB],

    fase: "Grupos",

    grupo,

    matchDate

  };
}

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

function createGame(
  teamA,
  teamB,
  grupo,
  matchDate
) 
{

  return {

    teamA,
    emojiA:
      WORLD_CUP_TEAMS[teamA],

    teamB,
    emojiB:
      WORLD_CUP_TEAMS[teamB],

    fase: "Grupos",

    grupo,

    matchDate,

  };
}


  
  const games = [

   // =====================
// GRUPO A
// =====================

createGame(
  "México",
  "África do Sul",
  "A",
  "2026-06-11T16:00"
),

createGame(
  "Coreia do Sul",
  "Tchéquia",
  "A",
  "2026-06-11T23:00"
),

createGame(
  "Tchéquia",
  "África do Sul",
  "A",
  "2026-06-18T13:00"
),

createGame(
  "México",
  "Coreia do Sul",
  "A",
  "2026-06-18T22:00"
),

createGame(
  "África do Sul",
  "Coreia do Sul",
  "A",
  "2026-06-24T22:00"
),

createGame(
  "Tchéquia",
  "México",
  "A",
  "2026-06-24T22:00"
),

// =====================
// GRUPO B
// =====================

createGame(
  "Canadá",
  "Bósnia e Herzegovina",
  "B",
  "2026-06-12T16:00"
),

createGame(
  "Catar",
  "Suíça",
  "B",
  "2026-06-13T16:00"
),

createGame(
  "Suíça",
  "Bósnia e Herzegovina",
  "B",
  "2026-06-18T16:00"
),

createGame(
  "Canadá",
  "Catar",
  "B",
  "2026-06-18T19:00"
),

createGame(
  "Suíça",
  "Canadá",
  "B",
  "2026-06-24T16:00"
),

createGame(
  "Bósnia e Herzegovina",
  "Catar",
  "B",
  "2026-06-24T16:00"
),

// =====================
// GRUPO C
// =====================

createGame(
  "Brasil",
  "Marrocos",
  "C",
  "2026-06-13T19:00"
),

createGame(
  "Haiti",
  "Escócia",
  "C",
  "2026-06-13T22:00"
),

createGame(
  "Escócia",
  "Marrocos",
  "C",
  "2026-06-19T19:00"
),

createGame(
  "Brasil",
  "Haiti",
  "C",
  "2026-06-19T21:30"
),

createGame(
  "Marrocos",
  "Haiti",
  "C",
  "2026-06-24T19:00"
),

createGame(
  "Escócia",
  "Brasil",
  "C",
  "2026-06-24T19:00"
),

// =====================
// GRUPO D
// =====================

createGame(
  "Estados Unidos",
  "Paraguai",
  "D",
  "2026-06-12T22:00"
),

createGame(
  "Austrália",
  "Turquia",
  "D",
  "2026-06-14T01:00"
),

createGame(
  "Estados Unidos",
  "Austrália",
  "D",
  "2026-06-19T16:00"
),

createGame(
  "Turquia",
  "Paraguai",
  "D",
  "2026-06-20T00:00"
),

createGame(
  "Turquia",
  "Estados Unidos",
  "D",
  "2026-06-25T23:00"
),

createGame(
  "Paraguai",
  "Austrália",
  "D",
  "2026-06-25T23:00"
),
// =====================
// GRUPO E
// =====================

createGame(
  "Alemanha",
  "Curaçao",
  "E",
  "2026-06-14T14:00"
),

createGame(
  "Costa do Marfim",
  "Equador",
  "E",
  "2026-06-14T20:00"
),

createGame(
  "Alemanha",
  "Costa do Marfim",
  "E",
  "2026-06-20T17:00"
),

createGame(
  "Equador",
  "Curaçao",
  "E",
  "2026-06-20T21:00"
),

createGame(
  "Curaçao",
  "Costa do Marfim",
  "E",
  "2026-06-25T17:00"
),

createGame(
  "Equador",
  "Alemanha",
  "E",
  "2026-06-25T17:00"
),

// =====================
// GRUPO F
// =====================

createGame(
  "Holanda",
  "Japão",
  "F",
  "2026-06-14T17:00"
),

createGame(
  "Suécia",
  "Tunísia",
  "F",
  "2026-06-14T23:00"
),

createGame(
  "Holanda",
  "Suécia",
  "F",
  "2026-06-20T14:00"
),

createGame(
  "Tunísia",
  "Japão",
  "F",
  "2026-06-21T01:00"
),

createGame(
  "Tunísia",
  "Holanda",
  "F",
  "2026-06-25T20:00"
),

createGame(
  "Japão",
  "Suécia",
  "F",
  "2026-06-25T20:00"
),

// =====================
// GRUPO G
// =====================

createGame(
  "Bélgica",
  "Egito",
  "G",
  "2026-06-15T16:00"
),

createGame(
  "Irã",
  "Nova Zelândia",
  "G",
  "2026-06-15T22:00"
),

createGame(
  "Bélgica",
  "Irã",
  "G",
  "2026-06-21T16:00"
),

createGame(
  "Nova Zelândia",
  "Egito",
  "G",
  "2026-06-21T22:00"
),

createGame(
  "Nova Zelândia",
  "Bélgica",
  "G",
  "2026-06-27T00:00"
),

createGame(
  "Egito",
  "Irã",
  "G",
  "2026-06-27T00:00"
),

// =====================
// GRUPO H
// =====================

createGame(
  "Espanha",
  "Cabo Verde",
  "H",
  "2026-06-15T13:00"
),

createGame(
  "Arábia Saudita",
  "Uruguai",
  "H",
  "2026-06-15T19:00"
),

createGame(
  "Espanha",
  "Arábia Saudita",
  "H",
  "2026-06-21T13:00"
),

createGame(
  "Uruguai",
  "Cabo Verde",
  "H",
  "2026-06-21T19:00"
),

createGame(
  "Cabo Verde",
  "Arábia Saudita",
  "H",
  "2026-06-26T21:00"
),

createGame(
  "Uruguai",
  "Espanha",
  "H",
  "2026-06-26T21:00"
),

// =====================
// GRUPO I
// =====================

createGame(
  "França",
  "Senegal",
  "I",
  "2026-06-16T16:00"
),

createGame(
  "Iraque",
  "Noruega",
  "I",
  "2026-06-16T19:00"
),

createGame(
  "França",
  "Iraque",
  "I",
  "2026-06-22T18:00"
),

createGame(
  "Noruega",
  "Senegal",
  "I",
  "2026-06-22T21:00"
),

createGame(
  "Noruega",
  "França",
  "I",
  "2026-06-26T16:00"
),

createGame(
  "Senegal",
  "Iraque",
  "I",
  "2026-06-26T16:00"
),

// =====================
// GRUPO J
// =====================

createGame(
  "Argentina",
  "Argélia",
  "J",
  "2026-06-16T22:00"
),

createGame(
  "Áustria",
  "Jordânia",
  "J",
  "2026-06-17T01:00"
),

createGame(
  "Argentina",
  "Áustria",
  "J",
  "2026-06-22T14:00"
),

createGame(
  "Jordânia",
  "Argélia",
  "J",
  "2026-06-23T00:00"
),

createGame(
  "Argélia",
  "Áustria",
  "J",
  "2026-06-27T23:00"
),

createGame(
  "Jordânia",
  "Argentina",
  "J",
  "2026-06-27T23:00"
),

// =====================
// GRUPO K
// =====================

createGame(
  "Portugal",
  "RD Congo",
  "K",
  "2026-06-17T14:00"
),

createGame(
  "Uzbequistão",
  "Colômbia",
  "K",
  "2026-06-17T23:00"
),

createGame(
  "Portugal",
  "Uzbequistão",
  "K",
  "2026-06-23T14:00"
),

createGame(
  "Colômbia",
  "RD Congo",
  "K",
  "2026-06-23T23:00"
),

createGame(
  "Colômbia",
  "Portugal",
  "K",
  "2026-06-27T20:30"
),

createGame(
  "RD Congo",
  "Uzbequistão",
  "K",
  "2026-06-27T20:30"
),

// =====================
// GRUPO L
// =====================

createGame(
  "Inglaterra",
  "Croácia",
  "L",
  "2026-06-17T17:00"
),

createGame(
  "Gana",
  "Panamá",
  "L",
  "2026-06-17T20:00"
),

createGame(
  "Inglaterra",
  "Gana",
  "L",
  "2026-06-23T17:00"
),

createGame(
  "Panamá",
  "Croácia",
  "L",
  "2026-06-23T20:00"
),

createGame(
  "Panamá",
  "Inglaterra",
  "L",
  "2026-06-27T18:00"
),

createGame(
  "Croácia",
  "Gana",
  "L",
  "2026-06-27T18:00"
),
  
  ];


/*
const games = [
  {
    teamA: "EC Vitória",
    emojiA: "/logos/vitoria.png",
    teamB: "Internacional",
    emojiB: "/logos/internacional.png",
    fase: "Brasileirão",
    matchDate: "2026-05-23T17:00"
  },
  {
    teamA: "São Paulo",
    emojiA: "/logos/sao-paulo.png",
    teamB: "Botafogo",
    emojiB: "/logos/botafogo.png",
    faase: "Brasileirão",
    matchDate: "2026-05-23T17:00"
  },
  {
    teamA: "Grêmio",
    emojiA: "/logos/gremio.png",
    teamB: "Santos",
    emojiB: "/logos/santos.png",
    fase: "Brasileirão",
    matchDate: "2026-05-23T19:00"
  },
  {
    teamA: "Mirassol",
    emojiA: "/logos/mirassol.png",
    teamB: "Fluminense",
    emojiB: "/logos/fluminense.png",
    fase: "Brasileirão",
    matchDate: "2026-05-23T19:00"
  },
  {
    teamA: "Flamengo",
    emojiA: "/logos/flamengo.png",
    teamB: "Palmeiras",
    emojiB: "/logos/palmeiras.png",
    fase: "Brasileirão",
    matchDate: "2026-05-23T21:00"
  },
  {
    teamA: "Remo",
    emojiA: "/logos/remo.png",
    teamB: "Athletico-PR",
    emojiB: "/logos/athletico-pr.png",
    fase: "Brasileirão",
    matchDate: "2026-05-24T16:00"
  },
  {
    teamA: "Cruzeiro",
    emojiA: "/logos/cruzeiro.png",
    teamB: "Chapecoense",
    emojiB: "/logos/chapecoense.png",
    fase: "Brasileirão",
    matchDate: "2026-05-24T16:00"
  },
  {
    teamA: "Corinthians",
    emojiA: "/logos/corinthians.png",
    teamB: "Atlético-MG",
    emojiB: "/logos/atletico-mg.png",
    fase: "Brasileirão",
    matchDate: "2026-05-24T18:30"
  },
  {
    teamA: "Vasco da Gama",
    emojiA: "/logos/vasco.png",
    teamB: "Bragantino",
    emojiB: "/logos/bragantino.png",
    fase: "Brasileirão",
    matchDate: "2026-05-24T20:30"
  },
  {
    teamA: "Coritiba",
    emojiA: "/logos/coritiba.png",
    teamB: "Bahia",
    emojiB: "/logos/bahia.png",
    fase: "Brasileirão",
    matchDate: "2026-05-25T20:00"
  }
];
*/

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