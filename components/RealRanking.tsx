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
      Record<
        string,
        {
          username: string;
          nome: string;
          points: number;
        }
      > = {};

    // =========================
    // LOOP DAS APOSTAS
    // =========================

    for (
      const betDoc
      of betsSnapshot.docs
    ) {

      const bet =
        betDoc.data();

      if (
        bet.groupId !==
        currentGroupId
      ) {
        continue;
      }

      // =========================
      // USER / NOME
      // =========================

      const nome =

        bet.nome ||

        bet.userName ||

        "Anônimo";

      let username =

        bet.username ||

        nome;

      // ==================================
      // FALLBACK PARA APOSTAS ANTIGAS
      // ==================================

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
      // CALCULA PONTOS
      // =========================

      let calculatedPoints = 0;

      gamesSnapshot.forEach((gameDoc) => {

        const game =
          gameDoc.data();

        if (
          game.match === bet.match &&
          game.resultadoA != null &&
          game.resultadoB != null
        ) {

          calculatedPoints =
            calculatePoints({

              apostaA:
                Number(bet.golsA),

              apostaB:
                Number(bet.golsB),

              resultadoA:
                Number(game.resultadoA),

              resultadoB:
                Number(game.resultadoB)

            });

        }

      });

      // =========================
      // SOMA PONTOS
      // =========================

      if (
        rankingMap[nome] ===
        undefined
      ) {

        rankingMap[nome] = {

          username,
          nome,

          points: 0

        };

      }

      rankingMap[nome].points +=
        calculatedPoints;

    }

    // =========================
    // ORDENA
    // =========================

    const rankingArray =

      Object.values(
        rankingMap
      )

        .sort(
          (a, b) =>
            b.points - a.points
        );

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