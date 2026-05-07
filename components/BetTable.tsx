"use client";

import { useEffect, useState } from "react";

type Bet = {
  jogo: string;
  user: string;
  golsA: string;
  golsB: string;
  points: number;
};

export default function BetTable() {

  const [bets, setBets] = useState<Bet[]>([]);

  function carregarApostas() {

    const allBets: Bet[] = [];
  
    for (const key in localStorage) {
  
      if (key.includes("-")) {
  
        try {
  
          const data = localStorage.getItem(key);
  
          if (data) {
  
            const parsed = JSON.parse(data);
  
            allBets.push({
                user: parsed.user || "Anônimo",
                jogo: key,
                golsA: parsed.golsA,
                golsB: parsed.golsB,
                points: parsed.points || 0
              });
  
          }
  
        } catch {
  
          console.error("Erro ao carregar aposta");
  
        }
  
      }
  
    }
  
    setBets(allBets);
  
  }

  useEffect(() => {

    const timeout = setTimeout(() => {
  
      carregarApostas();
  
    }, 0);
  
    window.addEventListener(
      "betSaved",
      carregarApostas
    );
  
    return () => {
  
      clearTimeout(timeout);
  
      window.removeEventListener(
        "betSaved",
        carregarApostas
      );
  
    };
  
  }, []);

  return (
    <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">

      <h2 className="text-2xl font-bold mb-5">
        📋 Minhas Apostas
      </h2>

      <div className="space-y-3">

        {bets.length === 0 && (
          <p className="text-zinc-400">
            Nenhuma aposta salva.
          </p>
        )}

        {bets.map((bet, index) => (

          <div
            key={index}
            className="bg-zinc-800 rounded-2xl p-4 flex justify-between items-center"
          >

          <div>

          <p className="font-semibold">
            {bet.jogo}
          </p>

          <p className="text-zinc-400 text-sm">
            👤 {bet.user}
          </p>

          </div>

            <div className="text-right">

            <p className="text-green-400 font-bold">
                {bet.golsA} x {bet.golsB}
            </p>

            <p className="text-yellow-400 text-sm font-semibold">
            ⭐ {Number(bet.points)} pts
            </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}