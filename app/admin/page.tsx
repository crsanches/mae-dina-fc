"use client";

import { useEffect, useState } from "react";

import { db } from "../../lib/firebase";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

type Game = {
  id: string;

  teamA: string;
  teamB: string;

  emojiA: string;
  emojiB: string;

  phase: string;

  matchDate: string;
};

export default function AdminPage() {

  const [teamA, setTeamA] =
    useState("");

  const [teamB, setTeamB] =
    useState("");

  const [emojiA, setEmojiA] =
    useState("");

  const [emojiB, setEmojiB] =
    useState("");

  const [phase, setPhase] =
    useState("Grupos");

  const [matchDate, setMatchDate] =
    useState("");

  const [success, setSuccess] =
    useState(false);

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

        matchDate: data.matchDate

      });

    });

    setGames(loadedGames);

  }

  useEffect(() => {

    const timeout = setTimeout(() => {

      carregarJogos();

    }, 0);

    return () => clearTimeout(timeout);

  }, []);

  async function criarJogo() {

    if (
      !teamA ||
      !teamB ||
      !matchDate
    ) {

      alert("Preencha tudo 😄");

      return;

    }

    await addDoc(
      collection(db, "games"),
      {

        teamA,
        teamB,

        emojiA,
        emojiB,

        phase,

        matchDate,

        createdAt:
          serverTimestamp()

      }
    );

    setSuccess(true);

    setTeamA("");
    setTeamB("");

    setEmojiA("");
    setEmojiB("");

    setMatchDate("");

    carregarJogos();

    setTimeout(() => {

      setSuccess(false);

    }, 2000);

  }

  async function atualizarData(
    gameId: string,
    newDate: string
  ) {

    await updateDoc(
      doc(db, "games", gameId),
      {
        matchDate: newDate
      }
    );

    carregarJogos();

  }

  async function excluirJogo(
    gameId: string
  ) {

    const confirmDelete =
      confirm(
        "Excluir jogo?"
      );

    if (!confirmDelete) {
      return;
    }

    await deleteDoc(
      doc(db, "games", gameId)
    );

    carregarJogos();

  }

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-6">

      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-black mb-8">
          👑 Admin — Mãe Diná FC
        </h1>

        {/* FORMULÁRIO */}

        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 space-y-5">

          <div>

            <label className="block mb-2 font-bold">
              Time A
            </label>

            <input
              value={teamA}
              onChange={(e) =>
                setTeamA(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-bold">
              Emoji Time A
            </label>

            <input
              value={emojiA}
              onChange={(e) =>
                setEmojiA(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-bold">
              Time B
            </label>

            <input
              value={teamB}
              onChange={(e) =>
                setTeamB(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-bold">
              Emoji Time B
            </label>

            <input
              value={emojiB}
              onChange={(e) =>
                setEmojiB(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-bold">
              Fase
            </label>

            <select
              value={phase}
              onChange={(e) =>
                setPhase(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3"
            >

              <option>
                Grupos
              </option>

              <option>
                Oitavas
              </option>

              <option>
                Quartas
              </option>

              <option>
                Semifinal
              </option>

              <option>
                Final
              </option>

            </select>

          </div>

          <div>

            <label className="block mb-2 font-bold">
              Data/Hora do jogo
            </label>

            <input
              type="datetime-local"
              value={matchDate}
              onChange={(e) =>
                setMatchDate(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3"
            />

          </div>

          <button
            onClick={criarJogo}
            className="w-full bg-green-500 hover:bg-green-600 transition text-black font-black rounded-2xl p-4"
          >
            🚀 Criar Jogo
          </button>

          {success && (

            <div className="bg-green-500 text-black font-bold rounded-xl p-3 text-center">

              ✅ Jogo criado com sucesso!

            </div>

          )}

        </div>

        {/* LISTA DE JOGOS */}

        <div className="mt-10">

          <h2 className="text-3xl font-black mb-5">
            📋 Jogos Cadastrados
          </h2>

          <div className="space-y-4">

            {games.map((game) => (

              <div
                key={game.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5"
              >

                <div className="flex justify-between items-center">

                  <div>

                    <h3 className="text-2xl font-black">

                      {game.emojiA}
                      {" "}
                      {game.teamA}

                      {" x "}

                      {game.emojiB}
                      {" "}
                      {game.teamB}

                    </h3>

                    <p className="text-zinc-400">
                      {game.phase}
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      excluirJogo(game.id)
                    }
                    className="bg-red-500 hover:bg-red-600 transition px-4 py-2 rounded-xl text-black font-bold"
                  >
                    Excluir
                  </button>

                </div>

                <div className="mt-5">

                  <label className="block mb-2 font-bold">
                    Alterar data/hora
                  </label>

                  <input
                    type="datetime-local"
                    defaultValue={game.matchDate}
                    onBlur={(e) =>
                      atualizarData(
                        game.id,
                        e.target.value
                      )
                    }
                    className="bg-zinc-800 rounded-xl p-3"
                  />

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </main>

  );

}