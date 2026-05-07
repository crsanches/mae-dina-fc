"use client";

import { useEffect, useState } from "react";
import RankingCard from "./RankingCard";
import ShareRanking from "./ShareRanking";

type RankingUser = {
  nome: string;
  pontos: number;
};

export default function RealRanking() {

  const [ranking, setRanking] = useState<
    RankingUser[]
  >([]);

  function calcularRanking() {

    const userPoints: Record<string, number> = {};

    for (const key in localStorage) {

      if (key.includes("-")) {

        try {

          const data =
            localStorage.getItem(key);

          if (data) {

            const parsed = JSON.parse(data);

            const user =
              parsed.user || "Anônimo";

            const points =
              Number(parsed.points || 0);

            if (!userPoints[user]) {
              userPoints[user] = 0;
            }

            userPoints[user] += points;

          }

        } catch {

          console.error(
            "Erro ao calcular ranking"
          );

        }

      }

    }

    const rankingArray =
      Object.entries(userPoints)
        .map(([nome, pontos]) => ({
          nome,
          pontos
        }))
        .sort(
          (a, b) => b.pontos - a.pontos
        );

    setRanking(rankingArray);

  }

  useEffect(() => {

    const timeout = setTimeout(() => {
  
      calcularRanking();
  
    }, 0);
  
    window.addEventListener(
      "betSaved",
      calcularRanking
    );
  
    return () => {
  
      clearTimeout(timeout);
  
      window.removeEventListener(
        "betSaved",
        calcularRanking
      );
  
    };
  
  }, []);

  if (ranking.length === 0) {

    return (

      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">

        <h2 className="text-2xl font-bold mb-5">
          🏆 Ranking Real
        </h2>

        <p className="text-zinc-400">
          Nenhuma aposta ainda.
        </p>

      </div>

    );

  }

  const campeao = ranking[0];

  const ultimo =
    ranking[ranking.length - 1];

  return (

    <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">

      <h2 className="text-2xl font-bold mb-5">
        🏆 Ranking Real
      </h2>

      <div className="mb-5 space-y-2">

        <div className="bg-green-500 text-black rounded-xl p-3 font-bold">
          👑 {campeao.nome} lidera com {campeao.pontos} pts
        </div>

        <div className="bg-red-500 text-black rounded-xl p-3 font-bold">
          🤡 {ultimo.nome} está precisando estudar futebol
        </div>

      </div>

      <div className="space-y-3">

        {ranking.map((user, index) => (

          <RankingCard
            key={user.nome}
            nome={user.nome}
            pontos={user.pontos}
            emoji={
              index === 0
                ? "🥇"
                : index === 1
                ? "🥈"
                : index === 2
                ? "🥉"
                : "⚽"
            }
            destaque={index === ranking.length - 1}
          />

        ))}

      </div>
      <div className="mt-5">

        <ShareRanking ranking={ranking} />

        </div>
    </div>

  );
}