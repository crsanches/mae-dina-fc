"use client";

import { motion, AnimatePresence, } from "framer-motion";

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

type Props = {
  frame: Frame;
  totalFrames: number;
};

export default function LeagueRace({
  frame,
  totalFrames,
}: Props) {

  const maxPoints = Math.max(
    ...frame.ranking.map(
      (r) => r.points
    ),
    1
  );

  return (
    <div>

      {/* ======================================
          CABEÇALHO
      ====================================== */}

      <div className="mb-8">

        <div className="text-center">

        <AnimatePresence mode="wait">

<motion.div
  key={frame.step}
  initial={{
    opacity: 0,
  }}
  animate={{
    opacity: 1,
  }}
  exit={{
    opacity: 0,
  }}
  transition={{
    duration: 0.4,
  }}
>

  <h2 className="text-xl font-bold text-yellow-400">
    Jogo {frame.step} de {totalFrames}
  </h2>

  <p className="text-zinc-300 mt-1 text-sm">
    {frame.match}
  </p>

</motion.div>

</AnimatePresence>

        </div>

        <div className="mt-5">

          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">

            <motion.div
              className="
                h-3
                rounded-full
                bg-gradient-to-r
                from-yellow-500
                to-yellow-700
              "
              animate={{
                width: `${
                  (frame.step / totalFrames) * 100
                }%`,
              }}
              transition={{
                duration: 0.35,
                ease: "linear",
              }}
            />

          </div>

          <div className="text-center text-xs text-zinc-400 mt-2">

            {Math.round(
              (frame.step / totalFrames) * 100
            )}
            % da Copa concluída

          </div>

        </div>

      </div>

      {/* ======================================
          CABEÇALHO DAS COLUNAS
      ====================================== */}

<div
  className="
    flex
    items-center
    gap-2
    mb-2
    pb-2
    border-b
    border-yellow-700/30
    text-yellow-400
    uppercase
    font-bold
    text-[9px]
  "
>

  <div className="w-30">
    Apostador
  </div>

  <div className="flex-1" />

  <div className="w-8 text-right">
    Pontos
  </div>

</div>

      {/* ======================================
          RANKING
      ====================================== */}

      <div>

        {frame.ranking.map((player) => {

          const width =
            (player.points / maxPoints) * 100;

          const isLeader =
            player.position === 1;

          return (

            <motion.div
              key={player.username}
              layout
              transition={{
                layout: {
                  duration: 0.55,
                  type: "spring",
                  damping: 25,
                  stiffness: 120,
                },
              }}
            >

<div
  className="
    flex
    items-center
    gap-2
    py-1
    border-b
    border-white/5
  "
>

  {/* POSIÇÃO */}

  <div className="w-6 text-center">

    <span className="font-bold text-yellow-400 text-[10px]">
      {player.position}
    </span>

  </div>

  {/* NOME */}

  <div className="w-24 truncate">

    <span className="text-white text-[10px]">
      {player.username}
    </span>

  </div>

  {/* BARRA */}

  <div className="flex-1">

    <div
      className="
        w-full
        h-4
        rounded-xl
        bg-white/10
        overflow-hidden
        border
        border-white/5
      "
    >

      <motion.div
        animate={{
          width: `${width}%`,
        }}
        transition={{
          duration: 0.55,
          ease: "linear",
        }}
        className={`
          h-full
          ${
            isLeader
              ? "bg-gradient-to-r from-yellow-300/25 to-yellow-500/45"
              : "bg-gradient-to-r from-yellow-500/18 to-yellow-700/28"
          }
        `}
      />

    </div>

  </div>

  {/* PONTOS */}

  <div className="w-8 text-right">

    <span className="font-bold text-white text-[10px]">
      {player.points}
    </span>

  </div>

</div>

            </motion.div>

          );

        })}

      </div>

    </div>
  );
}