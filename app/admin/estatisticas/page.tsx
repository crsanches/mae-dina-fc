"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  collection,
  getDocs
} from "firebase/firestore";

import { db } from "../../../lib/firebase";

import { buildRanking, type RankingUser } from "../../../lib/buildRanking";


//**************************** */
//  T Y P E S 
//**************************** */

type Stats = {

    totalUsers: number;
  
    totalGames: number;
  
    finishedGames: number;
  
    totalBets: number;
  
    totalGroups: number;
  
  };

  type ScoreStats = {

    max: number;
  
    min: number;
  
    average: number;
  
    median: number;
  
    stdDev: number;
  
  };

  type PrecisionStats = {

    exacts: number;
  
    winners: number;
  
    draws: number;
  
    partials: number;
  
  };

  type LeagueLeader = {

    groupId: string;
  
    groupName: string;
  
    leader: RankingUser;
  
    totalPlayers: number;
  
  };

  type ExactPrediction = {

    league: string;
  
    user: string;
  
    match: string;
  
    result: string;
  
    prediction: string;
  
  };

  type GlobalRankingUser = {

    username: string;
  
    league: string;
  
    points: number;
  
    exacts: number;
  
  };



export default function EstatisticasPage() {


    //**************************** */
    //  S T A T S
    //**************************** */

    const [stats, setStats] =
    useState<Stats>({
        totalUsers: 0,
        totalGames: 0,
        finishedGames: 0,
        totalBets: 0,
        totalGroups: 0
    });

    const [scoreStats, setScoreStats] =
        useState<ScoreStats>({
            max: 0,
            min: 0,
            average: 0,
            median: 0,
            stdDev: 0
        });

  const [precisionStats,
    setPrecisionStats] =
  
    useState<PrecisionStats>({
  
      exacts: 0,
  
      winners: 0,
  
      draws: 0,
  
      partials: 0
  
    });
    
    const [
        leagueLeaders,
        setLeagueLeaders
      ] = useState<
        LeagueLeader[]
      >([]);

      const [
        exactPredictions,
        setExactPredictions
      ] = useState<
        ExactPrediction[]
      >([]);


      const [
        globalRanking,
        setGlobalRanking
      ] = useState<
        GlobalRankingUser[]
      >([]);
      

    useEffect(() => {

        async function load() {
      
          const [
      
            usersSnap,
            gamesSnap,
            betsSnap,
            groupsSnap
      
          ] = await Promise.all([
      
            getDocs(
              collection(db, "users")
            ),
      
            getDocs(
              collection(db, "games")
            ),
      
            getDocs(
              collection(db, "bets")
            ),
      
            getDocs(
              collection(db, "groups")
            )
      
          ]);
          const leaders: LeagueLeader[] = [];
          const exactPredictionsList: ExactPrediction[] = [];
          const globalUsers: GlobalRankingUser[] = [];


          for (const groupDoc of groupsSnap.docs) {

            const ranking =
              await buildRanking(
                groupDoc.id
              );
          
            if (!ranking.length) {
              continue;
            }
          
            leaders.push({

                groupId:
                  groupDoc.id,
              
                groupName:
                  groupDoc.data().name,
              
                leader:
                  ranking[0],
              
                totalPlayers:
                  ranking.length
              
              });
              
              for (const user of ranking) {

                for (const game of user.jogos) {
              
                  if (!game.exato) {
                    continue;
                  }
              
                  exactPredictionsList.push({
              
                    league:
                      groupDoc.data().name,
              
                    user:
                      user.username,
              
                    match:
                      game.jogo,
              
                    result:
                      game.resultado,
              
                    prediction:
                      game.palpite
              
                  });
              
                }
              
            }
            for (const user of ranking) {

                globalUsers.push({
              
                  username:
                    user.username,
              
                  league:
                    groupDoc.data().name,
              
                  points:
                    user.points,
              
                  exacts:
                    user.exatos
              
                });
              
            }

          }
          globalUsers.sort(

            (a, b) =>

                b.points - a.points

            );
         
      
            // SALVAR//
            
            setLeagueLeaders(
              leaders
            );

            setGlobalRanking(
                globalUsers
              );
          
            setExactPredictions(
                exactPredictionsList
              );
          

            const rankings: RankingUser[] = [];

          // CRIANDO DIRSTRIBUICAO DE PONTUACAO
            for (const groupDoc of groupsSnap.docs) {

            const ranking =
                await buildRanking(
                groupDoc.id
                );

            rankings.push(
                ...ranking
            );

            }

            const exacts =

                rankings.reduce(

                    (sum, user) =>

                    sum + user.exatos,

                    0

                );

                const winners =

                rankings.reduce(

                    (sum, user) =>

                    sum + user.acertosVencedor,

                    0

                );

                const draws =

                rankings.reduce(

                    (sum, user) =>

                    sum + user.acertosEmpate,

                    0

                );

                const partials =

                rankings.reduce(

                    (sum, user) =>

                    sum + user.acertosParciais,

                    0

                );

                setPrecisionStats({

                    exacts,
                  
                    winners,
                  
                    draws,
                  
                    partials
                  
                  });
            
            // EXTRAIR PONTOS
            const points =

            rankings.map(
                (user) => user.points
            );
                
                //MAIOR E MENOR
                const max =
                points.length
                  ? Math.max(...points)
                  : 0;
              
              const min =
                points.length
                  ? Math.min(...points)
                  : 0;


            //MEDIA
            const average =
            points.length > 0
                ? points.reduce(
                    (sum, p) => sum + p,
                    0
                ) / points.length
                : 0;  


            //MEDIANA
            const sorted =

            [...points].sort(
                (a, b) => a - b
            );

            const median =

            sorted.length % 2 === 0

                ? (
                    sorted[
                    sorted.length / 2 - 1
                    ] +

                    sorted[
                    sorted.length / 2
                    ]
                ) / 2

                : sorted[
                    Math.floor(
                    sorted.length / 2
                    )
                ];

            //DESCIO PADRAO

            const variance =

            points.reduce(

                (sum, p) =>

                sum +

                Math.pow(
                    p - average,
                    2
                ),

                0

            ) /

            points.length;

            const stdDev =
            Math.sqrt(
                variance
            );


            const finishedGames =
      
            gamesSnap.docs.filter(
      
              (doc) => {
      
                const data =
                  doc.data();
      
                return (
                  data.resultadoA != null &&
                  data.resultadoB != null
                );
      
              }
      
            ).length;

            //SALVAR
            setScoreStats({

                max,
              
                min,
              
                average:
                  Number(
                    average.toFixed(1)
                  ),
              
                median:
                  Number(
                    median.toFixed(1)
                  ),
              
                stdDev:
                  Number(
                    stdDev.toFixed(1)
                  )
              
              });

              
      
          setStats({
      
            totalUsers:
              usersSnap.size,
      
            totalGames:
              gamesSnap.size,
      
            finishedGames,
      
            totalBets:
              betsSnap.size,
      
            totalGroups:
              groupsSnap.size
      
          });
      
        }
      
        load();
      
      }, []);

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-6">

      <div className="max-w-6xl mx-auto">

        <div className="mb-6">

          <Link
            href="/admin/dashboard"
            className="
              inline-flex
              items-center
              gap-2
              bg-zinc-800
              hover:bg-zinc-700
              transition
              px-5
              py-3
              rounded-2xl
              font-bold
            "
          >
            ← Dashboard
          </Link>

 {/* =============*/}   
 {/* NOVO BLOCO   */}
 {/* =============*/}    
        </div>

        <h1 className="text-5xl font-black mb-10">
          📈 Estatísticas
        </h1>

        <div
            className="
                bg-zinc-900
                border
                border-zinc-800
                rounded-3xl
                p-8
                mb-8
            "
            >

            <h2 className="text-3xl font-black mb-6">

            Estatísticas Gerais

            </h2>

            <div className="space-y-3">

                <div className="flex justify-between">

                <span>Usuários</span>

                <span>{stats.totalUsers}</span>

                </div>

            <div className="flex justify-between">

            <span>Ligas</span>

            <span>{stats.totalGroups}</span>

            </div>

            <div className="flex justify-between">

            <span>Jogos</span>

            <span>{stats.totalGames}</span>

            </div>

            <div className="flex justify-between">

            <span>Finalizados</span>

            <span>{stats.finishedGames}</span>

            </div>

            <div className="flex justify-between">

            <span>Palpites</span>

            <span>{stats.totalBets}</span>

            </div>

        </div>

        </div>
    {/* =============*/}   
    {/* NOVO BLOCO   */}
    {/* =============*/}   

    <div
    className="
    bg-zinc-900
    border
    border-zinc-800
    rounded-3xl
    p-8
    mb-8
  "
    >

    <h2 className="text-3xl font-black mb-6">

        Distribuição de Pontuação

    </h2>

    <div className="space-y-3">

        <div className="flex justify-between">

        <span>
            Maior Pontuação
        </span>

        <span>
            {scoreStats.max}
        </span>

        </div>

        <div className="flex justify-between">

        <span>
            Menor Pontuação
        </span>

        <span>
            {scoreStats.min}
        </span>

        </div>

        <div className="flex justify-between">

        <span>
            Média
        </span>

        <span>
            {scoreStats.average}
        </span>

        </div>

        <div className="flex justify-between">

        <span>
            Mediana
        </span>

        <span>
            {scoreStats.median}
        </span>

        </div>

        <div className="flex justify-between">

        <span>
            Desvio Padrão
        </span>

        <span>
            {scoreStats.stdDev}
        </span>

        </div>

    </div>

    </div>


    {/* =============*/}   
    {/* NOVO BLOCO   */}
    {/* =============*/}   


    <div
  className="
    bg-zinc-900
    border
    border-zinc-800
    rounded-3xl
    p-8
    mb-8
  "
>

  <h2 className="text-3xl font-black mb-6">

    Precisão Geral

  </h2>

  <div className="space-y-3">

    <div className="flex justify-between">

      <span>
        Placares Exatos
      </span>

      <span>
        {precisionStats.exacts}
      </span>

    </div>

    <div className="flex justify-between">

      <span>
        Acertos de Vencedor
      </span>

      <span>
        {precisionStats.winners}
      </span>

    </div>

    <div className="flex justify-between">

      <span>
        Acertos de Empate
      </span>

      <span>
        {precisionStats.draws}
      </span>

    </div>

    <div className="flex justify-between">

      <span>
        Acertos Parciais
      </span>

      <span>
        {precisionStats.partials}
      </span>

    </div>

  </div>

    </div>

    {/* =============*/}   
    {/* NOVO BLOCO   */}
    {/* =============*/}   

    <div
  className="
    bg-zinc-900
    border
    border-zinc-800
    rounded-3xl
    p-8
    mb-8
  "
>

  <h2 className="text-3xl font-black mb-6">

    🏆 Líderes por Liga

  </h2>

  <div className="space-y-4">

    {leagueLeaders.map(
      (item) => (

        <div
          key={item.groupId}
          className="
            border-b
            border-zinc-800
            pb-4
          "
        >

          <div className="font-black">

            {item.groupName}

          </div>

          <div>

            {item.leader.username}

          </div>

          <div className="text-sm text-zinc-400">

            {item.leader.points}
            {" "}pontos

            {" • "}

            {item.leader.exatos}
            {" "}exatos

          </div>

          <div className="text-sm text-zinc-500">

            Participantes:
            {" "}
            {item.totalPlayers}

          </div>

        </div>

      )
    )}

  </div>

    </div>


    {/* =============*/}   
    {/* NOVO BLOCO   */}
    {/* =============*/}   


    <div
        className="
            bg-zinc-900
            border
            border-zinc-800
            rounded-3xl
            p-8
            mb-8
        "
        >

        <h2 className="text-3xl font-black mb-6">

            🏅 Ranking Geral

        </h2>

        <div className="space-y-4">

            {globalRanking
            .slice(0, 50)
            .map((user, index) => (

                <div
                key={index}
                className="
                    border-b
                    border-zinc-800
                    pb-4
                "
                >

                <div className="font-black">

                    #{index + 1}

                    {" "}

                    {user.username}

                </div>

                <div className="text-sm text-zinc-400">

                    {user.league}

                </div>

                <div>

                    {user.points}
                    {" "}pontos

                    {" • "}

                    {user.exacts}
                    {" "}exatos

                </div>

                </div>

            ))}

        </div>

    </div>

    {/* =============*/}   
    {/* NOVO BLOCO   */}
    {/* =============*/}   

        <div
        className="
            bg-zinc-900
            border
            border-zinc-800
            rounded-3xl
            p-8
            mb-8
        "
        >

        <h2 className="text-3xl font-black mb-6">

            🎯 Placares Exatos

        </h2>

        <div className="space-y-4">

            {exactPredictions
            .slice(0, 30)
            .map((item, index) => (

                <div
                key={index}
                className="
                    border-b
                    border-zinc-800
                    pb-4
                "
                >

                <div className="font-bold">

                    {item.user}

                </div>

                <div className="text-sm text-zinc-400">

                    Liga:
                    {" "}
                    {item.league}

                </div>

                <div>

                    {item.match}

                </div>

                <div className="text-green-400">

                    Resultado:
                    {" "}
                    {item.result}

                </div>

                <div>

                    Palpite:
                    {" "}
                    {item.prediction}

                </div>

                </div>

            ))}

        </div>

        </div>
</div>


</main>

  );

}