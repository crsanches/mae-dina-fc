"use client";

import { useState } from "react";

import { db } from "../../lib/firebase";

import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

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

    setTimeout(() => {

      setSuccess(false);

    }, 2000);

  }

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-6">

      <div className="max-w-2xl mx-auto">

        <h1 className="text-4xl font-black mb-8">
          👑 Admin — Mãe Diná FC
        </h1>

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

      </div>

    </main>

  );

}