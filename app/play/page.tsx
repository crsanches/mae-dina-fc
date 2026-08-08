"use client";
// arquivo com palpites dos usuarios
import Link from "next/link";
import MatchCard from "../../components/MatchCard";

import BetProgress from "../../components/BetProgress";


import {
FaseCopa,
obterPesoDaFase
} from "../../lib/copas";

import { useTorneioSelecionado, TORNEIOS_INFO } from "../../lib/useTorneioSelecionado";

import {
useEffect,
useState
} from "react";

import { db } from "../../lib/firebase";

import {
collection,
onSnapshot,
orderBy,
query,
where
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

torneioId: string; 
};

// =========================
// FASES POR TORNEIO
// Cada torneio ativo pode ter uma estrutura de fases diferente.
// Copa do Brasil não tem fase de grupos nem "Segunda Fase"/"3º Lugar" —
// entra direto nas oitavas. Se um dia a Copa 2026 voltar a ficar ativa,
// ela usa a entrada correspondente abaixo.
// =========================

import { getConfigTorneio } from "../../lib/torneios";

export default function PlayPage() {

const [games, setGames] =
useState<Game[]>([]);

const {
  torneioSelecionado,
  torneiosDisponiveis,
  selecionarTorneio,
  loading: loadingTorneio,
} = useTorneioSelecionado();

const configTorneio = getConfigTorneio(torneioSelecionado);

const [tipoVisualizacao, setTipoVisualizacao] =
useState<"grupos" | "matamata">(
"matamata"
);

const [grupoSelecionado, setGrupoSelecionado] =
useState("A");

const [
faseMataMataSelecionada,
setFaseMataMataSelecionada
] = useState<FaseCopa>("Oitavas");



useEffect(() => {

  if (!torneioSelecionado) return;

  // reseta a fase selecionada se ela não existir no torneio escolhido
  const config = getConfigTorneio(torneioSelecionado);
  if (!config.temGrupos) {
    setTipoVisualizacao("matamata");
  }
  if (!config.fasesMataMata.some((f) => f.id === faseMataMataSelecionada)) {
    setFaseMataMataSelecionada(config.fasesMataMata[0]?.id || "Oitavas");
  }

  const q = query(
    collection(db, "games"),
    where("torneioId", "==", torneioSelecionado),
    orderBy("matchDate", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const loadedGames: Game[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      loadedGames.push({
        id: doc.id,
        teamA: data.teamA,
        teamB: data.teamB,
        emojiA: data.emojiA,
        emojiB: data.emojiB,
        resultadoA: data.resultadoA,
        resultadoB: data.resultadoB,
        matchDate: data.matchDate,
        grupo: data.grupo,
        fase: data.fase || "Grupos",
        pesoFase: obterPesoDaFase(data.fase || "Grupos"),
        torneioId: data.torneioId,
      });
    });
    setGames(loadedGames);
  });

  return () => unsubscribe();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [torneioSelecionado]);

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


if (loadingTorneio) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 flex items-center justify-center">
      <p className="text-zinc-500">Carregando...</p>
    </main>
  );
}

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

 {/* mostrar torneios disponiveis */}
    {torneiosDisponiveis.length > 1 && (
  <div className="flex gap-2 mb-4">
    {torneiosDisponiveis.map((id) => (
      <button
        key={id}
        onClick={() => selecionarTorneio(id)}
        className={
          torneioSelecionado === id
            ? "bg-yellow-500 text-black px-4 py-2 rounded-xl font-black"
            : "bg-zinc-800 px-4 py-2 rounded-xl"
        }
      >
        {TORNEIOS_INFO[id]?.emoji} {TORNEIOS_INFO[id]?.nome || id}
      </button>
    ))}
  </div>
)}



    {/* MENU PROGRESSOL */}

      <BetProgress
      totalJogos={games.length}
     />



    {/* MENU PRINCIPAL — só mostra o toggle Grupos/Mata-mata se o torneio tiver fase de grupos */}

    {configTorneio.temGrupos && (
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
    )}

    {/* SUBMENU GRUPOS */}

    {configTorneio.temGrupos && tipoVisualizacao === "grupos" && (

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

    {/* SUBMENU MATA-MATA — só as fases que existem no torneio ativo */}

    {(!configTorneio.temGrupos || tipoVisualizacao === "matamata") && (

      <div className="flex flex-wrap gap-2 mb-6">

        {configTorneio.fasesMataMata.map((fase) => (

          <button
            key={fase.id}
            onClick={() =>
              setFaseMataMataSelecionada(
                fase.id
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

          torneioId={game.torneioId}

          
        />

      ))}

    </div>

  </div>

</main>

);

}