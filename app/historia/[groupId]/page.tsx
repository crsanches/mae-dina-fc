"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import {
  doc,
  getDoc,
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
    params: Promise<{
      groupId: string;
    }>;
  }) {

  const { groupId } = use(params);
  const [frames, setFrames] =
    useState<Frame[]>([]);

  const [groupName, setGroupName] =
    useState("");

  const [currentFrame, setCurrentFrame] =
    useState(0);

  const [playing, setPlaying] =
    useState(true);

  const [speed, setSpeed] =
    useState(1500);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);

      const historySnap =
        await getDoc(
          doc(
            db,
            "leagueHistory",
            groupId
          )
        );

      if (historySnap.exists()) {
        const data =
          historySnap.data();

        setFrames(
          data.frames || []
        );
      } else {
        setFrames([]);
      }

      const groupSnap =
        await getDoc(
          doc(
            db,
            "groups",
            groupId
          )
        );

      if (groupSnap.exists()) {
        setGroupName(
          groupSnap.data().name || ""
        );
      }

      setCurrentFrame(0);
      setLoading(false);
      setPlaying(true);
    }

    loadHistory();
  }, [groupId]);

  useEffect(() => {

    if (!playing) return;
  
    const timer =
      setInterval(() => {
  
        setCurrentFrame((prev) => {
  
          if (
            prev >= frames.length - 1
          ) {
  
            setPlaying(false);
  
            setTimeout(() => {
  
              setCurrentFrame(0);
  
              setPlaying(true);
  
            }, 6000);
  
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
    frames.length,
  ]);

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
        <div className="text-center">
          <h2 className="text-3xl font-bold text-yellow-400">
            🏆 Histórico ainda não disponível
          </h2>

          <p className="text-zinc-400 mt-3">
            Esta liga ainda não possui
            histórico gerado.
          </p>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen relative overflow-hidden bg-zinc-950">
      {/* FUNDO OFICIAL MÃE DINÁ */}

<div
  className="
    absolute
    inset-0
    bg-center
    bg-no-repeat
    bg-cover
    pointer-events-none
  "
  style={{
    backgroundImage:
      "url('/badges/fundo paragrafico bolao.png')",
    backgroundSize: "65%",
    backgroundPosition: "top center",
    opacity: 0.85,
  }}
/>

<div
  className="
    absolute
    inset-0
    bg-black/10
    pointer-events-none
  "
/>

  <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4  py-8">
        <div className="flex justify-end">

          <Link
            href="/"
            className="
              inline-flex
              items-center
              gap-1
              mb-6
              mt-4
              px-2  
              py-1
              rounded-2xl
              bg-gradient-to-r  
              from-yellow-600/60
              to-yellow-700/60
              text-black
              font-bold
              text-xs
            "
          >
            🏆 Voltar ao Mãe Diná FC
          </Link>
          </div>
        <div className="text-center mb-8">

        
          <p className="text-zinc-300 mt-3 text-xl">
            {groupName}
          </p>

          <p className="text-zinc-500 mt-1">
            Evolução do ranking jogo a jogo
          </p>
          {currentFrame === frames.length - 1 && !playing && (

          <div className="
            text-center
            text-yellow-400
            font-bold
            mt-4
            animate-pulse
          ">
            🏆 Reiniciando a corrida...
          </div>

          )}

          

        </div>

        <div
          className="
            bg-black/10
            rounded-3xl
            border
            border-yellow-700/40
            p-6
          "
        >

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
              setPlaying(
                !playing
              )
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
              setPlaying(true);
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

      </div>

    </div>
    </div>
  );
}