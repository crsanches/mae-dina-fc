"use client";

import Link from "next/link";
import Script from "next/script";

export default function HistoriaPage() {
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
            hover:from-yellow-500
            hover:to-yellow-600
            text-black
            font-bold
            shadow-lg
          "
        >
          🏆 Voltar ao Mãe Diná FC
        </Link>

        <div className="text-center mb-8">

          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400">
            🏆 A Corrida Pelo Título
          </h1>

          <p className="text-zinc-300 mt-3 text-lg">
            Liga Sinergia Copa 2026
          </p>

          <p className="text-zinc-500 text-sm mt-1">
            Evolução do ranking jogo a jogo
          </p>

        </div>

        <div className="bg-zinc-900 rounded-3xl border border-yellow-700 p-4">

          <div
            className="flourish-embed flourish-bar-chart-race"
            data-src="visualisation/29433250"
          >
            <noscript>
              <img
                src="https://public.flourish.studio/visualisation/29433250/thumbnail"
                width="100%"
                alt="Corrida pelo título"
              />
            </noscript>
          </div>

          <Script
            src="https://public.flourish.studio/resources/embed.js"
            strategy="afterInteractive"
          />

        </div>

      </div>

    </div>
  );
}