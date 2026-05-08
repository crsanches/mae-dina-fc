"use client";

import { useEffect, useState } from "react";

import { db } from "../../../lib/firebase";

import {
  collection,
  getDocs,
  updateDoc,
  doc
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

export default function AdminResultsPage() {

  const [games, setGames] =
    useState<Game[]>([]);

  async function carregarJogos() {

    const snapshot =
      await getDocs(
        collection(db, "games")
      );

    const loadedGames: Game[] = [];

    snapshot.forEach((docItem) => {

      const data = docItem.data();

      loadedGames.push({

        id: docItem.id,

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

    setGames(loadedGames);

  }

  useEffect(() => {

    carregarJogos();

  }, []);

  async function salvarResultado(
    gameId: string,
    resultadoA: number,
    resultadoB: number
  ) {

    await updateDoc(
      doc(db, "games", gameId),
      {
        resultadoA,
        resultadoB
      }
    );

    alert("Resultado salvo 😎");

    carregarJogos();

  }

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-6">

      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-black mb-8">
          🏆 Resultados Oficiais
        </h1>

        <div className="space-y-5">

          {games.map((game) => (

            <GameResultCard
              key={game.id}
              game={game}
              onSave={salvarResultado}
            />

          ))}

        </div>

      </div>

    </main>

  );

}

type CardProps = {
  game: Game;

  onSave: (
    gameId: string,
    resultadoA: number,
    resultadoB: number
  ) => void;
};

function GameResultCard({
  game,
  onSave
}: CardProps) {

  const [resultadoA, setResultadoA] =
    useState(
      game.resultadoA?.toString() || ""
    );

  const [resultadoB, setResultadoB] =
    useState(
      game.resultadoB?.toString() || ""
    );

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

      <div className="flex justify-between items-center mb-4">

        <div>

          <h2 className="text-2xl font-black">

            {game.emojiA}
            {" "}
            {game.teamA}

            {" x "}

            {game.emojiB}
            {" "}
            {game.teamB}

          </h2>

          <p className="text-zinc-400">
            {game.phase}
          </p>

        </div>

      </div>

      <div className="flex items-center gap-4">

        <input
          type="number"
          value={resultadoA}
          onChange={(e) =>
            setResultadoA(e.target.value)
          }
          className="w-24 bg-zinc-800 rounded-xl p-3 text-center text-2xl"
        />

        <span className="text-2xl font-black">
          x
        </span>

        <input
          type="number"
          value={resultadoB}
          onChange={(e) =>
            setResultadoB(e.target.value)
          }
          className="w-24 bg-zinc-800 rounded-xl p-3 text-center text-2xl"
        />

        <button
          onClick={() =>
            onSave(
              game.id,
              Number(resultadoA),
              Number(resultadoB)
            )
          }
          className="bg-green-500 hover:bg-green-600 transition text-black font-black rounded-2xl px-5 py-3"
        >
          Salvar
        </button>

      </div>

    </div>

  );

}