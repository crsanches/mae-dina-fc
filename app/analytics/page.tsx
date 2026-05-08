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

type Stats = {

  leader: string;

  lastPlace: string;

  drawKing: string;

  crazyBetter: string;

  exactMaster: string;

};

export default function AnalyticsPage() {

  const [stats, setStats] =
    useState<Stats>({

      leader: "-",

      lastPlace: "-",

      drawKing: "-",

      crazyBetter: "-",

      exactMaster: "-"

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

      const leader =
        Object.entries(ranking)
          .sort(
            (a, b) =>
              b[1] - a[1]
          )[0]?.[0] || "-";

      const lastPlace =
        Object.entries(ranking)
          .sort(
            (a, b) =>
              a[1] - b[1]
          )[0]?.[0] || "-";

      const drawKing =
        Object.entries(drawCount)
          .sort(
            (a, b) =>
              b[1] - a[1]
          )[0]?.[0] || "-";

      const crazyBetter =
        Object.entries(crazyCount)
          .sort(
            (a, b) =>
              b[1] - a[1]
          )[0]?.[0] || "-";

      const exactMaster =
        Object.entries(exactCount)
          .sort(
            (a, b) =>
              b[1] - a[1]
          )[0]?.[0] || "-";

      setStats({

        leader,

        lastPlace,

        drawKing,

        crazyBetter,

        exactMaster

      });

    }

    carregarAnalytics();

  }, []);

  const cards = [

    {
      emoji: "👑",
      title: "Líder Supremo",
      user: stats.leader
    },

    {
      emoji: "📉",
      title: "Lanterna da Vergonha",
      user: stats.lastPlace
    },

    {
      emoji: "🤝",
      title: "Rei do Empate",
      user: stats.drawKing
    },

    {
      emoji: "💣",
      title: "Apostador Insano",
      user: stats.crazyBetter
    },

    {
      emoji: "🎯",
      title: "Mestre dos Placares",
      user: stats.exactMaster
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

              <p className="text-green-400 text-2xl font-black">
                {card.user}
              </p>

            </div>

          ))}

        </div>

      </div>

    </main>

  );

}