"use client";

// esse é o que administra e registra os jogos.

import Link from "next/link";

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

  fase: string;

  grupo?: string;

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

  const [updated, setUpdated] =
    useState(false);

  const [games, setGames] =
    useState<Game[]>([]);

  const [editedDates, setEditedDates] =
    useState<{ [key: string]: string }>({});
  
  const [savingGameId, setSavingGameId] =
    useState<string | null>(null);
  
  const [savedGameId, setSavedGameId] =
    useState<string | null>(null);

    const [showCreateForm, setShowCreateForm] =
    useState(false);
  
  const groupedGames =
    games.reduce(
  
      (acc, game) => {
  
        const grupo =
          game.grupo || "Mata-Mata";
  
        if (!acc[grupo]) {
  
          acc[grupo] = [];
  
        }
  
        acc[grupo].push(game);
  
        return acc;
  
      },
  
      {} as Record<string, Game[]>
  
    );

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

        fase: data.fase || data.phase,

        grupo: data.grupo,

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

        match:
          `${teamA} x ${teamB}`,

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

          </div>
        

        {/* TÍTULO */}

        <h1 className="text-4xl font-black mb-6">
          ⚽ Gerenciamento de Jogos
        </h1>

        <button
          onClick={() =>
            setShowCreateForm(
              !showCreateForm
            )
          }
          className="
            w-full
            bg-green-600
            hover:bg-green-700
            transition
            rounded-2xl
            p-4
            font-black
            mb-6
          "
        >
          {showCreateForm

            ? "➖ Fechar cadastro"

            : "➕ Novo Jogo"

          }
        </button>



        {/* FORMULÁRIO */}
        {showCreateForm && (
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-4">

          <div>

            <label className="block mb-2 font-semibold text-sm">
              Time A
            </label>

            <input
              value={teamA}
              onChange={(e) =>
                setTeamA(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3 text-sm"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold text-sm">
              Emoji Time A
            </label>

            <input
              value={emojiA}
              onChange={(e) =>
                setEmojiA(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3 text-sm"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold text-sm">
              Time B
            </label>

            <input
              value={teamB}
              onChange={(e) =>
                setTeamB(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3 text-sm"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold text-sm">
              Emoji Time B
            </label>

            <input
              value={emojiB}
              onChange={(e) =>
                setEmojiB(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3 text-sm"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold text-sm">
              Fase
            </label>

            <select
              value={phase}
              onChange={(e) =>
                setPhase(e.target.value)
              }
              className="w-full bg-zinc-800 rounded-xl p-3 text-sm"
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

            <label className="block mb-2 font-semibold text-sm">
              Data/Hora do jogo
            </label>

           
          </div>

          <button
            onClick={criarJogo}
            className="w-full bg-green-500 hover:bg-green-600 transition text-black font-bold rounded-xl p-3 text-sm"
          >
            🚀 Criar Jogo
          </button>

          {success && (

            <div className="bg-green-500 text-black font-bold rounded-xl p-3 text-center text-sm">

              ✅ Jogo criado com sucesso!

            </div>

          )}

        </div>
        )}

        {/* LISTA DE JOGOS */}

        <div className="mt-8">

          <h2 className="text-2xl font-black mb-4">
            📋 Jogos Cadastrados
          </h2>

          
          <div className="space-y-3">

          {Object
            .entries(groupedGames)
            .sort(
              ([grupoA], [grupoB]) =>
                grupoA.localeCompare(grupoB)
            ).map(

          ([grupo, jogos]) => (

            <div
              key={grupo}
              className="mb-10"
            >

              <h2
                className="
                  text-3xl
                  font-black
                  text-yellow-400
                  mb-4
                "
              >

                {grupo === "Mata-Mata"

                  ? "🏆 Mata-Mata"

                  : `Grupo ${grupo}`

                }

              </h2>

              <div className="space-y-3">

        {jogos.map((game) => (

              <div
                key={game.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
              >

                <div className="flex justify-between items-center">

                  <div>

                    <h3 className="text-xl font-black">

                      {game.emojiA}
                      {" "}
                      {game.teamA}

                      {" x "}

                      {game.emojiB}
                      {" "}
                      {game.teamB}

                    </h3>

                    <p className="text-zinc-400 text-sm">

                      {game.grupo

                        ? `Grupo ${game.grupo}`

                        : game.fase

                      }

                    </p>

                  </div>

                  <button
                    onClick={() =>
                      excluirJogo(game.id)
                    }
                    className="bg-red-500 hover:bg-red-600 transition px-3 py-2 rounded-xl text-black font-bold text-sm"
                  >
                    Excluir
                  </button>

                </div>

                <div className="mt-4 pb-4 space-y-4">

                  <label className="block font-semibold text-sm">
                    Alterar data/hora
                  </label>

                  <input
                  type="text"
                  value={
                    editedDates[game.id] ??
                    game.matchDate
                  }
                  onChange={(e) =>
                    setEditedDates({
                      ...editedDates,
                      [game.id]: e.target.value
                    })
                  }
                  placeholder="2026-07-15T21:30"
                  className="w-full bg-zinc-800 rounded-xl p-3 text-sm"
                />
                <p className="text-zinc-500 text-xs">
                  Formato: AAAA-MM-DDTHH:MM
                </p>

                  <button
                    onClick={async () => {

                      setSavingGameId(game.id);

                      await atualizarData(
                        game.id,
                        editedDates[game.id] ||
                        game.matchDate
                      );

                      setSavingGameId(null);

                      setSavedGameId(game.id);

                      setTimeout(() => {

                        setSavedGameId(null);

                      }, 2000);

                    }}
                    className="bg-blue-500 hover:bg-blue-600 transition px-4 py-2 rounded-xl text-black font-bold text-sm"
                  >

                    {savingGameId === game.id
                      ? "Salvando..."
                      : "💾 Confirmar alteração"}

                  </button>

                  {savedGameId === game.id && (

                    <div className="text-green-400 text-sm font-bold">

                      ✅ Alteração salva com sucesso!

                    </div>

                  )}

                </div>

              </div>

            ))}

          </div>

        </div>
)

)}
      </div>
      </div>
      </div>
    </main>

  );

}