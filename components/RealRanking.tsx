"use client";

import {
  useEffect,
  useState
} from "react";

import {
  query,
  where
} from "firebase/firestore";

import {
  doc,
  getDoc
} from "firebase/firestore";

import {
  db,
  auth
} from "../lib/firebase";

import {
  collection,
  getDocs,
  onSnapshot
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

import { calculatePoints }
from "../lib/calculatePoints";

type RankingUser = {
  user: string;
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

      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );

      const userSnap =
        await getDoc(userRef);

      if (
        !userSnap.exists()
      ) {
        return;
      }

      const currentGroupId =
  userSnap.data().activeGroupId ||
  userSnap.data().groupId;  

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

    const gamesSnapshot =
      await getDocs(
        collection(db, "games")
      );

    const rankingMap:
      Record<string, number> = {};

      betsSnapshot.forEach((betDoc) => {

        const bet =
          betDoc.data();
      
        if (
          bet.groupId !==
          currentGroupId
        ) {
      
          return;
      
        }
      
        const user =
          bet.userName || "Anônimo";
      
        let calculatedPoints = 0;
      
        gamesSnapshot.forEach((gameDoc) => {
      
          const game =
            gameDoc.data();
      
          if (
            game.match === bet.match &&
            game.resultadoA !== undefined &&
            game.resultadoB !== undefined
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
      
        if (
          rankingMap[user] === undefined
        ) {
        
          rankingMap[user] = 0;
        
        }
      
        rankingMap[user] +=
          calculatedPoints;
      
      });

    const rankingArray =

      Object.entries(rankingMap)

        .map(([user, points]) => ({
          user,
          points
        }))

        .sort(
          (a, b) =>
            b.points - a.points
        );

    setRanking(rankingArray);

  }

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
  
              collection(db, "bets"),
  
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

  return (

    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">

      <h2 className="text-xl font-black mb-4">
        🏆 Ranking Mundial da Vergonha
      </h2>

      <div className="space-y-3">

        {ranking.length === 0 && (

          <p className="text-zinc-400 text-sm">
            Nenhuma aposta registrada.
          </p>

        )}

        {ranking.map((user, index) => (

          <div
            key={index}
            className="bg-zinc-800 rounded-xl p-3 flex justify-between items-center"
          >

            <div className="flex items-center gap-3">

              <span className="text-xl">

                {index === 0 && "🥇"}
                {index === 1 && "🥈"}
                {index === 2 && "🥉"}
                {index > 2 && "⚽"}

              </span>

              <div>

                <p className="font-bold text-sm">
                  {user.user}
                </p>

                <p className="text-zinc-400 text-xs">
                  #{index + 1}
                </p>

              </div>

            </div>

            <p className="text-yellow-400 font-black text-sm">
              ⭐ {user.points}
            </p>

          </div>

        ))}

      </div>

    </div>

  );

}