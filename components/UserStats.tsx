"use client";

import { useEffect, useState } from "react";

export default function UserStats() {

  const [totalPoints, setTotalPoints] = useState(0);

  function calcularPontuacao() {

    let total = 0;

    for (const key in localStorage) {

      if (key.includes("-")) {

        try {

          const data = localStorage.getItem(key);

          if (data) {

            const parsed = JSON.parse(data);

            total += Number(parsed.points || 0);

          }

        } catch (error) {

          console.error("Erro ao calcular pontos");

        }

      }

    }

    setTotalPoints(total);

  }

  useEffect(() => {

    calcularPontuacao();

    window.addEventListener(
      "betSaved",
      calcularPontuacao
    );

    return () => {

      window.removeEventListener(
        "betSaved",
        calcularPontuacao
      );

    };

  }, []);

  return (
    <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-3xl p-6 shadow-lg">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm uppercase opacity-80">
            Sua posição
          </p>

          <h2 className="text-5xl font-black">
            #1
          </h2>
        </div>

        <div className="text-right">
          <p className="text-sm uppercase opacity-80">
            Pontos
          </p>

          <h2 className="text-5xl font-black">
            {totalPoints}
          </h2>
        </div>

      </div>

    </div>
  );
}