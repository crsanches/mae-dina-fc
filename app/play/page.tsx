"use client";
// arquivo com palpites dos usuarios
import Link from "next/link";
import MatchCard from "../../components/MatchCard";

import BetProgress from "../../components/BetProgress";


import {
FaseCopa,
obterPesoDaFase
} from "../../lib/copas";

import {
useEffect,
useState
} from "react";

import { db } from "../../lib/firebase";

import {
collection,
onSnapshot,
orderBy,
query
} from "firebase/firestore";

type Game = {
id: string;

teamA: string;
teamB: string;

emojiA: string;
emojiB: string;

resultadoA?: number;
resultadoB?: number;

matchDate: string;

grupo?: string;

fase?: FaseCopa;

pesoFase?: number;
};

export default function PlayPage() {

const [games, setGames] =
useState<Game[]>([]);

const [tipoVisualizacao, setTipoVisualizacao] =
useState<"grupos" | "matamata">(
"grupos"
);

const [grupoSelecionado, setGrupoSelecionado] =
useState("A");

const [
faseMataMataSelecionada,
setFaseMataMataSelecionada
] = useState<FaseCopa>("Fase32");

useEffect(() => {


const q = query(
  collection(db, "games"),
  orderBy("matchDate", "asc")
);

const unsubscribe =
  onSnapshot(q, (snapshot) => {

    const loadedGames: Game[] = [];

    snapshot.forEach((doc) => {

      const data =
        doc.data();

      loadedGames.push({

        id: doc.id,

        teamA:
          data.teamA,

        teamB:
          data.teamB,

        emojiA:
          data.emojiA,

        emojiB:
          data.emojiB,

        resultadoA:
          data.resultadoA,

        resultadoB:
          data.resultadoB,

        matchDate:
          data.matchDate,

        grupo:
          data.grupo,

        fase:
          data.fase || "Grupos",

        pesoFase:
          obterPesoDaFase(
            data.fase || "Grupos"
          )

      });

    });

    setGames(
      loadedGames
    );

  });

return () => unsubscribe();


}, []);

const grupos = [
"A","B","C","D","E","F",
"G","H","I","J","K","L"
];

const jogosFiltrados =
games.filter((game) => {


  if (
    tipoVisualizacao ===
    "grupos"
  ) {

    return (
      game.fase === "Grupos" &&
      game.grupo === grupoSelecionado
    );

  }

  return (
    game.fase ===
    faseMataMataSelecionada
  );

});



return (


<main className="min-h-screen bg-zinc-950 text-white p-4">

  <div className="max-w-3xl mx-auto">

    <div className="flex items-center justify-between mb-6">

      <h1 className="text-3xl font-black">
        🎯 Faça seus palpites
      </h1>

      <Link
        href="/"
        className="
          bg-zinc-800
          hover:bg-zinc-700
          transition
          px-4
          py-2
          rounded-xl
          font-bold
          text-sm
        "
      >
        ← Voltar ao menu
      </Link>

    </div>


    {/* MENU PROGRESSOL */}

      <BetProgress
      totalJogos={games.length}
     />



    {/* MENU PRINCIPAL */}

    <div className="flex gap-2 mb-6">

      <button
        onClick={() =>
          setTipoVisualizacao(
            "grupos"
          )
        }
        className={
          tipoVisualizacao === "grupos"

            ? "bg-yellow-500 text-black px-4 py-2 rounded-xl font-black"

            : "bg-zinc-800 px-4 py-2 rounded-xl"
        }
      >
        🌎 Grupos
      </button>

      <button
        onClick={() =>
          setTipoVisualizacao(
            "matamata"
          )
        }
        className={
          tipoVisualizacao === "matamata"

            ? "bg-yellow-500 text-black px-4 py-2 rounded-xl font-black"

            : "bg-zinc-800 px-4 py-2 rounded-xl"
        }
      >
        ⚔️ Mata-mata
      </button>

    </div>

    {/* SUBMENU GRUPOS */}

    {tipoVisualizacao === "grupos" && (

      <div className="flex flex-wrap gap-2 mb-6">

        {grupos.map((grupo) => (

          <button
            key={grupo}
            onClick={() =>
              setGrupoSelecionado(
                grupo
              )
            }
            className={
              grupoSelecionado === grupo

                ? "bg-green-500 text-black px-3 py-2 rounded-xl font-black"

                : "bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
            }
          >
            Grupo {grupo}
          </button>

        ))}

      </div>

    )}

    {/* SUBMENU MATA-MATA */}

    {tipoVisualizacao === "matamata" && (

      <div className="flex flex-wrap gap-2 mb-6">

        {[
          {
            id: "Fase32",
            label: "🚪 Segunda Fase"
          },
          {
            id: "Oitavas",
            label: "⚔️ Oitavas"
          },
          {
            id: "Quartas",
            label: "🏟️ Quartas"
          },
          {
            id: "Semi",
            label: "🔥 Semi"
          },
          {
            id: "Terceiro",
            label: "🥉 3º Lugar"
          },
          {
            id: "Final",
            label: "🏆 Final"
          }
        ].map((fase) => (

          <button
            key={fase.id}
            onClick={() =>
              setFaseMataMataSelecionada(
                fase.id as FaseCopa
              )
            }
            className={
              faseMataMataSelecionada === fase.id

                ? "bg-red-500 text-black px-3 py-2 rounded-xl font-black"

                : "bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
            }
          >
            {fase.label}
          </button>

        ))}

      </div>

    )}

    {/* JOGOS */}

    <div className="space-y-4">

      {games.length === 0 && (

        <div
          className="
            bg-zinc-900
            border
            border-zinc-800
            rounded-2xl
            p-6
            text-center
            text-zinc-400
          "
        >
          Nenhum jogo cadastrado 😥
        </div>

      )}

      {jogosFiltrados.length === 0 && games.length > 0 && (

        <div
          className="
            bg-zinc-900
            border
            border-zinc-800
            rounded-2xl
            p-6
            text-center
            text-zinc-400
          "
        >
          Nenhum jogo encontrado nesta fase.
        </div>

      )}

      {jogosFiltrados.map((game) => (

        <MatchCard
          key={game.id}

          teamA={game.teamA}
          teamB={game.teamB}

          emojiA={game.emojiA}
          emojiB={game.emojiB}

          resultadoA={game.resultadoA}
          resultadoB={game.resultadoB}

          matchDate={game.matchDate}

          fase={game.fase}
          pesoFase={game.pesoFase}
        />

      ))}

    </div>

  </div>

</main>

);

}
