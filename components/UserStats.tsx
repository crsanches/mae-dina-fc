"use client";

import { useEffect, useState } from "react";

import { db } from "../lib/firebase";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

import { calculatePoints }
from "../lib/calculatePoints";

import { auth }
from "../lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

type UserData = {
  position: number;
  points: number;
};

type BetHistory = {
  jogo: string;
  aposta: string;
  resultado: string;
  pontos: number;
};

export default function UserStats() {

  const [data, setData] =
    useState<UserData>({
      position: 0,
      points: 0
    });

  const [betHistory, setBetHistory] =
    useState<BetHistory[]>([]);

  async function carregarStats(
    currentUser: string
  ) {

    const firebaseUser =
      auth.currentUser;

    if (!firebaseUser) {
      return;
    }

    const userRef =
      doc(
        db,
        "users",
        firebaseUser.uid
      );

    const userSnap =
      await getDoc(userRef);

    if (
      !userSnap.exists()
    ) {
      return;
    }

    const currentGroupId =
      userSnap.data().activeGroupId

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
      await getDocs(
        betsQuery
      );

    const gamesSnapshot =
      await getDocs(
        collection(db, "games")
      );

    const ranking:
      Record<string, number> = {};

    const history:
      BetHistory[] = [];

    betsSnapshot.forEach((betDoc) => {

      const bet =
        betDoc.data();

      let points = 0;

      gamesSnapshot.forEach((gameDoc) => {

        const game =
          gameDoc.data();

        if (
          game.match === bet.match &&
          game.resultadoA != null &&
          game.resultadoB != null
        ) {

          points =
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

      if (
        ranking[bet.userName] ===
        undefined
      ) {

        ranking[bet.userName] = 0;

      }

      ranking[bet.userName] +=
        points;

      if (
        bet.userName === currentUser
      ) {

        let resultadoOficial =
          "-";

        gamesSnapshot.forEach((gameDoc) => {

          const game =
            gameDoc.data();

          if (
            game.match === bet.match &&
            game.resultadoA != null &&
            game.resultadoB != null
          ) {

            resultadoOficial =
              `${game.resultadoA} x ${game.resultadoB}`;

          }

        });

        history.push({

          jogo:
            bet.match,

          aposta:
            `${bet.golsA} x ${bet.golsB}`,

          resultado:
            resultadoOficial,

          pontos:
            points

        });

      }

    });

    const sorted =

      Object.entries(ranking)

        .sort(
          (a, b) =>
            b[1] - a[1]
        );

    const position =

      sorted.findIndex(
        ([user]) =>
          user === currentUser
      ) + 1;

    const points =
      ranking[currentUser] || 0;

    setBetHistory(history);

    setData({

      position,

      points

    });

  }

  useEffect(() => {

    let unsubscribeBets:
      (() => void) | undefined;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {

          if (!user) {

            setData({
              position: 0,
              points: 0
            });

            setBetHistory([]);

            return;

          }

          unsubscribeBets =
            onSnapshot(

              collection(db, "bets"),

              () => {

                carregarStats(
                  user.displayName || ""
                );

              }

            );

        }
      );

    return () => {

      unsubscribeAuth();

      if (
        unsubscribeBets
      ) {

        unsubscribeBets();

      }

    };

  }, []);

  return (

    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">

      <h2 className="text-xl font-black mb-4">
      💀 Sua Situação
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-zinc-800 rounded-2xl p-4 text-center">

          <p className="text-zinc-400 text-sm">
            Posição
          </p>

          <p className="text-3xl font-black text-yellow-400">
            #{data.position || "-"}
          </p>

        </div>

        <div className="bg-zinc-800 rounded-2xl p-4 text-center">

          <p className="text-zinc-400 text-sm">
            Pontos
          </p>

          <p className="text-3xl font-black text-green-400">
            {data.points}
          </p>

        </div>

      </div>

      <div className="mt-6">

        <h3 className="text-lg font-black mb-3">
          🎯 Seus Palpites
        </h3>

        <div className="space-y-3">

          {betHistory.length === 0 && (

            <p className="text-zinc-400 text-sm">
              Nenhum palpite registrado.
            </p>

          )}

          {betHistory.map((bet, index) => (

            <div
              key={index}
              className="bg-zinc-800 rounded-2xl p-4 border border-zinc-700"
            >

              <div className="flex justify-between items-start gap-4">

                <div>

                  <p className="font-bold text-sm mb-2">
                    ⚽ {bet.jogo}
                  </p>

                  <div className="text-xs text-zinc-400 space-y-1">

                    <p>
                      🎯 Seu palpite:
                      <span className="text-white font-bold ml-1">
                        {bet.aposta}
                      </span>
                    </p>

                    <p>
                      🏁 Resultado oficial:
                      <span className="text-white font-bold ml-1">
                        {bet.resultado}
                      </span>
                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-yellow-400 font-black text-lg">
                    ⭐ {bet.pontos}
                  </p>

                  <p className="text-zinc-500 text-xs">
                    pontos
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}