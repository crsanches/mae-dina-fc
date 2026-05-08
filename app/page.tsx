"use client";

import Header from "../components/Header";
import MatchCard from "../components/MatchCard";
import BetTable from "../components/BetTable";
import UserStats from "../components/UserStats";
import MemeCard from "../components/MemeCard";
import LoginCard from "../components/LoginCard";
import RealRanking from "../components/RealRanking";


import { useEffect, useState } from "react";

import { db, auth} from "../lib/firebase";
import {getAutomaticMeme} from "../lib/automaticMemes";
import {
  calculatePoints
} from "../lib/calculatePoints";

import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query
} from "firebase/firestore";

type Game = {
  id: string;

  teamA: string;
  teamB: string;

  emojiA: string;
  emojiB: string;

  phase: string;

  matchDate: string;

  resultadoA?: number;
  resultadoB?: number;
};

export default function Home() {

  const [jogos, setJogos] =
    useState<Game[]>([]);

  const [memeAleatorio, setMemeAleatorio] =
    useState("");
  
    const [automaticMeme, setAutomaticMeme] =
    useState("");
    useEffect(() => {

      const q = query(
    
        collection(db, "games"),
    
        orderBy("createdAt", "asc")
    
      );
    
      const unsubscribe =
        onSnapshot(
    
          q,
    
          (snapshot) => {
    
            const games: Game[] = [];
    
            snapshot.forEach((doc) => {
    
              const data = doc.data();
    
              games.push({
    
                id: doc.id,
    
                teamA: data.teamA,
                teamB: data.teamB,
    
                emojiA: data.emojiA,
                emojiB: data.emojiB,
    
                phase: data.phase,
    
                matchDate: data.matchDate,
    
                resultadoA: data.resultadoA,
                resultadoB: data.resultadoB
    
              });
    
            });
    
            setJogos(games);
    
          }
    
        );
    
      return () => unsubscribe();
    
    }, []);
useEffect(() => {

  const unsubscribe =
    onSnapshot(

      collection(db, "memes"),

      (snapshot) => {

        const memes: string[] = [];

  const currentUser =
  auth.currentUser?.displayName;

        snapshot.forEach((doc) => {

          const data = doc.data();

          if (
            data.active &&
            (
              !data.targetUser ||
              data.targetUser === currentUser
            )
          ) {

            memes.push(data.text);

          }

        });

        if (memes.length > 0) {

          const randomIndex =

            Math.floor(
              Math.random() *
              memes.length
            );

          setMemeAleatorio(
            memes[randomIndex]
          );

        }

      }

    );

  return () => unsubscribe();

}, []);
  
useEffect(() => {

  async function gerarMemeAutomatico() {

    const currentUser =
      auth.currentUser?.displayName;

    if (!currentUser) {
      return;
    }

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

    let exactScore = false;

    let crazyBet = false;

    betsSnapshot.forEach((betDoc) => {

      const bet =
        betDoc.data();

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

          if (
            bet.userName === currentUser &&
            Number(bet.golsA) === Number(game.resultadoA) &&
            Number(bet.golsB) === Number(game.resultadoB)
          ) {

            exactScore = true;

          }

          if (
            bet.userName === currentUser &&
            (
              Number(bet.golsA) >= 6 ||
              Number(bet.golsB) >= 6
            )
          ) {

            crazyBet = true;

          }

        }

      });

      if (!ranking[bet.userName]) {

        ranking[bet.userName] = 0;

      }

      ranking[bet.userName] += points;

    });

    const sorted =

      Object.entries(ranking)

        .sort(
          (a, b) =>
            b[1] - a[1]
        );

    const isLeader =
      sorted[0]?.[0] === currentUser;

    const isLastPlace =
      sorted[
        sorted.length - 1
      ]?.[0] === currentUser;

    const meme =
      getAutomaticMeme({

        isLeader,

        isLastPlace,

        exactScore,

        crazyBet

      });

    if (meme) {

      setAutomaticMeme(meme);

    }

  }

  gerarMemeAutomatico();

}, []);


  const jogosAbertos = jogos.filter((jogo) => {

    const gameDate =
      new Date(jogo.matchDate);

    const now = new Date();

    const difference =
      gameDate.getTime() - now.getTime();

    const oneHour =
      1000 * 60 * 60;

    return difference > oneHour;

  });

  const jogosEncerrados = jogos.filter((jogo) => {

    const gameDate =
      new Date(jogo.matchDate);

    const now = new Date();

    const difference =
      gameDate.getTime() - now.getTime();

    const oneHour =
      1000 * 60 * 60;

    return difference <= oneHour;

  });

  const jogosAbertosPorFase =
    jogosAbertos.reduce((acc, jogo) => {

      if (!acc[jogo.phase]) {
        acc[jogo.phase] = [];
      }

      acc[jogo.phase].push(jogo);

      return acc;

    }, {} as Record<string, typeof jogos[number][]>);

  const jogosEncerradosPorFase =
    jogosEncerrados.reduce((acc, jogo) => {

      if (!acc[jogo.phase]) {
        acc[jogo.phase] = [];
      }

      acc[jogo.phase].push(jogo);

      return acc;

    }, {} as Record<string, typeof jogos[number][]>);

  return (

    <main className="min-h-screen bg-zinc-950 text-white pb-20">

      <Header />

      <section className="max-w-2xl mx-auto px-2 md:px-4 grid gap-3">

        {/* LOGIN */}
        <LoginCard />

        {/* STATUS USUÁRIO */}
        <UserStats />

        {/* RANKING */}
        <RealRanking />

        {/* MEME */}
        {automaticMeme && (

        <div className="mb-5 bg-purple-900 border border-purple-700 rounded-2xl p-4 text-center">

          <p className="text-lg font-black">
            🤖 {automaticMeme}
          </p>

        </div>

        )}
        <MemeCard
          mensagem={memeAleatorio}
        />

        {/* JOGOS ABERTOS */}
        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-xl font-black">
              ⚽ Jogos da Rodada
            </h2>

            <span className="text-zinc-400 text-xs">
              Faça seus palpites 😎
            </span>

          </div>

          <div className="space-y-4">

            {Object.entries(jogosAbertosPorFase).map(
              ([fase, jogosDaFase]) => (

                <div
                  key={fase}
                  className="mb-6"
                >

                  <h3 className="text-lg font-black mb-3 text-blue-400">
                    {fase}
                  </h3>

                  <div className="space-y-3">

                    {jogosDaFase.map((jogo) => (

                      <MatchCard
                        key={`${jogo.teamA}-${jogo.teamB}`}
                        teamA={jogo.teamA}
                        teamB={jogo.teamB}
                        emojiA={jogo.emojiA}
                        emojiB={jogo.emojiB}
                        resultadoA={jogo.resultadoA}
                        resultadoB={jogo.resultadoB}
                        matchDate={jogo.matchDate}
                      />

                    ))}

                  </div>

                </div>

            ))}

          </div>

        </div>

        {/* MINHAS APOSTAS */}
        <BetTable />

        {/* JOGOS ENCERRADOS */}
        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">

          <h2 className="text-xl font-black mb-4">
            📜 Resultados Oficiais
          </h2>

          {Object.entries(jogosEncerradosPorFase).map(
            ([fase, jogosDaFase]) => (

              <div
                key={fase}
                className="mb-5"
              >

                <h3 className="text-base font-black mb-3 text-red-400">
                  {fase}
                </h3>

                <div className="space-y-3">

                  {jogosDaFase.map((jogo) => (

                    <div
                      key={`${jogo.teamA}-${jogo.teamB}`}
                      className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 flex justify-between items-center"
                    >

                      <div>

                        <p className="font-bold text-sm">

                          {jogo.emojiA}
                          {" "}
                          {jogo.teamA}

                          {" x "}

                          {jogo.emojiB}
                          {" "}
                          {jogo.teamB}

                        </p>

                        <p className="text-zinc-400 text-xs">
                          🔒 Encerrado
                        </p>

                      </div>

                      <p className="font-black text-lg">
                        {jogo.resultadoA}
                        {" x "}
                        {jogo.resultadoB}
                      </p>

                    </div>

                  ))}

                </div>

              </div>

          ))}

        </div>

      </section>

    </main>

  );

}