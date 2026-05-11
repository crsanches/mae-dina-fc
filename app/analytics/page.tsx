"use client";

import Link from "next/link";

import {
  useEffect,
  useState
} from "react";

import {
  db
} from "../../lib/firebase";

import {
  collection,
  getDocs
} from "firebase/firestore";

import {
  calculatePoints
} from "../../lib/calculatePoints";

type StatItem = {

  user: string;

  value: number;

};

type Stats = {

  leader: StatItem;

  lastPlace: StatItem;

  drawKing: StatItem;

  crazyBetter: StatItem;

  exactMaster: StatItem;

  totalBets: number;

};

export default function AnalyticsPage() {

  const [stats, setStats] =
  useState<Stats>({

    leader: {
      user: "-",
      value: 0
    },

    lastPlace: {
      user: "-",
      value: 0
    },

    drawKing: {
      user: "-",
      value: 0
    },

    crazyBetter: {
      user: "-",
      value: 0
    },

    exactMaster: {
      user: "-",
      value: 0
    },

    totalBets: 0

  });

  useEffect(() => {

    async function carregarAnalytics() {

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

      const drawCount:
        Record<string, number> = {};

      const crazyCount:
        Record<string, number> = {};

      const exactCount:
        Record<string, number> = {};

      betsSnapshot.forEach((betDoc) => {

        const bet =
          betDoc.data();

        const user =
          bet.userName;

        if (!ranking[user]) {
          ranking[user] = 0;
        }

        if (!drawCount[user]) {
          drawCount[user] = 0;
        }

        if (!crazyCount[user]) {
          crazyCount[user] = 0;
        }

        if (!exactCount[user]) {
          exactCount[user] = 0;
        }

        if (
          Number(bet.golsA) ===
          Number(bet.golsB)
        ) {

          drawCount[user]++;

        }

        if (
          Number(bet.golsA) >= 6 ||
          Number(bet.golsB) >= 6
        ) {

          crazyCount[user]++;

        }

        gamesSnapshot.forEach((gameDoc) => {

          const game =
            gameDoc.data();

          if (
            game.match === bet.match &&
            game.resultadoA !== undefined &&
            game.resultadoB !== undefined
          ) {

            const points =
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

            ranking[user] += points;

            if (
              Number(bet.golsA) === Number(game.resultadoA) &&
              Number(bet.golsB) === Number(game.resultadoB)
            ) {

              exactCount[user]++;

            }

          }

        });

      });

      const leaderEntry =

  Object.entries(ranking)

    .sort(
      (a, b) =>
        b[1] - a[1]
    )[0];

const lastPlaceEntry =

  Object.entries(ranking)

    .sort(
      (a, b) =>
        a[1] - b[1]
    )[0];

const drawKingEntry =

  Object.entries(drawCount)

    .sort(
      (a, b) =>
        b[1] - a[1]
    )[0];

const crazyBetterEntry =

  Object.entries(crazyCount)

    .sort(
      (a, b) =>
        b[1] - a[1]
    )[0];

const exactMasterEntry =

  Object.entries(exactCount)

    .sort(
      (a, b) =>
        b[1] - a[1]
    )[0];

setStats({

  leader: {

    user:
      leaderEntry?.[0] || "-",

    value:
      leaderEntry?.[1] || 0

  },

  lastPlace: {

    user:
      lastPlaceEntry?.[0] || "-",

    value:
      lastPlaceEntry?.[1] || 0

  },

  drawKing: {

    user:
      drawKingEntry?.[0] || "-",

    value:
      drawKingEntry?.[1] || 0

  },

  crazyBetter: {

    user:
      crazyBetterEntry?.[0] || "-",

    value:
      crazyBetterEntry?.[1] || 0

  },

  exactMaster: {

    user:
      exactMasterEntry?.[0] || "-",

    value:
      exactMasterEntry?.[1] || 0

  },

  totalBets:
    betsSnapshot.size

});

    }

    carregarAnalytics();

  }, []);

  const cards = [

    {
      emoji: "👑",
      title: "Líder Supremo",
      user: stats.leader.user,
      value: `${stats.leader.value} pts`
    },
  
    {
      emoji: "📉",
      title: "Lanterna da Vergonha",
      user: stats.lastPlace.user,
      value: `${stats.lastPlace.value} pts`
    },
  
    {
      emoji: "🤝",
      title: "Rei do Empate",
      user: stats.drawKing.user,
      value: `${stats.drawKing.value} empates`
    },
  
    {
      emoji: "💣",
      title: "Apostador Insano",
      user: stats.crazyBetter.user,
      value: `${stats.crazyBetter.value} apostas absurdas`
    },
  
    {
      emoji: "🎯",
      title: "Mestre dos Placares",
      user: stats.exactMaster.user,
      value: `${stats.exactMaster.value} acertos`
    }
  
  ];

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-4">

      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6">

          <h1 className="text-3xl font-black">
            📊 Analytics da Vergonha
          </h1>

          <Link
            href="/"
            className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2 rounded-xl font-bold text-sm"
          >
            ← Voltar
          </Link>

        </div>

        <div className="grid md:grid-cols-2 gap-4">

          {cards.map((card) => (

            <div
              key={card.title}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
            >

              <div className="text-5xl mb-4">
                {card.emoji}
              </div>

              <h2 className="text-xl font-black mb-2">
                {card.title}
              </h2>

              <p className="text-zinc-400 text-sm mt-2">
                {card.value}
              </p>

            </div>

          ))}

        </div>

      </div>

    </main>

  );

}