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

    fase: "Oitavas",

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

    fase: "Oitavas",

    grupo,

    matchDate,

  };
}


  
 /*
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
*/
/*
const games = [
  // criando jogos da fase 32


createGame(
  "México",
  "Equador",
  "Fase32",
  "2026-06-30T22:00"
),

createGame(
  "Inglaterra",
  "RD Congo",
  "Fase32",
  "2026-07-01T13:00"
),

createGame(
  "Bélgica",
  "Senegal",
  "Fase32",
  "2026-07-01T17:00"
),  




createGame(
  "Espanha",
  "Áustria",
  "Fase32",
  "2026-07-02T16:00"
),

createGame(
  "Portugal",
  "Croácia",
  "Fase32",
  "2026-07-02T20:00"
),


createGame(
  "Suíça",
  "Argélia",
  "Fase32",
  "2026-07-03T00:00"
),





createGame(
  "Colômbia",
  "Gana",
  "Fase32",
  "2026-07-03T22:30"
),


];
*/

/*
const games = [
  // criando jogos das oitavas


createGame(
  "Canadá",
  "Marrocos",
  "Oitavas",
  "2026-07-04T14:00"
),

createGame(
  "Paraguai",
  "França",
  "Oitavas",
  "2026-07-04T18:00"
),

createGame(
  "Brasil",
  "Noruega",
  "Oitavas",
  "2026-07-05T17:00"
),

createGame(
  "México",
  "Inglaterra",
  "Oitavas",
  "2026-07-05T21:00"
),
createGame(
  "Espanha",
  "Portugal",
  "Oitavas",
  "2026-07-06T16:00"
),
createGame(
  "Estados Unidos",
  "Bélgica",
  "Oitavas",
  "2026-07-06T21:00"
),

];
 */

const games = [
  createGame(
    "Argentina",
    "Egito",
    "Oitavas",
    "2026-07-07T13:00"
  ),

  createGame(
    "Suíça",
    "Colômbia",
    "Oitavas",
    "2026-07-07T17:00"
  ),

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