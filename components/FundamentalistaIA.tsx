"use client";

const frases = [
  "📈 A IA detectou que o líder está completamente iludido.",
  "🚨 Existem fortes indícios de sorte temporária no topo da tabela.",
  "🤖 Nosso algoritmo prevê corneta intensa nas próximas 48 horas.",
  "📊 O lanterna segue firme no projeto de longo prazo.",
  "⚽ Estatisticamente, alguém vai reclamar da pontuação hoje.",
  "🔥 O mercado de palpites opera em forte tendência de emoção.",
];

export default function FundamentalistaIA() {
  const frase =
    frases[Math.floor(Math.random() * frases.length)];

  return (
    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-5 border border-purple-700">
      <h2 className="text-xl font-black mb-3">
        🧠 Análise Fundamentalista IA
      </h2>

      <p className="text-zinc-100">
        {frase}
      </p>
    </div>
  );
}