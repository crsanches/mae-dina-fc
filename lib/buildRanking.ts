import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
  } from "firebase/firestore";
  
  import { db }
  from "./firebase";
  
  import { calculatePoints }
  from "./calculatePoints";

  import {
    FaseCopa,
    obterPesoDaFase
  } from "./copas";

  
  /* =========================
     TYPES
  ========================= */
  
  export type AuditGame = {
  
    jogo: string;
  
    resultado: string;
  
    palpite: string;
  
    pontosPlacar: number;
  
    pontosVencedor: number;
  
    pontosEmpate: number;
  
    total: number;
  
    desempate: number | null;
  
    exato: boolean;
  
    createdAt?: number;

    fase?: string;
  
  };
  
  export type RankingUser = {

    uid?: string;
  
    username: string;
  
    nome: string;
  
    points: number;

    porFase: {
        grupos: number;
        oitavas: number;
        quartas: number;
        semi: number;
        final: number;
      };
  
    exatos: number;
  
    aproximacaoVencedor: number;
  
    aproximacaoEmpate: number;
  
    acertosParciais: number;
  
    ultimoHorarioAposta: number;
  
    jogos: AuditGame[];
  
  };
  
  type Game = {
  
    teamA: string;
  
    teamB: string;
  
    resultadoA: number;
  
    resultadoB: number;

    fase?: FaseCopa;
  
  };
  
  type BetData = {
  
    userName: string;
  
    match: string;
  
    golsA: string;
  
    golsB: string;
  
    createdAt?: {
      seconds: number;
    };
  
    nome?: string;
  
    username?: string;
  
    uid?: string;
  
  };
  
  /* =========================
     BUILD RANKING
  ========================= */
  
  export async function buildRanking(
    groupId: string
  ) {
  
    const betsQuery =
      query(
        collection(db, "bets"),
        where(
          "groupId",
          "==",
          groupId
        )
      );
  
    const betsSnapshot =
      await getDocs(betsQuery);
  
    const gamesSnapshot =
      await getDocs(
        collection(db, "games")
      );
  
    const rankingMap:
      Record<string, RankingUser> = {};
  
    /* =========================
   REMOVE DUPLICADAS
========================= */

const latestBetsMap:
Record<string, BetData> = {};

betsSnapshot.forEach((betDoc) => {

const bet =
  betDoc.data() as BetData;

const key =
  `${bet.userName}__${bet.match}`;

const current =
  latestBetsMap[key];

const currentTime =
  current?.createdAt?.seconds || 0;

const newTime =
  bet.createdAt?.seconds || 0;

if (
  !current ||
  newTime > currentTime
) {

  latestBetsMap[key] = bet;

}

});

const uniqueBets =
Object.values(latestBetsMap);

/* =========================
 LOOP APOSTAS
========================= */

for (const bet of uniqueBets) {

    const nome =

    bet.username ||
  
    bet.userName ||
  
    bet.nome ||
  
    "Anônimo";

    let username =
  nome;

// =========================
// FALLBACK USERNAME
// =========================

if (
  !bet.username &&
  bet.uid
) {

  try {

    const userRef =
      doc(
        db,
        "users",
        bet.uid
      );

    const userSnap =
      await getDoc(userRef);

    if (
      userSnap.exists()
    ) {

      username =
        userSnap.data()
          .username || nome;

    }

  } catch {}

}

// =========================
// BUSCA JOGO
// =========================

let gameFound:
  Game | null = null;

gamesSnapshot.forEach((gameDoc) => {

  const game =
    gameDoc.data() as Game;

  if (

    `${game.teamA} x ${game.teamB}` ===
      bet.match &&

    game.resultadoA != null &&
    game.resultadoB != null

  ) {

    gameFound = game;

  }

});

if (!gameFound) {
  continue;
}

const game =
  gameFound as Game;

const resultadoA =
  Number(game.resultadoA);

const resultadoB =
  Number(game.resultadoB);

const apostaA =
  Number(bet.golsA);

const apostaB =
  Number(bet.golsB);

// =========================
// PONTOS
// =========================

const total =
  calculatePoints({

    apostaA,
    apostaB,

    resultadoA,
    resultadoB

  });

  const fase =
  game.fase || "grupos";

const peso =
  obterPesoDaFase(fase);

const totalPonderado =
  total * peso;

// =========================
// EXATO
// =========================

const exato =

  apostaA === resultadoA &&
  apostaB === resultadoB;

// =========================
// DISTÂNCIA
// =========================

const distancia =

  Math.abs(
    apostaA - resultadoA
  ) +

  Math.abs(
    apostaB - resultadoB
  );

// =========================
// ACERTOS PARCIAIS
// =========================

let acertosParciais = 0;

if (apostaA === resultadoA) {
  acertosParciais += 1;
}

if (apostaB === resultadoB) {
  acertosParciais += 1;
}

if (exato) {
  acertosParciais = 0;
}

// =========================
// CRIA USER
// =========================

if (!rankingMap[username]) {

  rankingMap[username] = {

   
  uid:
  bet.uid ||

  "",

    username,

    nome,

    points: 0,

    porFase: {

        grupos: 0,
      
        oitavas: 0,
      
        quartas: 0,
      
        semi: 0,
      
        final: 0,
      
      },

    exatos: 0,

    aproximacaoVencedor: 0,

    aproximacaoEmpate: 0,

    acertosParciais: 0,

    ultimoHorarioAposta: 0,

    jogos: []

  };

}

// =========================
// SOMA PONTOS
// =========================

rankingMap[username].points +=
  totalPonderado;

rankingMap[username]
  .porFase[fase] +=
    totalPonderado;

// =========================
// EXATOS
// =========================

if (exato) {

  rankingMap[username]
    .exatos += 1;

}

// =========================
// ACERTOS PARCIAIS
// =========================

rankingMap[username]
  .acertosParciais +=
    acertosParciais;

// =========================
// ACERTOU VENCEDOR
// =========================

const acertouVencedor =

  (
    apostaA > apostaB &&
    resultadoA > resultadoB
  ) ||

  (
    apostaA < apostaB &&
    resultadoA < resultadoB
  );

// =========================
// ACERTOU EMPATE
// =========================

const acertouEmpate =

  apostaA === apostaB &&
  resultadoA === resultadoB;

// =========================
// APROXIMAÇÃO VENCEDOR
// =========================

if (acertouVencedor) {

  rankingMap[username]
    .aproximacaoVencedor +=
      distancia;

}

// =========================
// APROXIMAÇÃO EMPATE
// =========================

if (acertouEmpate) {

  rankingMap[username]
    .aproximacaoEmpate +=
      distancia;

}

// =========================
// HORÁRIO
// =========================

const horario =
  bet.createdAt?.seconds || 0;

if (

  horario <
    rankingMap[username]
      .ultimoHorarioAposta ||

  rankingMap[username]
    .ultimoHorarioAposta === 0

) {

  rankingMap[username]
    .ultimoHorarioAposta =
      horario;

}

// =========================
// JOGOS (AUDITORIA)
// =========================

rankingMap[username]
  .jogos.push({


    fase:
     game.fase || "grupos",

    jogo:
      bet.match,

    resultado:
      `${resultadoA} x ${resultadoB}`,

    palpite:
      `${apostaA} x ${apostaB}`,

    pontosPlacar:
      exato ? 5 : 0,

    pontosVencedor:
      acertouVencedor ? 3 : 0,

    pontosEmpate:
      acertouEmpate ? 2 : 0,

    total,

    desempate:

      acertouVencedor ||
      acertouEmpate ||
      exato

        ? distancia

        : null,

    exato,

    createdAt:
      bet.createdAt?.seconds

  });

}



return Object
  .values(rankingMap)

  .sort((a, b) => {

    if (
      b.points !== a.points
    ) {

      return (
        b.points - a.points
      );

    }

    if (
      b.exatos !== a.exatos
    ) {

      return (
        b.exatos - a.exatos
      );

    }

    if (
      a.aproximacaoVencedor !==
      b.aproximacaoVencedor
    ) {

      return (
        a.aproximacaoVencedor -
        b.aproximacaoVencedor
      );

    }

    if (
      a.aproximacaoEmpate !==
      b.aproximacaoEmpate
    ) {

      return (
        a.aproximacaoEmpate -
        b.aproximacaoEmpate
      );

    }

    if (
      b.acertosParciais !==
      a.acertosParciais
    ) {

      return (
        b.acertosParciais -
        a.acertosParciais
      );

    }

    return (
      a.ultimoHorarioAposta -
      b.ultimoHorarioAposta
    );

  });
  }