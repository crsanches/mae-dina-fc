"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import Link from "next/link";
import { buildMatchAnalytics } from "../../../lib/buildMatchAnalytics";
import { getTorneioAtivo } from "../../../lib/getTorneioAtivo";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  getDoc
} from "firebase/firestore";
import { calculatePoints } from "../../../lib/calculatePoints";

type Game = {
  id: string;
  teamA: string;
  teamB: string;
  emojiA: string;
  emojiB: string;
  fase: string;
  grupo?: string;
  matchDate: string;
  resultadoA?: number;
  resultadoB?: number;
};

export default function AdminResultsPage() {

  const [games, setGames] = useState<Game[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [groupId, setGroupId] = useState<string | null>(null);

  const grupos = Array.from(
    new Set(games.map((g) => g.grupo || "Sem Grupo"))
  ).sort((a, b) => a.localeCompare(b));

  const activeGroup = selectedGroup || grupos[0] || "";

  const jogosFiltrados = activeGroup
    ? games.filter((g) => (g.grupo || "Sem Grupo") === activeGroup)
    : [];

  async function carregarGroupId() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (!userSnap.exists()) return;
    setGroupId(userSnap.data().activeGroupId ?? null);
  }

  async function carregarJogos() {

    const torneioId = await getTorneioAtivo();
  
    const snapshot =
      await getDocs(
        query(
          collection(db, "games"),
          where("torneioId", "==", torneioId)
        )
      );
  
    const loadedGames: Game[] = [];
  
    snapshot.forEach((docItem) => {
      const data = docItem.data();
      loadedGames.push({
        id: docItem.id,
        teamA: data.teamA,
        teamB: data.teamB,
        emojiA: data.emojiA,
        emojiB: data.emojiB,
        fase: data.fase || data.phase,
        grupo: data.grupo,
        matchDate: data.matchDate
      });
    });
  
    setGames(loadedGames);
  }

  async function reprocessarTodos() {
    if (!groupId) {
      alert("Grupo não identificado. Tente recarregar a página 😥");
      return;
    }
  
    const jogosComResultado = games.filter(
      (g) => g.resultadoA != null && g.resultadoB != null
    );
  
    if (jogosComResultado.length === 0) {
      alert("Nenhum jogo com resultado encontrado.");
      return;
    }
  
    const confirmou = confirm(
      `Reprocessar ${jogosComResultado.length} jogos? Isso vai atualizar todos os analytics e pontos.`
    );
  
    if (!confirmou) return;
  
    let sucesso = 0;
    let falha = 0;

    const torneioId = await getTorneioAtivo();

    for (const game of jogosComResultado) {
      try {
        const match = `${game.teamA} x ${game.teamB}`;
        const resultadoA = game.resultadoA as number;
        const resultadoB = game.resultadoB as number;
  
        const betsQuery = query(
          collection(db, "bets"),
          where("match", "==", match),
          where("groupId", "==", groupId)
        );
  
        const betsSnapshot = await getDocs(betsQuery);
  
        for (const betDoc of betsSnapshot.docs) {
          const bet = betDoc.data();
          const points = calculatePoints({
            apostaA: Number(bet.golsA),
            apostaB: Number(bet.golsB),
            resultadoA,
            resultadoB,
          });
          await updateDoc(doc(db, "bets", betDoc.id), { points });
        }
  
       
        await buildMatchAnalytics(match, resultadoA, resultadoB, groupId, torneioId);
  
        sucesso++;
      } catch (err) {
        falha++;
      }
    }
  
    alert(`Reprocessamento concluído!\n✅ ${sucesso} jogos atualizados\n❌ ${falha} erros`);
    carregarJogos();
  }

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await carregarGroupId();
      await carregarJogos();
    }, 0);
  
    return () => clearTimeout(timeout);
  }, []);

  async function salvarResultado(
    gameId: string,
    resultadoA: number,
    resultadoB: number
  ) {
  
    if (!groupId) {
      alert("Grupo não identificado. Tente recarregar a página 😥");
      console.error("❌ groupId ausente");
      return;
    }
  
  
    await updateDoc(doc(db, "games", gameId), { resultadoA, resultadoB });
    console.log("✅ game atualizado");
  
    const game = games.find((g) => g.id === gameId);
    if (!game) {
      alert("Jogo não encontrado 😥");
      console.error("❌ game não encontrado no estado");
      return;
    }
  
    const match = `${game.teamA} x ${game.teamB}`;
  
    const betsQuery = query(
      collection(db, "bets"),
      where("match", "==", match),
      where("groupId", "==", groupId)
    );
  
    const betsSnapshot = await getDocs(betsQuery);
  
    for (const betDoc of betsSnapshot.docs) {
      const bet = betDoc.data();
      const points = calculatePoints({
        apostaA: Number(bet.golsA),
        apostaB: Number(bet.golsB),
        resultadoA,
        resultadoB,
      });
      await updateDoc(doc(db, "bets", betDoc.id), { points });
    }
  
  
   const torneioId = await getTorneioAtivo();
    await buildMatchAnalytics(match, resultadoA, resultadoB, groupId, torneioId);
  
  
    alert("Resultado salvo e apostas atualizadas 😎");
    carregarJogos();





   

  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="max-w-2xl mx-auto">

        {/* NAV */}
        <div className="mb-4 flex gap-2">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2 rounded-xl font-bold text-sm"
          >
            ← Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 bg-blue-900 hover:bg-blue-800 transition px-4 py-2 rounded-xl font-bold text-sm"
          >
            ⚽ Bolão
          </Link>
        </div>

        <h1 className="text-2xl font-black mb-4">
          🏆 Resultados Oficiais
        </h1>

    

        {/* BOTÃO REPROCESSAR */}
        <button
          onClick={reprocessarTodos}
          disabled={!groupId}
          className="mb-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-white font-black rounded-xl px-4 py-3 text-sm"
        >
          🔄 Reprocessar todos os resultados
        </  button>

        {/* AVISO SE groupId NAO CARREGOU */}
        {!groupId && (
          <p className="text-yellow-400 text-sm mb-4 font-bold">
            ⚠️ Carregando grupo do administrador...
          </p>
        )}

        {/* SELETOR DE GRUPO */}
        <div className="mb-4">
          <p className="text-zinc-400 text-xs mb-2 font-semibold uppercase tracking-wide">
            Selecionar grupo
          </p>
          <div className="flex flex-wrap gap-2">
            {grupos.map((grupo) => (
              <button
                key={grupo}
                onClick={() => setSelectedGroup(grupo)}
                className={`
                  px-3 py-1.5 rounded-xl text-sm font-bold transition
                  ${activeGroup === grupo
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }
                `}
              >
                {grupo === "Sem Grupo" ? grupo : `Grupo ${grupo}`}
              </button>
            ))}
          </div>
        </div>

        {/* JOGOS DO GRUPO SELECIONADO */}
        {activeGroup && (
          <div>
            <h2 className="text-base font-black text-yellow-400 mb-3">
              {activeGroup === "Sem Grupo"
                ? "Sem Grupo"
                : `Grupo ${activeGroup}`}
            </h2>

            <div className="space-y-2">
              {jogosFiltrados.map((game) => (
                <GameResultCard
                  key={game.id}
                  game={game}
                  onSave={salvarResultado}
                />
              ))}
            </div>
          </div>
        )}

        {!selectedGroup && games.length === 0 && (
          <p className="text-zinc-500 text-sm">
            Carregando jogos...
          </p>
        )}

      </div>
    </main>
  );
}

type CardProps = {
  game: Game;
  onSave: (
    gameId: string,
    resultadoA: number,
    resultadoB: number
  ) => void;
};

function GameResultCard({ game, onSave }: CardProps) {

  const [resultadoA, setResultadoA] = useState(
    game.resultadoA?.toString() || ""
  );
  const [resultadoB, setResultadoB] = useState(
    game.resultadoB?.toString() || ""
  );

  const temResultado =
    game.resultadoA != null && game.resultadoB != null;

  return (
    <div className={`
      border rounded-2xl p-3
      ${temResultado
        ? "bg-zinc-900 border-green-800"
        : "bg-zinc-900 border-zinc-800"
      }
    `}>

      {/* TIME E DATA */}
      <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2 text-sm font-black leading-tight">

{game.emojiA?.startsWith("/") ? (
  <img
    src={game.emojiA}
    alt={game.teamA}
    className="w-6 h-6 object-contain"
  />
) : (
  <span>{game.emojiA}</span>
)}

<span>{game.teamA}</span>

<span className="text-zinc-500 font-normal mx-1">
  x
</span>

{game.emojiB?.startsWith("/") ? (
  <img
    src={game.emojiB}
    alt={game.teamB}
    className="w-6 h-6 object-contain"
  />
) : (
  <span>{game.emojiB}</span>
)}

<span>{game.teamB}</span>

</div>
        {temResultado && (
          <span className="text-green-400 text-xs font-bold ml-2 shrink-0">
            ✅
          </span>
        )}
      </div>

      {/* INPUTS */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={resultadoA}
          onChange={(e) => setResultadoA(e.target.value)}
          className="w-14 bg-zinc-800 rounded-lg p-2 text-center text-base font-black"
        />
        <span className="text-zinc-500 font-bold text-sm">x</span>
        <input
          type="number"
          value={resultadoB}
          onChange={(e) => setResultadoB(e.target.value)}
          className="w-14 bg-zinc-800 rounded-lg p-2 text-center text-base font-black"
        />
        <button
          onClick={() =>
            onSave(game.id, Number(resultadoA), Number(resultadoB))
          }
          className="ml-auto bg-green-500 hover:bg-green-600 transition text-black font-black rounded-xl px-4 py-2 text-sm"
        >
          Salvar
        </button>
      </div>

    </div>
  );
}