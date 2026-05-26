"use client";

import {
  useEffect,
  useState
} from "react";

import {
  query,
  where,
  doc,
  getDoc,
  collection,
  getDocs,
  onSnapshot
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  db,
  auth
} from "../lib/firebase";

import { calculatePoints }
from "../lib/calculatePoints";

type RankingUser = {

  username: string;

  nome: string;

  points: number;

  exatos: number;

  aproximacaoVencedor: number;

  aproximacaoEmpate: number;

  acertosParciais: number;

  ultimoHorarioAposta: number;

};

export default function RealRanking() {

  const [ranking, setRanking] =
    useState<RankingUser[]>([]);

  async function carregarRanking() {

    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      return;
    }

    // =========================
    // USUÁRIO ATUAL
    // =========================

    const userRef =
      doc(
        db,
        "users",
        currentUser.uid
      );

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {
      return;
    }

    const currentGroupId =
      userSnap.data().activeGroupId;

    // =========================
    // BUSCA APOSTAS
    // =========================

    const betsQuery =
      query(
        collection(db, "bets"),
        where(
          "groupId",
          "==",
          currentGroupId
        )
      );

    const betsSnapshot =
      await getDocs(betsQuery);

    // =========================
    // BUSCA JOGOS
    // =========================

    const gamesSnapshot =
      await getDocs(
        collection(db, "games")
      );

    // =========================
    // MAPA RANKING
    // =========================

    const rankingMap:
  Record<string, RankingUser> = {};

// =========================
// REMOVE APOSTAS DUPLICADAS
// MANTÉM SOMENTE A MAIS RECENTE
// =========================

const latestBetsMap:
  Record<string, any> = {};

betsSnapshot.forEach((betDoc) => {

  const bet = betDoc.data();

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

// =========================
// LOOP DAS APOSTAS
// =========================

for (
  const bet
  of uniqueBets
) {

  const nome =

    bet.nome ||

    bet.userName ||

    "Anônimo";

  let username =

    bet.username ||

    nome;

  // =========================
  // FALLBACK USERNAME
  // =========================

  if (
    !bet.username &&
    bet.uid
  ) {

    try {

      const oldUserRef =
        doc(
          db,
          "users",
          bet.uid
        );

      const oldUserSnap =
        await getDoc(
          oldUserRef
        );

      if (
        oldUserSnap.exists()
      ) {

        const userData =
          oldUserSnap.data();

        username =

          userData.username ||

          nome;

      }

    } catch (error) {

      console.log(
        "Erro ao buscar usuário:",
        error
      );

    }

  }

  // =========================
  // BUSCA JOGO
  // =========================

  let gameFound: any = null;

  gamesSnapshot.forEach((gameDoc) => {

    const game =
      gameDoc.data();

    if (
      game.match === bet.match &&
      game.resultadoA != null &&
      game.resultadoB != null
    ) {

      gameFound = game;

    }

  });

  if (!gameFound) {
    continue;
  }

  // =========================
  // PONTOS
  // =========================

  const calculatedPoints =
    calculatePoints({

      apostaA:
        Number(bet.golsA),

      apostaB:
        Number(bet.golsB),

      resultadoA:
        Number(gameFound.resultadoA),

      resultadoB:
        Number(gameFound.resultadoB)

    });

  // =========================
  // EXATO
  // =========================

  const exato =

    Number(bet.golsA) ===
    Number(gameFound.resultadoA) &&

    Number(bet.golsB) ===
    Number(gameFound.resultadoB);

  // =========================
  // DISTÂNCIA
  // =========================

  const distancia =

    Math.abs(
      Number(bet.golsA) -
      Number(gameFound.resultadoA)
    ) +

    Math.abs(
      Number(bet.golsB) -
      Number(gameFound.resultadoB)
    );

  // =========================
  // ACERTOS PARCIAIS
  // =========================

  let acertosParciais = 0;

  if (
    Number(bet.golsA) ===
    Number(gameFound.resultadoA)
  ) {

    acertosParciais += 1;

  }

  if (
    Number(bet.golsB) ===
    Number(gameFound.resultadoB)
  ) {

    acertosParciais += 1;

  }

  if (exato) {

    acertosParciais = 0;

  }

  // =========================
  // CRIA USER
  // =========================

  if (!rankingMap[nome]) {

    rankingMap[nome] = {

      username,

      nome,

      points: 0,

      exatos: 0,

      aproximacaoVencedor: 0,

      aproximacaoEmpate: 0,

      acertosParciais: 0,

      ultimoHorarioAposta: 0

    };

  }

  // =========================
  // SOMA PONTOS
  // =========================

  rankingMap[nome].points +=
    calculatedPoints;

  // =========================
  // EXATOS
  // =========================

  if (exato) {

    rankingMap[nome]
      .exatos += 1;

  }

  // =========================
  // ACERTOS PARCIAIS
  // =========================

  rankingMap[nome]
    .acertosParciais +=
      acertosParciais;

  // =========================
  // ACERTOU VENCEDOR
  // =========================

  const acertouVencedor =

    (
      Number(bet.golsA) >
      Number(bet.golsB) &&

      Number(gameFound.resultadoA) >
      Number(gameFound.resultadoB)
    ) ||

    (
      Number(bet.golsA) <
      Number(bet.golsB) &&

      Number(gameFound.resultadoA) <
      Number(gameFound.resultadoB)
    );

  // =========================
  // ACERTOU EMPATE
  // =========================

  const acertouEmpate =

    Number(bet.golsA) ===
    Number(bet.golsB) &&

    Number(gameFound.resultadoA) ===
    Number(gameFound.resultadoB);

  // =========================
  // APROXIMAÇÃO VENCEDOR
  // =========================

  if (acertouVencedor) {

    rankingMap[nome]
      .aproximacaoVencedor +=
        distancia;

  }

  // =========================
  // APROXIMAÇÃO EMPATE
  // =========================

  if (acertouEmpate) {

    rankingMap[nome]
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
      rankingMap[nome]
        .ultimoHorarioAposta ||

    rankingMap[nome]
      .ultimoHorarioAposta === 0
  ) {

    rankingMap[nome]
      .ultimoHorarioAposta =
        horario;

  }

}

// =========================
// ORDENA
// =========================

const rankingArray =

  Object.values(
    rankingMap
  )

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

setRanking(
  rankingArray
);

  }

  // =========================
  // EFFECT
  // =========================

  useEffect(() => {

    const unsubscribeAuth =
      onAuthStateChanged(

        auth,

        (user) => {

          if (!user) {

            setRanking([]);

            return;

          }

          const unsubscribeBets =
            onSnapshot(

              collection(
                db,
                "bets"
              ),

              () => {

                carregarRanking();

              }

            );

          return () =>
            unsubscribeBets();

        }

      );

    return () =>
      unsubscribeAuth();

  }, []);

  // =========================
  // JSX
  // =========================

  return (

    <div className="
      bg-zinc-900
      rounded-xl
      p-4
      border
      border-zinc-800
    ">

      <h2 className="
        text-xl
        font-black
        mb-4
      ">
        🏆 Ranking Mundial da Vergonha
      </h2>

      <div className="space-y-3">

        {ranking.length === 0 && (

          <p className="
            text-zinc-400
            text-sm
          ">
            Nenhuma aposta registrada.
          </p>

        )}

        {ranking.map(
          (user, index) => (

            <div
              key={index}
              className="
                bg-zinc-800
                rounded-xl
                p-3
                flex
                justify-between
                items-center
              "
            >

              <div className="
                flex
                items-center
                gap-3
              ">

                <span className="text-xl">

                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && "⚽"}

                </span>

                <div>

                  <p className="
                    font-bold
                    text-sm
                  ">

                    {user.username ===
                     user.nome

                      ? user.nome

                      : `${user.username} (${user.nome})`
                    }

                  </p>

                  <p className="
                    text-zinc-400
                    text-xs
                  ">
                    #{index + 1}
                  </p>

                </div>

              </div>

              <p className="
                text-yellow-400
                font-black
                text-sm
              ">
                ⭐ {user.points}
              </p>

            </div>

          )
        )}

      </div>

    </div>

  );

}