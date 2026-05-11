"use client";

import Link from "next/link";

import {
  auth,
  db
} from "../../lib/firebase";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

import {
  useEffect,
  useState
} from "react";

import {
  collection,
  doc,
  getDoc,
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

  totalGames: number;

  totalExactScores: number;

  totalCrazyBets: number;

};

type ChartRow = {

  jogo: string;

  [key: string]:
    string | number;

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

      totalBets: 0,

      totalGames: 0,

      totalExactScores: 0,

      totalCrazyBets: 0

    });

  const [chartData, setChartData] =
    useState<ChartRow[]>([]);

  const [usersToShow, setUsersToShow] =
    useState<string[]>([]);

  useEffect(() => {

    async function carregarAnalytics() {

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

      const drawCount:
        Record<string, number> = {};

      const crazyCount:
        Record<string, number> = {};

      const exactCount:
        Record<string, number> = {};

      let totalExactScores = 0;

      let totalCrazyBets = 0;

      let totalBets = 0;

      betsSnapshot.forEach((betDoc) => {

        const bet =
          betDoc.data();

        if (
          bet.groupId !==
          currentGroupId
        ) {

          return;

        }

        totalBets++;

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

          totalCrazyBets++;

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

              totalExactScores++;

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

      const evolution:
        ChartRow[] = [];

      const cumulative:
        Record<string, number> = {};

      const allUsers =
        Array.from(

          new Set(

            betsSnapshot.docs

              .map((doc) =>
                doc.data()
              )

              .filter(
                (bet) =>
                  bet.groupId ===
                  currentGroupId
              )

              .map(
                (bet) =>
                  bet.userName
              )

          )

        );

      allUsers.forEach((user) => {

        cumulative[user] = 0;

      });

      const sortedRanking =

        Object.entries(ranking)

          .sort(
            (a, b) =>
              b[1] - a[1]
          );

      const topUsers =

        sortedRanking

          .slice(0, 2)

          .map(([user]) => user);

      const bottomUsers =

        sortedRanking

          .slice(-2)

          .map(([user]) => user);

      const visibleUsers =

        Array.from(

          new Set([

            ...topUsers,

            ...bottomUsers,

            currentUser.displayName || ""

          ])

        );

      gamesSnapshot.docs

        .filter((doc) => {

          const game =
            doc.data();

          return (
            game.resultadoA !== undefined &&
            game.resultadoB !== undefined
          );

        })

        .forEach((gameDoc, index) => {

          const game =
            gameDoc.data();

          const processedUsers =
            new Set();

          betsSnapshot.forEach((betDoc) => {

            const bet =
              betDoc.data();

            if (
              bet.groupId !==
              currentGroupId
            ) {

              return;

            }

            if (
              bet.match === game.match &&
              game.resultadoA !== undefined &&
              game.resultadoB !== undefined
            ) {

              if (
                processedUsers.has(
                  bet.userName
                )
              ) {

                return;

              }

              processedUsers.add(
                bet.userName
              );

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

              cumulative[
                bet.userName
              ] += points;

            }

          });

          const row: ChartRow = {

            jogo:
              `J${index + 1}`

          };

          visibleUsers.forEach((user) => {

            row[user] =
              cumulative[user];

          });

          evolution.push(row);

        });

      setChartData(evolution);

      setUsersToShow(
        visibleUsers
      );

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

        totalBets,

        totalGames:
          gamesSnapshot.size,

        totalExactScores,

        totalCrazyBets

      });

    }

    carregarAnalytics();

  }, []);

  const cards = [

    {
      emoji: "👑",
      title: "Líder Supremo",
      user: stats.leader.user,
      value: `${stats.leader.value} pts`,
      badge: "🏆 Oráculo da Bola"
    },

    {
      emoji: "🐢",
      title: "Lanterna da Vergonha",
      user: stats.lastPlace.user,
      value: `${stats.lastPlace.value} pts`,
      badge: "⚽ Técnico do Íbis FC"
    },

    {
      emoji: "🤝",
      title: "Rei do Empate",
      user: stats.drawKing.user,
      value: `${stats.drawKing.value} empates`,
      badge: "🤝 Fair Play do Futebol"
    },

    {
      emoji: "💣",
      title: "Apostador Insano",
      user: stats.crazyBetter.user,
      value: `${stats.crazyBetter.value} apostas absurdas`,
      badge: "🔥 Profeta do Caos"
    },

    {
      emoji: "🎯",
      title: "Mestre dos Placares",
      user: stats.exactMaster.user,
      value: `${stats.exactMaster.value} acertos`,
      badge: "🏹 Sniper em Ação"
    }

  ];

  const colors = [

    "#22c55e",
    "#3b82f6",
    "#eab308",
    "#ef4444",
    "#a855f7",
    "#14b8a6"

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">

            <p className="text-3xl font-black text-green-400">

              {stats.totalBets}

            </p>

            <p className="text-zinc-400 text-sm mt-2">

              📊 Apostas

            </p>

          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">

            <p className="text-3xl font-black text-blue-400">

              {stats.totalGames}

            </p>

            <p className="text-zinc-400 text-sm mt-2">

              ⚽ Jogos

            </p>

          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">

            <p className="text-3xl font-black text-yellow-400">

              {stats.totalExactScores}

            </p>

            <p className="text-zinc-400 text-sm mt-2">

              🎯 Placares Exatos

            </p>

          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">

            <p className="text-3xl font-black text-red-400">

              {stats.totalCrazyBets}

            </p>

            <p className="text-zinc-400 text-sm mt-2">

              💣 Apostas Insanas

            </p>

          </div>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6">

          <h2 className="text-2xl font-black mb-5">

            🐢 Evolução dos Palpiteiros

          </h2>

          <div className="h-[350px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={chartData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="jogo" />

                <YAxis
                  domain={[0, "dataMax + 5"]}
                />

                <Tooltip />

                <Legend />

                {usersToShow.map((user, index) => (

                  <Line
                    key={user}
                    type="monotone"
                    dataKey={user}
                    strokeWidth={3}
                    dot={false}
                    connectNulls
                    stroke={
                      colors[
                        index % colors.length
                      ]
                    }
                  />

                ))}

              </LineChart>

            </ResponsiveContainer>

          </div>

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

              <p className="text-zinc-400 text-sm mt-2">

                {card.value}

              </p>

              <div className="mt-4 inline-flex items-center gap-2 bg-purple-900 border border-purple-700 rounded-full px-4 py-2 text-sm font-bold text-purple-200">

                {card.badge}

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>

  );

}