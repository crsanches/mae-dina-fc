"use client";

import {
  useEffect,
  useState
} from "react";

import {
  auth,
  db
} from "../lib/firebase";

import {
  calculatePoints
} from "../lib/calculatePoints";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where
} from "firebase/firestore";

type Bet = {

  jogo: string;

  user: string;

  golsA: string;

  golsB: string;

  points: number;

};

export default function BetTable() {

  const [bets, setBets] =
    useState<Bet[]>([]);

  async function carregarApostas(
    currentUserName: string
  ) {

    const loggedUser =
      auth.currentUser;

    if (!loggedUser) {

      return;

    }

    const userRef =
      doc(
        db,
        "users",
        loggedUser.uid
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

    const allBets: Bet[] = [];

    const betsQuery =
  query(

    collection(db, "bets"),

    where(
      "groupId",
      "==",
      currentGroupId
    ),

    where(
      "userName",
      "==",
      currentUserName
    ),

    orderBy(
      "createdAt",
      "desc"
    )

  );

    const betsSnapshot =
      await getDocs(betsQuery);

    for (const betDoc of betsSnapshot.docs) {

      const data =
        betDoc.data();

      if (
        data.groupId !==
        currentGroupId
      ) {

        continue;

      }

      if (
        data.userName !==
        currentUserName
      ) {

        continue;

      }

      const gamesQuery =
        query(

          collection(db, "games"),

          where(
            "match",
            "==",
            data.match
          )

        );

      const gamesSnapshot =
        await getDocs(gamesQuery);

      let calculatedPoints = 0;

      gamesSnapshot.forEach((gameDoc) => {

        const game =
          gameDoc.data();

        if (
          game.resultadoA != null &&
          game.resultadoB != null
        ) {

          calculatedPoints =
            calculatePoints({

              apostaA:
                Number(data.golsA),

              apostaB:
                Number(data.golsB),

              resultadoA:
                Number(game.resultadoA),

              resultadoB:
                Number(game.resultadoB)

            });

        }

      });

      allBets.push({

        jogo:
          data.match,

        user:
          data.userName,

        golsA:
          data.golsA,

        golsB:
          data.golsB,

        points:
          calculatedPoints

      });

    }

    setBets(allBets);

  }

  useEffect(() => {

    let unsubscribeBets:
      (() => void) | undefined;

    const unsubscribeAuth =
      onAuthStateChanged(

        auth,

        (user) => {

          if (!user) {

            setBets([]);

            return;

          }

          unsubscribeBets =
            onSnapshot(

              collection(db, "bets"),

              () => {

                carregarApostas(
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

// aqui eu estou tirando o bloco meus palpites. 
  const exibirMeusPalpites = false;

  if (!exibirMeusPalpites) {
    return null;
  }

// fim da exclusao do bloco.


  return (

    <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">

      <h2 className="text-2xl font-bold mb-5">

        🎯 Meus Palpites

      </h2>

      <div className="space-y-3">

        {bets.length === 0 && (

          <p className="text-zinc-400">

            Nenhuma aposta salva.

          </p>

        )}

        {bets.map((bet, index) => (

          <div
            key={index}
            className="bg-zinc-800 rounded-2xl p-4 flex justify-between items-center"
          >

            <div>

              <p className="font-semibold">

                {bet.jogo}

              </p>

              <p className="text-zinc-400 text-sm">

                👤 {bet.user}

              </p>

            </div>

            <div className="text-right">

              <p className="text-green-400 font-bold">

                {bet.golsA}
                {" x "}
                {bet.golsB}

              </p>

              <p className="text-yellow-400 text-sm font-semibold">

                ⭐ {bet.points} pts

              </p>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}