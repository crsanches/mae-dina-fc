"use client";

import Link from "next/link";


export default function AdminDashboard() {

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-6">

      <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 transition px-5 py-3 rounded-2xl font-bold"
        >

          ← Voltar ao Bolão

        </Link>

      </div>

        <h1 className="text-5xl font-black mb-10">
          👑 Painel Administrativo
        </h1>

        <div className="grid md:grid-cols-2 gap-6">

          {/* CRIAR JOGOS */}
          <Link
            href="/admin"
            className="bg-blue-950 hover:bg-blue-900 transition border border-blue-700 rounded-3xl p-8"
          >

            <div className="text-5xl mb-5">
              ⚽
            </div>

            <h2 className="text-3xl font-black mb-3">
              Criar Jogos
            </h2>

            <p className="text-zinc-300 leading-relaxed">

              Cadastre jogos,
              fases,
              horários
              e organize
              toda a competição.

            </p>

          </Link>

          {/* RESULTADOS */}
          <Link
            href="/admin/results"
            className="bg-green-950 hover:bg-green-900 transition border border-green-700 rounded-3xl p-8"
          >

            <div className="text-5xl mb-5">
              🏆
            </div>

            <h2 className="text-3xl font-black mb-3">
              Resultados Oficiais
            </h2>

            <p className="text-zinc-300 leading-relaxed">

              Lance resultados,
              encerre partidas
              e atualize
              o ranking global.

            </p>

          </Link>

        </div>

        {/* FUTURAS FUNÇÕES */}

        <div className="mt-10 grid md:grid-cols-2 gap-6">

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 opacity-70">

            <div className="text-5xl mb-5">
              🤡
            </div>

            <h2 className="text-3xl font-black mb-3">
              Central de Memes
            </h2>

            <p className="text-zinc-400">

              Em breve:
              memes aleatórios,
              memes personalizados
              e humilhação pública
              automatizada 😄

            </p>

          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 opacity-70">

            <div className="text-5xl mb-5">
              📊
            </div>

            <h2 className="text-3xl font-black mb-3">
              Analytics
            </h2>

            <p className="text-zinc-400">

              Estatísticas,
              erros grotescos,
              acertos milagrosos
              e histórico do bolão.

            </p>

          </div>

        </div>

      </div>

    </main>

  );

}