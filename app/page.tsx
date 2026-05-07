"use client";
import Header from "../components/Header";
import MatchCard from "../components/MatchCard";
import BetTable from "../components/BetTable";
import UserStats from "../components/UserStats";
import MemeCard from "../components/MemeCard";
import { memes } from "../data/memes";
import { jogos } from "../data/jogos";
import LoginCard from "../components/LoginCard";
import RealRanking from "../components/RealRanking";
import { useMemo } from "react";



export default function Home() {

  const jogosAbertos = jogos.filter((jogo) => {

    const gameDate =
      new Date(jogo.matchDate);

    const now = new Date();

    const difference =
      gameDate.getTime() - now.getTime();

    const oneHour =
      1000 * 60 * 60;

    return difference > oneHour;

  });

  const jogosEncerrados = jogos.filter((jogo) => {

    const gameDate =
      new Date(jogo.matchDate);

    const now = new Date();

    const difference =
      gameDate.getTime() - now.getTime();

    const oneHour =
      1000 * 60 * 60;

    return difference <= oneHour;

  });

  const jogosAbertosPorFase =
    jogosAbertos.reduce((acc, jogo) => {

      if (!acc[jogo.phase]) {
        acc[jogo.phase] = [];
      }

      acc[jogo.phase].push(jogo);

      return acc;

    }, {} as Record<string, typeof jogos[number][]>);

  const jogosEncerradosPorFase =
    jogosEncerrados.reduce((acc, jogo) => {

      if (!acc[jogo.phase]) {
        acc[jogo.phase] = [];
      }

      acc[jogo.phase].push(jogo);

      return acc;

    }, {} as Record<string, typeof jogos[number][]>);

    const memeAleatorio = useMemo(() => {

      return memes[
        Math.floor(Math.random() * memes.length)
      ];
    
    }, []);

  return (

    <main className="min-h-screen bg-zinc-950 text-white pb-24">

      <Header />

      <section className="max-w-5xl mx-auto p-4 grid gap-5">

        <UserStats />

        <LoginCard />

        {/* JOGOS ABERTOS */}
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">

          <div className="flex items-center justify-between mb-5">

            <h2 className="text-2xl font-bold">
              ⚽ Próximos Jogos
            </h2>

            <span className="text-zinc-400 text-sm">
              Aposte antes de 1h
            </span>

          </div>

          <div className="space-y-4">

            {Object.entries(jogosAbertosPorFase).map(
              ([fase, jogosDaFase]) => (

                <div key={fase} className="mb-8">

                  <h3 className="text-xl font-black mb-4 text-green-400">
                    {fase}
                  </h3>

                  <div className="space-y-4">

                    {jogosDaFase.map((jogo) => (

                      <MatchCard
                        key={`${jogo.teamA}-${jogo.teamB}`}
                        teamA={jogo.teamA}
                        teamB={jogo.teamB}
                        emojiA={jogo.emojiA}
                        emojiB={jogo.emojiB}
                        resultadoA={jogo.resultadoA}
                        resultadoB={jogo.resultadoB}
                        matchDate={jogo.matchDate}
                      />

                    ))}

                  </div>

                </div>

            ))}

          </div>

        </div>

        {/* HISTÓRICO */}
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">

          <h2 className="text-2xl font-bold mb-5">
            📜 Jogos Encerrados
          </h2>

          {Object.entries(jogosEncerradosPorFase).map(
            ([fase, jogosDaFase]) => (

              <div key={fase} className="mb-6">

                <h3 className="text-lg font-black mb-3 text-red-400">
                  {fase}
                </h3>

                <div className="space-y-3">

                  {jogosDaFase.map((jogo) => (

                    <div
                      key={`${jogo.teamA}-${jogo.teamB}`}
                      className="bg-zinc-800 rounded-2xl p-4 flex justify-between items-center"
                    >

                      <div>

                        <p className="font-bold">
                          {jogo.emojiA} {jogo.teamA}
                          {" x "}
                          {jogo.emojiB} {jogo.teamB}
                        </p>

                        <p className="text-zinc-400 text-sm">
                          🔒 Encerrado
                        </p>

                      </div>

                      <p className="font-black text-xl">
                        {jogo.resultadoA} x {jogo.resultadoB}
                      </p>

                    </div>

                  ))}

                </div>

              </div>

          ))}

        </div>

        <RealRanking />

        <MemeCard
  mensagem={memeAleatorio}
/>

        <BetTable />

      </section>

    </main>

  );

}