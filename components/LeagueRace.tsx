"use client";

import { motion } from "framer-motion";

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

          <h2 className="text-3xl font-bold text-yellow-400">
            Jogo {frame.step} de {totalFrames}
          </h2>

          <p className="text-zinc-300 mt-1 text-lg">
            {frame.match}
          </p>

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
                duration: 0.45,
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
          gap-3
          mb-4
          pb-3
          border-b
          border-yellow-700/30
          text-yellow-400
          uppercase
          font-bold
          text-sm
        "
      >

        <div className="w-10 text-center">
          Pos.
        </div>

        <div className="w-56">
          Apostador
        </div>

        <div className="flex-1" />

        <div className="w-16 text-right">
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
                  gap-3
                  py-2
                  border-b
                  border-white/5
                "
              >

                {/* POSIÇÃO */}

                <div
                  className={`
                    w-10
                    text-center
                    font-bold
                    text-lg
                    ${
                      player.position === 1
                        ? "text-yellow-300"
                        : player.position === 2
                        ? "text-zinc-300"
                        : player.position === 3
                        ? "text-amber-500"
                        : "text-zinc-500"
                    }
                  `}
                >
                  {player.position}
                </div>

                {/* NOME */}

                <div
                  className="
                    w-56
                    truncate
                    text-white
                    font-medium
                  "
                >
                  {player.username}
                </div>

                {/* BARRA */}

                <div className="flex-1">

                  <div
                    className="
                      w-full
                      h-9
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

                <div
                  className="
                    w-16
                    text-right
                    text-white
                    font-bold
                    text-lg
                  "
                >
                  {player.points}
                </div>

              </div>

            </motion.div>

          );

        })}

      </div>

    </div>
  );
}