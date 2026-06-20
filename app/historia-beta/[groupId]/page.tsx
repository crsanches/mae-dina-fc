"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  doc,
  getDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import LeagueRace from "@/components/LeagueRace";

type RankingItem = {
  username: string;
  points: number;
  position: number;
};

type Frame = {
  step: number;
  match: string;
  ranking: RankingItem[];
};

export default function HistoriaPage({
    params,
  }: {
    params: {
      groupId: string;
    };
  }) {

  const [frames, setFrames] =
    useState<Frame[]>([]);

  const [currentFrame, setCurrentFrame] =
    useState(0);

  const [playing, setPlaying] =
    useState(false);
  
  const [speed, setSpeed] =
    useState(1200);

  const [loading, setLoading] =
    useState(true);

  const [groupName, setGroupName] =
    useState("");

  useEffect(() => {

    async function loadHistory() {


      const snap =
        await getDoc(
          doc(
            db,
            "leagueHistory",
            params.groupId
          )
        );

      if (snap.exists()) {

        const data =
          snap.data();

        setFrames(
          data.frames || []
        );

      }

      const groupSnap =
        await getDoc(
            doc(
            db,
            "groups",
            params.groupId
            )
        );

        if (groupSnap.exists()) {

        setGroupName(
            groupSnap.data().name || ""
        );

        }
      setLoading(false);

    }

    loadHistory();

  }, []);

  useEffect(() => {

    if (!playing) return;
  
    const timer =
      setInterval(() => {
  
        setCurrentFrame((prev) => {
  
          if (
            prev >= frames.length - 1
          ) {
  
            setPlaying(false);
  
            return prev;
  
          }
  
          return prev + 1;
  
        });
  
      }, speed);
  
    return () =>
      clearInterval(timer);
  
  }, [
    playing,
    speed,
    frames.length
  ]);

  function nextFrame() {

    setCurrentFrame((prev) =>
      Math.min(
        prev + 1,
        frames.length - 1
      )
    );

  }

  function prevFrame() {

    setCurrentFrame((prev) =>
      Math.max(
        prev - 1,
        0
      )
    );

  }

  if (loading) {

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Carregando...
      </div>
    );

  }

  if (!frames.length) {

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Nenhum histórico encontrado.
      </div>
    );

  }

  return (

    <div className="min-h-screen bg-zinc-950">

      <div className="max-w-7xl mx-auto px-4 py-8">

        <Link
          href="/"
          className="
            inline-flex
            items-center
            gap-2
            mb-6
            px-5
            py-3
            rounded-2xl
            bg-gradient-to-r
            from-yellow-600
            to-yellow-700
            text-black
            font-bold
          "
        >
          🏆 Voltar ao Mãe Diná FC
        </Link>

        <div className="text-center mb-8">

          <h1 className="text-5xl font-bold text-yellow-400">
            🏆 Corrida Pelo Título
          </h1>

          <p className="text-zinc-300 mt-3 text-xl">
            {groupName}
          </p>
            <p className="text-zinc-500 mt-1">
            Evolução jogo a jogo
           </p>

        </div>

        <div className="bg-zinc-900 rounded-3xl border border-yellow-700 p-6">

        <LeagueRace
            frame={
                frames[currentFrame]
            }
            totalFrames={
                frames.length
            }
            />

        </div>

        <div className="flex justify-center gap-3 mt-6 flex-wrap">

            <button
                onClick={() =>
                setPlaying(!playing)
                }
                className="
                px-5 py-3
                rounded-xl
                bg-green-600
                text-white
                font-bold
                "
            >
                {playing
                ? "⏸ Pausar"
                : "▶ Iniciar"}
            </button>

            <button
                onClick={() => {

                setCurrentFrame(0);

                setPlaying(false);

                }}
                className="
                px-5 py-3
                rounded-xl
                bg-zinc-700
                text-white
                "
            >
                ⏮ Reiniciar
            </button>

        </div>

        <div className="flex justify-center gap-2 mt-4">

<button
  onClick={() =>
    setSpeed(2000)
  }
  className="
    px-4 py-2
    rounded-lg
    bg-zinc-800
    text-white
  "
>
  🐢
</button>

<button
  onClick={() =>
    setSpeed(1000)
  }
  className="
    px-4 py-2
    rounded-lg
    bg-zinc-800
    text-white
  "
>
  🚶
</button>

<button
  onClick={() =>
    setSpeed(500)
  }
  className="
    px-4 py-2
    rounded-lg
    bg-zinc-800
    text-white
  "
>
  🏃
</button>

</div>           


      </div>

    </div>

  );

}