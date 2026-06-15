"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  collection,
  getDocs
} from "firebase/firestore";

import { db } from "../../../lib/firebase";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";

import { calculatePoints } from "../../../lib/calculatePoints";
import { FASES_COPA } from "../../../lib/copas";

type GroupStats = {
  id: string;
  name: string;
  users: number;
  bets: number;
  coverage: number;
};

type DashboardStats = {
  games: number;
  finishedGames: number;
  memes: number;
  groups: GroupStats[];
};

type Game = {
  id: string;
  teamA: string;
  teamB: string;
  match: string;
  fase: string;
  resultadoA?: number;
  resultadoB?: number;
};

type BetResult = {
  userName: string;
  golsA: string;
  golsB: string;
  points: number;
  acertouPlacar: boolean;
  groupId: string;
};

type League = {
  id: string;
  name: string;
};

export default function AdminDashboard() {

  const ADMIN_EMAILS = ["crsanches4@gmail.com"];

  const [stats, setStats] = useState<DashboardStats>({
    games: 0,
    finishedGames: 0,
    memes: 0,
    groups: []
  });

  const [games, setGames] = useState<Game[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [betResults, setBetResults] = useState<BetResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function loadStats() {
      const groupsSnap = await getDocs(collection(db, "groups"));

      const [gamesSnap, betsSnap, memesSnap] = await Promise.all([
        getDocs(collection(db, "games")),
        getDocs(collection(db, "bets")),
        getDocs(collection(db, "memes")),
      ]);

      const finishedGames = gamesSnap.docs.filter((doc) => {
        const data = doc.data();
        return data.resultadoA != null && data.resultadoB != null;
      }).length;

      const groupsStats = groupsSnap.docs.map((groupDoc) => {
        const groupId = groupDoc.id;
        const groupName = groupDoc.data().name;
        const groupBets = betsSnap.docs.filter(
          (bet) => bet.data().groupId === groupId
        );
        const uniqueUsers = new Set(groupBets.map((bet) => bet.data().uid));

        return {
          id: groupId,
          name: groupName,
          users: uniqueUsers.size,
          bets: groupBets.length,
          coverage: gamesSnap.size > 0
            ? Number((groupBets.length / gamesSnap.size).toFixed(1))
            : 0
        };
      }).sort((a, b) => a.name.localeCompare(b.name));

      const loadedGames: Game[] = gamesSnap.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            teamA: data.teamA,
            teamB: data.teamB,
            match: data.match || `${data.teamA} x ${data.teamB}`,
            fase: data.fase || "Grupos",
            resultadoA: data.resultadoA,
            resultadoB: data.resultadoB,
          };
        })
        .filter((g) => g.resultadoA != null && g.resultadoB != null)
        .sort((a, b) => a.match.localeCompare(b.match));

      const loadedLeagues: League[] = groupsSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || doc.id,
      })).sort((a, b) => a.name.localeCompare(b.name));

      setGames(loadedGames);
      setLeagues(loadedLeagues);

      setStats({
        games: gamesSnap.size,
        finishedGames,
        memes: memesSnap.size,
        groups: groupsStats
      });
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/";
        return;
      }

      if (!ADMIN_EMAILS.includes(user.email || "")) {
        alert("Acesso negado");
        window.location.href = "/";
        return;
      }

      loadStats();
    });

    return () => unsubscribe();
  }, []);

  async function pesquisarPalpites() {
    if (!selectedGame) return;

    setSearching(true);
    setBetResults([]);

    const game = games.find((g) => g.id === selectedGame);
    if (!game) return;

    const betsSnap = await getDocs(collection(db, "bets"));

    const resultados: BetResult[] = betsSnap.docs
      .filter((doc) => {
        const bet = doc.data();
        return (
          bet.match === game.match ||
          bet.match === `${game.teamA} x ${game.teamB}`
        );
      })
      .map((doc) => {
        const bet = doc.data();
        const points = calculatePoints({
          apostaA: Number(bet.golsA),
          apostaB: Number(bet.golsB),
          resultadoA: Number(game.resultadoA),
          resultadoB: Number(game.resultadoB),
        });

        return {
          userName: bet.userName || bet.nome || "?",
          golsA: bet.golsA,
          golsB: bet.golsB,
          points,
          acertouPlacar:
            Number(bet.golsA) === Number(game.resultadoA) &&
            Number(bet.golsB) === Number(game.resultadoB),
          groupId: bet.groupId || "",
        };
      })
      .sort((a, b) => b.points - a.points);

    setBetResults(resultados);
    setSearching(false);
  }

  const gameSelected = games.find((g) => g.id === selectedGame);

  // Filtra por liga selecionada
  const betResultsFiltrados = selectedLeague === "all"
    ? betResults
    : betResults.filter((b) => b.groupId === selectedLeague);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">

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

        {/* PESQUISA DE PALPITES */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 mb-10">
          <h2 className="text-2xl font-black mb-4">🔍 Pesquisar Palpites por Jogo</h2>

          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            {/* Seletor de jogo agrupado por fase */}
            <select
              value={selectedGame}
              onChange={(e) => {
                setSelectedGame(e.target.value);
                setBetResults([]);
              }}
              className="flex-1 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-white font-semibold"
            >
              <option value="">Selecione um jogo...</option>
              {FASES_COPA.map((fase) => {
                const jogosDaFase = games.filter((g) => g.fase === fase.id);
                if (jogosDaFase.length === 0) return null;
                return (
                  <optgroup key={fase.id} label={fase.nome}>
                    {jogosDaFase.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.match} ({game.resultadoA} x {game.resultadoB})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>

            <button
              onClick={pesquisarPalpites}
              disabled={!selectedGame || searching}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 transition text-black font-black rounded-xl px-6 py-3"
            >
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {/* Filtro por liga — aparece só após buscar */}
          {betResults.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedLeague("all")}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition ${
                  selectedLeague === "all"
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                Todas as ligas ({betResults.length})
              </button>
              {leagues.map((league) => {
                const count = betResults.filter((b) => b.groupId === league.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeague(league.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold transition ${
                      selectedLeague === league.id
                        ? "bg-yellow-400 text-black"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {league.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {betResultsFiltrados.length > 0 && gameSelected && (
            <div>
              <p className="text-zinc-400 text-sm mb-3">
                {betResultsFiltrados.length} palpite(s) — Resultado oficial:{" "}
                <span className="text-white font-black">
                  {gameSelected.resultadoA} x {gameSelected.resultadoB}
                </span>
              </p>

              <div className="space-y-2">
                {betResultsFiltrados.map((bet, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center rounded-xl px-4 py-3 border ${
                      bet.acertouPlacar
                        ? "bg-green-950 border-green-700"
                        : bet.points > 0
                        ? "bg-zinc-800 border-zinc-600"
                        : "bg-zinc-900 border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {bet.acertouPlacar ? "🎯" : bet.points > 0 ? "✅" : "❌"}
                      </span>
                      <span className="font-bold">{bet.userName}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-zinc-300 font-mono">
                        {bet.golsA} x {bet.golsB}
                      </span>
                      <span className={`font-black text-lg ${
                        bet.points >= 3 ? "text-green-400" :
                        bet.points > 0 ? "text-yellow-400" : "text-zinc-500"
                      }`}>
                        {bet.points} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searching && selectedGame && betResults.length === 0 && (
            <p className="text-zinc-500 text-sm">Nenhum palpite encontrado para este jogo.</p>
          )}
        </div>

        {/* MENU ADMIN */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/admin"
            className="bg-blue-950 hover:bg-blue-900 transition border border-blue-700 rounded-3xl p-8"
          >
            <div className="text-5xl mb-5">⚽</div>
            <h2 className="text-3xl font-black mb-3">Jogos</h2>
            <p className="text-zinc-300">Criar, editar e organizar jogos por grupo.</p>
          </Link>

          <Link
            href="/admin/results"
            className="bg-green-950 hover:bg-green-900 transition border border-green-700 rounded-3xl p-8"
          >
            <div className="text-5xl mb-5">🏆</div>
            <h2 className="text-3xl font-black mb-3">Resultados Oficiais</h2>
            <p className="text-zinc-300">Lance placares e atualize o ranking.</p>
          </Link>

          <Link
            href="/admin/memes"
            className="bg-purple-950 hover:bg-purple-900 transition border border-purple-700 rounded-3xl p-8"
          >
            <div className="text-5xl mb-5">🤡</div>
            <h2 className="text-3xl font-black mb-3">Central de Memes</h2>
            <p className="text-zinc-300">Gerencie memes globais e personalizados.</p>
          </Link>

          <Link
            href="/admin/estatisticas"
            className="bg-yellow-950 hover:bg-yellow-900 transition border border-yellow-700 rounded-3xl p-8"
          >
            <div className="text-5xl mb-5">📈</div>
            <h2 className="text-3xl font-black mb-3">Estatísticas</h2>
            <p className="text-zinc-300">Métricas matemáticas, desempenho, precisão e análise do bolão.</p>
          </Link>
        </div>

      </div>
    </main>
  );
} 