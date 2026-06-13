"use client";

import { useEffect, useState } from "react";

const frases = [
  "📈 A IA detectou que o líder está completamente iludido.",
  "🚨 Existem fortes indícios de sorte temporária no topo da tabela.",
  "🤖 Nosso algoritmo prevê corneta intensa nas próximas 48 horas.",
  "📊 O lanterna segue firme no projeto de longo prazo.",
  "⚽ Estatisticamente, alguém vai reclamar da pontuação hoje.",
  "🔥 O mercado de palpites opera em forte tendência de emoção.",
  "🏆 O líder já começou a pesquisar onde comprar a moldura da taça.",
  "😱 Detectamos níveis preocupantes de confiança em alguns participantes.",
  "🎯 A IA calcula 87% de chance de alguém culpar o VAR hoje.",
  "🍿 A próxima rodada promete fortes emoções e cornetas históricas.",
  "🚑 O departamento médico monitora os impactos psicológicos da lanterna.",
  "💰 O mercado de apostas segue altamente especulativo.",
];

export default function FundamentalistaIA() {
  const [frase, setFrase] = useState("");

  useEffect(() => {
    // Troca uma vez por dia
    const indice =
      Math.floor(Date.now() / 86400000) % frases.length;

    setFrase(frases[indice]);
  }, []);

  return (
    <div
      className="
        bg-gradient-to-r
        from-purple-900
        to-indigo-900
        rounded-3xl
        p-5
        border
        border-purple-700
        shadow-lg
      "
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">🧠</span>

        <div>
          <h2 className="text-xl font-black text-purple-200">
            Análise Fundamentalista IA
          </h2>

          <p className="text-xs text-purple-300">
            Powered by Mãe Diná Analytics™
          </p>
        </div>
      </div>

      <p className="text-zinc-100 leading-relaxed">
        {frase}
      </p>
    </div>
  );
}