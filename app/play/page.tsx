"use client";

import Link from "next/link";

import MatchCard from "../../components/MatchCard";

import {
  FaseCopa,
  obterPesoDaFase
} from "../../lib/copas";

import {
  useEffect,
  useState
} from "react";

import {
  db
} from "../../lib/firebase";

import {
  collection,
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

  resultadoA?: number;
  resultadoB?: number;

  matchDate: string;

  fase?: FaseCopa;

  pesoFase?: number;

};

export default function PlayPage() {

  const [games, setGames] =
    useState<Game[]>([]);

  useEffect(() => {

    const q = query(

      collection(db, "games"),

      orderBy(
        "matchDate",
        "asc"
      )

    );

    const unsubscribe =
      onSnapshot(q, (snapshot) => {

        const loadedGames: Game[] = [];

        snapshot.forEach((doc) => {

          const data =
            doc.data();

          loadedGames.push({

            id:
              doc.id,

            teamA:
              data.teamA,

            teamB:
              data.teamB,

            emojiA:
              data.emojiA,

            emojiB:
              data.emojiB,

            resultadoA:
              data.resultadoA,

            resultadoB:
              data.resultadoB,

            matchDate:
              data.matchDate,

              fase:
              data.fase || "grupos",
            
              pesoFase:
              obterPesoDaFase(
                data.fase || "grupos"
              ),

          });

        });

        setGames(
          loadedGames
        );

      });

    return () => unsubscribe();

  }, []);

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-4">

      <div className="max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-6">

          <h1 className="text-3xl font-black">

            🎯 Faça seus palpites

          </h1>

          <Link
            href="/"
            className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2 rounded-xl font-bold text-sm"
          >

            ← Voltar ao menu

          </Link>

        </div>

        <div className="space-y-4">

          {games.length === 0 && (

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-400">

              Nenhum jogo cadastrado 😥

            </div>

          )}

          {games.map((game) => (

            <MatchCard
            key={game.id}

            teamA={game.teamA}
            teamB={game.teamB}

            emojiA={game.emojiA}
            emojiB={game.emojiB}

            resultadoA={game.resultadoA}
            resultadoB={game.resultadoB}

            matchDate={game.matchDate}

            fase={game.fase}
            pesoFase={game.pesoFase}
            />

          ))}

        </div>

      </div>

    </main>

  );

}