"use client";

import { useEffect, useState } from "react";

import { db } from "../lib/firebase";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot
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

export default function UserStats() {

  const [data, setData] =
    useState<UserData>({
      position: 0,
      points: 0
    });



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
        userSnap.data().groupId;
    
      const betsSnapshot =
        await getDocs(
          collection(db, "bets")
        );
    
      const gamesSnapshot =
        await getDocs(
          collection(db, "games")
        );
    
      const ranking:
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
    
        let points = 0;
    
        gamesSnapshot.forEach((gameDoc) => {
    
          const game =
            gameDoc.data();
    
          if (
            game.match === bet.match &&
            game.resultadoA !== undefined &&
            game.resultadoB !== undefined
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
    
      setData({
    
        position,
    
        points
    
      });
    
    }
    
    useEffect(() => {

      const unsubscribeAuth =
        onAuthStateChanged(
          auth,
          (user) => {
    
            if (!user) {
    
              setData({
                position: 0,
                points: 0
              });
    
              return;
    
            }
    
            const unsubscribeBets =
              onSnapshot(
    
                collection(db, "bets"),
    
                () => {
    
                  carregarStats(
                    user.displayName || ""
                  );
    
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

    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">

      <h2 className="text-xl font-black mb-4">
        📊 Sua Situação
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

    </div>

  );

}