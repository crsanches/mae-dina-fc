"use client";

import { useEffect, useState } from "react";

import { db } from "../lib/firebase";

import {
  collection,
  getDocs
} from "firebase/firestore";

type RankingUser = {
  user: string;
  points: number;
};

export default function RealRanking() {

  const [ranking, setRanking] =
    useState<RankingUser[]>([]);

  async function carregarRanking() {

    const snapshot =
      await getDocs(
        collection(db, "bets")
      );

    const rankingMap:
      Record<string, number> = {};

    snapshot.forEach((doc) => {

      const data = doc.data();

      const user =
        data.userName || "Anônimo";

      const points =
        Number(data.points || 0);

      if (!rankingMap[user]) {

        rankingMap[user] = 0;

      }

      rankingMap[user] += points;

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

    const timeout = setTimeout(() => {

      carregarRanking();

    }, 0);

    window.addEventListener(
      "betSaved",
      carregarRanking
    );

    return () => {

      clearTimeout(timeout);

      window.removeEventListener(
        "betSaved",
        carregarRanking
      );

    };

  }, []);

  return (

    <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">

      <h2 className="text-2xl font-bold mb-5">
        🏆 Ranking Mundial da Vergonha
      </h2>

      <div className="space-y-3">

        {ranking.length === 0 && (

          <p className="text-zinc-400">
            Nenhuma aposta registrada.
          </p>

        )}

        {ranking.map((user, index) => (

          <div
            key={index}
            className="bg-zinc-800 rounded-2xl p-4 flex justify-between items-center"
          >

            <div className="flex items-center gap-3">

              <span className="text-2xl">

                {index === 0 && "🥇"}
                {index === 1 && "🥈"}
                {index === 2 && "🥉"}
                {index > 2 && "⚽"}

              </span>

              <p className="font-bold">
                {user.user}
              </p>

            </div>

            <p className="text-yellow-400 font-black">
              ⭐ {user.points}
            </p>

          </div>

        ))}

      </div>

    </div>

  );

}