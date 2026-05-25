"use client";



import {
  auth,
  db
} from "../lib/firebase";

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
} from "../lib/calculatePoints";

type StatItem = {

  user: string;

  value: number;

};

type Stats = {

  leader: StatItem;

  lastPlace: StatItem;

  drawKing: StatItem;

  coldStreak: StatItem;

  biggestClimb: StatItem;

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

      coldStreak: {
        user: "-",
        value: 0
      },

      biggestClimb: {
        user: "-",
        value: 0
      },

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

  
      totalBets: 0,

      totalGames: 0,

      totalExactScores: 0,

      totalCrazyBets: 0

    });

  const [chartData, setChartData] =
    useState<ChartRow[]>([]);

  const [usersToShow, setUsersToShow] =
    useState<string[]>([]);

    const [analyticsWinners, setAnalyticsWinners] =
  useState({

    exactMasterWinner: 
     null as [string, number] | null,

    prophetEntry: 
     null as [string, number] | null,

    incendiaryEntry: 
     null as [string, number] | null,

    retranqueiroEntry: 
     null as [string, number] | null,

    chaosEntry: 
     null as [string, number] | null,

    almostEntry: 
     null as [string, number] | null,

  });

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
      userSnap.data().activeGroupId;

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

      

        const exactCount:
        Record<string, number> = {};

        const exactNoDraw:
        Record<string, number> = {};

        const exactDraw:
        Record<string, number> = {};
      
        const totalBetsPerUser:
        Record<string, number> = {};
        
        const exactRateMap:
        Record<string, number> = {};
        
        const winnerHits:
        Record<string, number> = {};
        
        const winnerRate:
        Record<string, number> = {};
        
        const totalGoalsBet:
        Record<string, number> = {};
        
        const averageGoals:
        Record<string, number> = {};
        
        const chaosScore:
        Record<string, number> = {};
        
        const almostHits:
        Record<string, number> = {};
        
        const maxZeroStreak:
        Record<string, number> = {};
        
        const biggestClimbMap:
        Record<string, number> = {};
        
        const previousPositions:
        Record<string, number> = {};
        
        const roundPoints:
        Record<string, number[]> = {};
      

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
        
          if (!totalBetsPerUser[user]) {
            totalBetsPerUser[user] = 0;
          }
          
          if (!winnerHits[user]) {
            winnerHits[user] = 0;
          }
          
          if (!totalGoalsBet[user]) {
            totalGoalsBet[user] = 0;
          }
          
          if (!chaosScore[user]) {
            chaosScore[user] = 0;
          }
          
          if (!almostHits[user]) {
            almostHits[user] = 0;
          }
          
          totalBetsPerUser[user]++;
          
          const golsA =
            Number(bet.golsA);
          
          const golsB =
            Number(bet.golsB);
          
          totalGoalsBet[user] +=
            golsA + golsB;
            if (
              golsA >= 6 ||
              golsB >= 6
            ) {
            
              totalCrazyBets++;
            
            }
          
          
          if (
            Math.abs(golsA - golsB) >= 5
          ) {
            chaosScore[user] += 1;
          }
          
          if (
            golsA >= 7 ||
            golsB >= 7
          ) {
            chaosScore[user] += 3;
          }
          
          if (
            golsA === golsB &&
            golsA >= 4
          ) {
            chaosScore[user] += 2;
          }

        if (!ranking[user]) {
          ranking[user] = 0;
        }

        if (!drawCount[user]) {
          drawCount[user] = 0;
        }

        

        if (!exactCount[user]) {
          exactCount[user] = 0;
        }
        if (!exactNoDraw[user]) {
          exactNoDraw[user] = 0;
        }
        
        if (!exactDraw[user]) {
          exactDraw[user] = 0;
        }

        if (
          Number(bet.golsA) ===
          Number(bet.golsB)
        ) {

          drawCount[user]++;

        }

        
         

        gamesSnapshot.forEach((gameDoc) => {

          const game =
            gameDoc.data();

          if (
            game.match === bet.match &&
            game.resultadoA != null &&
            game.resultadoB != null
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

            const apostaDiff =

              Number(bet.golsA) -

              Number(bet.golsB);

            const resultadoDiff =

              Number(game.resultadoA) -

              Number(game.resultadoB);

            const acertouVencedor =

              (
                apostaDiff > 0 &&
                resultadoDiff > 0
              ) ||

              (
                apostaDiff < 0 &&
                resultadoDiff < 0
              ) ||

              (
                apostaDiff === 0 &&
                resultadoDiff === 0
              );

            if (acertouVencedor) {

              winnerHits[user]++;

            }

            const diffA = Math.abs(

              Number(bet.golsA) -

              Number(game.resultadoA)

            );

            const diffB = Math.abs(

              Number(bet.golsB) -

              Number(game.resultadoB)

            );

            if (

              diffA + diffB <= 2 &&

              !(

                Number(bet.golsA) === Number(game.resultadoA) &&

                Number(bet.golsB) === Number(game.resultadoB)

              )

            ) {

              almostHits[user]++;

            }

            if (

              Number(bet.golsA) === Number(game.resultadoA) &&
            
              Number(bet.golsB) === Number(game.resultadoB)
            
            ) {
            
              exactCount[user]++;
            
              totalExactScores++;
            
              const empate =
            
                Number(game.resultadoA) ===
                Number(game.resultadoB);
            
              if (empate) {
            
                exactDraw[user]++;
            
              } else {
            
                exactNoDraw[user]++;
            
              }
            
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

        .sort((a, b) => {

          const userA = a[0];
          const userB = b[0];
        
          const pointsA = a[1];
          const pointsB = b[1];
        
          /*
          ========================
          1. PONTOS
          ========================
          */
        
          if (pointsB !== pointsA) {
        
            return pointsB - pointsA;
        
          }
        
          /*
          ========================
          2. EXATOS SEM EMPATE
          ========================
          */
        
          const exactNoDrawA =
            exactNoDraw[userA] || 0;
        
          const exactNoDrawB =
            exactNoDraw[userB] || 0;
        
          if (
            exactNoDrawB !==
            exactNoDrawA
          ) {
        
            return (
              exactNoDrawB -
              exactNoDrawA
            );
        
          }
        
          /*
          ========================
          3. EXATOS COM EMPATE
          ========================
          */
        
          const exactDrawA =
            exactDraw[userA] || 0;
        
          const exactDrawB =
            exactDraw[userB] || 0;
        
          if (
            exactDrawB !==
            exactDrawA
          ) {
        
            return (
              exactDrawB -
              exactDrawA
            );
        
          }
        
          /*
          ========================
          4. ACERTOS DE VENCEDOR
          ========================
          */
        
          const winnerA =
            winnerHits[userA] || 0;
        
          const winnerB =
            winnerHits[userB] || 0;
        
          if (
            winnerB !==
            winnerA
          ) {
        
            return (
              winnerB -
              winnerA
            );
        
          }
        
          /*
          ========================
          5. MENOR CAOS
          ========================
          */
        
          const chaosA =
            chaosScore[userA] || 0;
        
          const chaosB =
            chaosScore[userB] || 0;
        
          return chaosA - chaosB;
        
        });

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
            game.resultadoA != null &&
            game.resultadoB != null
          );

        })

        .forEach((gameDoc, index) => {

          const game =
            gameDoc.data();

          const processedUsers =
            new Set();
          
          const rodadaAtual:
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

            if (
              bet.match === game.match &&
              game.resultadoA != null &&
              game.resultadoB != null
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

              rodadaAtual[
                bet.userName
              ] = points;
              
              if (
                !roundPoints[
                  bet.userName
                ]
              ) {
              
                roundPoints[
                  bet.userName
                ] = [];
              
              }
              
              roundPoints[
                bet.userName
              ].push(points);

            }

          });

              const rodadaRanking =

              Object.entries(cumulative)

                .sort(
                  (a, b) =>
                    b[1] - a[1]
                );

            
           

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


        Object.entries(
          roundPoints
        )
        
        .forEach(
        
          ([user, rounds]) => {
        
            let current = 0;
        
            let max = 0;
        
            rounds.forEach((pts) => {
        
              if (pts === 0) {
        
                current++;
        
                if (
                  current > max
                ) {
        
                  max = current;
        
                }
        
              } else {
        
                current = 0;
        
              }
        
            });
        
            maxZeroStreak[
              user
            ] = max;
        
          }
        
        );

        Object.keys(totalBetsPerUser)

  .forEach((user) => {

    exactRateMap[user] =

      (
        exactCount[user] || 0
      ) /

      totalBetsPerUser[user];

    winnerRate[user] =

      (
        winnerHits[user] || 0
      ) /

      totalBetsPerUser[user];

    averageGoals[user] =

      (
        totalGoalsBet[user] || 0
      ) /

      totalBetsPerUser[user];

  });

const exactMasterWinner =

  Object.entries(exactRateMap)

    .filter(

      ([user, rate]) =>

        totalBetsPerUser[user] >= 10 &&

        (exactCount[user] || 0) >= 3 &&

        rate >= 0.15

    )

    .sort((a, b) => b[1] - a[1])[0];

const prophetEntry =

  Object.entries(winnerRate)

    .filter(

      ([user, rate]) =>

        totalBetsPerUser[user] >= 10 &&

        rate >= 0.6

    )

    .sort((a, b) => b[1] - a[1])[0];

const incendiaryEntry =

  Object.entries(averageGoals)

    .filter(([, avg]) => avg >= 4)

    .sort((a, b) => b[1] - a[1])[0];

const retranqueiroEntry =

  Object.entries(averageGoals)

    .filter(([, avg]) => avg <= 2)

    .sort((a, b) => a[1] - b[1])[0];

const chaosEntry =

  Object.entries(chaosScore)

    .filter(([, chaos]) => chaos >= 5)

    .sort((a, b) => b[1] - a[1])[0];

const coldStreakEntry =

  Object.entries(maxZeroStreak)

    .sort((a, b) => b[1] - a[1])[0];

const biggestClimbEntry =

  Object.entries(biggestClimbMap)

    .sort((a, b) => b[1] - a[1])[0];

const almostEntry =

    Object.entries(almostHits)
  
      .sort((a, b) => b[1] - a[1])[0];
  
  setChartData(evolution);
  
  setUsersToShow(
    visibleUsers
  );
  
  setAnalyticsWinners({
  
    exactMasterWinner,
  
    prophetEntry,
  
    incendiaryEntry,
  
    retranqueiroEntry,
  
    chaosEntry,
  
    almostEntry,
  
  });
  
  setStats({
  
    coldStreak: {
  
      user:
        coldStreakEntry?.[0] || "-",
  
      value:
        coldStreakEntry?.[1] || 0
  
    },
  
    biggestClimb: {
  
      user:
        biggestClimbEntry?.[0] || "-",
  
      value:
        biggestClimbEntry?.[1] || 0
  
    },
  
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
  
    totalBets,
  
    totalGames:
      gamesSnapshot.size,
  
    totalExactScores,
  
    totalCrazyBets
  
  });
  
  }
  
  carregarAnalytics();
  
  }, []);

  const cards: {

    emoji: string;
  
    title: string;
  
    user: string;
  
    value: string;
  
    badge: string;
  
  }[] = [];

cards.push({

  emoji: "👑",
  title: "Líder Supremo",
  user: stats.leader.user,
  value: `${stats.leader.value} pts`,
  badge: "🏆 Dono do campeonato"

});

if (stats.totalGames >= 5) {

  cards.push({

    emoji: "🐢",
    title: "Lanterna da Vergonha",
    user: stats.lastPlace.user,
    value: `${stats.lastPlace.value} pts`,
    badge: "⚽ Técnico do Íbis FC"

  });

}

if (analyticsWinners.exactMasterWinner) {

  cards.push({

    emoji: "🎯",
    title: "Mestre dos Placares",
    user: analyticsWinners
    .exactMasterWinner?.[0],
    value:
      `${Math.round( analyticsWinners
        .exactMasterWinner[1] * 100)}% de precisão`,
    badge: "🏹 Sniper do futebol"

  });

}

if ( analyticsWinners.prophetEntry) {

  cards.push({

    emoji: "🧠",
    title: "Profeta",
    user: analyticsWinners
    .prophetEntry[0],
    value:
      `${Math.round( analyticsWinners
        .prophetEntry[1] * 100)}% de acertos`,
    badge: "🔮 Vidente esportivo"

  });

}

if (stats.coldStreak.value >= 3) {

  cards.push({

    emoji: "🥶",
    title: "Geladeira FC",
    user: stats.coldStreak.user,
    value:
      `${stats.coldStreak.value} jogos sem pontuar`,
    badge: "❄️ Congelado"

  });

}

{/*

if (stats.totalGames >= 10) {

  cards.push({

    emoji: "🚀",
    title: "Arrancada Heroica",
    user: stats.biggestClimb.user,
    value:
      `${stats.biggestClimb.value} posições subidas`,
    badge: "📈 Saiu do abismo"

  });
}
*/
}

if ( analyticsWinners.chaosEntry) {

  cards.push({

    emoji: "💣",
    title: "Agente do Caos",
    user:  analyticsWinners.chaosEntry[0],
    value:
      `${ analyticsWinners.chaosEntry[1]} pontos de insanidade`,
    badge: "🔥 Futebol sem limites"

  });

}

if ( analyticsWinners.incendiaryEntry) {

  cards.push({

    emoji: "🔥",
    title: "Incendiário",
    user:  analyticsWinners.incendiaryEntry[0],
    value:
      `${ analyticsWinners.incendiaryEntry[1].toFixed(1)} gols/jogo`,
    badge: "⚽ Viciado em goleada"

  });

}

if ( analyticsWinners.retranqueiroEntry) {

  cards.push({

    emoji: "🧱",
    title: "Retranqueiro",
    user:  analyticsWinners.retranqueiroEntry[0],
    value:
      `${ analyticsWinners.retranqueiroEntry[1].toFixed(1)} gols/jogo`,
    badge: "🚌 Estacionou o ônibus"

  });

}

if (analyticsWinners.almostEntry) {

  cards.push({

    emoji: "🎯",
    title: "Bateu na Trave",
    user:  analyticsWinners.almostEntry[0],
    value:
      `${ analyticsWinners.almostEntry[1]} quase acertos`,
    badge: "😩 Quase foi"

  });

}

  const colors = [

    "#22c55e",
    "#3b82f6",
    "#eab308",
    "#ef4444",
    "#a855f7",
    "#14b8a6"

  ];

  const insights: string[] = [];
  if (
    stats.leader.user !== "-"
  ) {
  
    insights.push(
  
      `${stats.leader.user} lidera o campeonato com ${stats.leader.value} pontos e já começou a falar em soberba esportiva.`
  
    );
  
  }
  
  if (
    stats.coldStreak.value >= 3
  ) {
  
    insights.push(
  
      `${stats.coldStreak.user} está há ${stats.coldStreak.value} jogos sem pontuar e entrou oficialmente em crise.`
  
    );
  
  }
  if (
    analyticsWinners.chaosEntry
  ) {
  
    insights.push(
  
      `${analyticsWinners.chaosEntry[0]} segue produzindo apostas incompatíveis com qualquer realidade conhecida.`
  
    );
  
  }


  if (
    stats.biggestClimb.value >= 2
  ) {
  
    insights.push(
  
      `${stats.biggestClimb.user} protagonizou a maior recuperação já registrada pelo instituto DataDináh.`
  
    );
  
  }
  
  if (
    stats.drawKing.value >= 5
  ) {
  
    insights.push(
  
      `${stats.drawKing.user} continua acreditando que todo jogo termina empatado.`
  
    );
  
  }



const achievements: {

  user: string;

  title: string;

  emoji: string;

  description: string;

}[] = [];

if (
  stats.coldStreak.value >= 5
) 

if (
  analyticsWinners.chaosEntry
) {

  achievements.push({

    user:
      analyticsWinners.chaosEntry[0],

    title:
      "Agente do Caos",

    emoji:
      "💣",

    description:
      `${analyticsWinners.chaosEntry[1]} pontos de insanidade`

  });

}

/* {
if (
  stats.exactMaster.value >= 3
)
  achievements.push({

    user:
      stats.exactMaster.user,

    title:
      "Sniper de Placares",

    emoji:
      "🎯",

    description:
      `${stats.exactMaster.value} placares exatos`

  });

}
*/


/*{
if (
  stats.mostLeaderRounds.value >= 5
) 
  achievements.push({

    user:
      stats.mostLeaderRounds.user,

    title:
      "Imperador do Palpite",

    emoji:
      "👑",

    description:
      `${stats.mostLeaderRounds.value} rodadas líder`

  });

}
*/

if (
  stats.drawKing.value >= 10
) {

  achievements.push({

    user:
      stats.drawKing.user,

    title:
      "Diplomata do Empate",

    emoji:
      "🤝",

    description:
      `${stats.drawKing.value} empates apostados`

  });

}

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-4">

      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6">

          <h1 className="text-3xl font-black">

            📊 Estatísticas da Vergonha

          </h1>

          

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

        <div className="mb-6 bg-gradient-to-br from-purple-950 to-zinc-900 border border-purple-700 rounded-3xl p-6">

  <div className="flex items-center gap-3 mb-5">

    <div className="text-5xl">
      🤖
    </div>

    <div>

      <h2 className="text-2xl font-black text-purple-300">

        Análise Fundamentalista da IA

      </h2>

      <p className="text-zinc-400 text-sm">

        Relatório automático da insanidade esportiva

      </p>

    </div>

  </div>

  <div className="space-y-3">

  {insights.length === 0 && (

<div
  className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 text-zinc-400"
>

  🤖 A IA ainda está coletando dados para humilhar os participantes.

</div>

)}

    {insights.map((text, index) => (

      <div
        key={index}
        className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 text-zinc-200 leading-relaxed"
      >

        {text}

      </div>

    ))}

  </div>

</div>

        <div className="mb-6">

      

        <div className="grid md:grid-cols-2 gap-4">

          {achievements.map((item, index) => (

            <div
              key={index}
              className="bg-gradient-to-br from-yellow-900 to-zinc-900 border border-yellow-700 rounded-3xl p-5"
            >

              <div className="text-5xl mb-4">

                {item.emoji}

              </div>

              <h3 className="text-xl font-black text-yellow-300">

                {item.title}

              </h3>

              <p className="text-2xl font-black mt-2 text-white">

                {item.user}

              </p>

              <p className="text-zinc-300 text-sm mt-2">

                {item.description}

              </p>

            </div>

          ))}

        </div>

        </div>

        <div
  className="
    fixed
    top-[72px]
    left-0
    right-0
    z-50
    px-3
    drop-shadow-md
  "
>

  <div className="
    bg-zinc-950/95
    border
    border-zinc-800
    rounded-3xl
    overflow-hidden
    shadow-md
    bg-black/70
  ">

    <div className="
      px-5
      pt-4
      pb-2
      border-b
      border-zinc-800
      bg-gradient-to-r
      from-yellow-900/40
      to-purple-900/40
    ">

      <h2 className="text-2xl font-black">

        🏅 Conquistas da Vergonha

      </h2>

    </div>

    <div className="
      flex
      gap-4
      py-4
      px-4
      animate-marquee
      w-max
    ">

      {[...cards, ...cards].map((card, index) => (

        <div
          key={`${card.title}-${index}`}
          className="
            min-w-[320px]
            bg-zinc-900
            border
            border-zinc-700
            rounded-3xl
            p-5
            flex
            items-center
            gap-4
            shadow-xl
          "
        >

          <div className="text-5xl">
            {card.emoji}
          </div>

          <div>

            <h2 className="font-black text-lg text-white">

              {card.title}

            </h2>

            <p className="text-green-400 font-black text-xl">

              {card.user}

            </p>

            <p className="text-zinc-400 text-sm">

              {card.value}

            </p>

            <div className="
              mt-2
              inline-flex
              items-center
              gap-2
              bg-purple-900
              border
              border-purple-700
              rounded-full
              px-3
              py-1
              text-xs
              font-bold
              text-purple-200
            ">

              {card.badge}

            </div>

          </div>

        </div>

      ))}

    </div>

  </div>

</div>


      </div>

    </main>

  );

}