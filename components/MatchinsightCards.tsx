"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

type UserDistance = {
  username: string;
  distance: number;
  exactHit: number;
  palpite: string;
};

type MatchAnalytics = {
  match: string;
  groupId: string;
  totalBets: number;
  resultadoA: number;
  resultadoB: number;
  realWinner: string;
  homePercent: number;
  drawPercent: number;
  awayPercent: number;
  exactScoreHits: number;
  surpriseIndex: number;
  allUserDistances: UserDistance[];
  updatedAt: { toMillis?: () => number } | string | Date;
};

export default function MatchInsightCards() {
  const [matchAnalytics, setMatchAnalytics] = useState<MatchAnalytics[]>([]);
  const [prophetData, setProphetData] = useState<{
    entry: [string, { exactHits: number; totalDistance: number; games: number }] | undefined;
    last5: MatchAnalytics[];
  }>({ entry: undefined, last5: [] });

  useEffect(() => {
    async function carregar() {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const currentGroupId = userSnap.data().activeGroupId;

      const analyticsSnapshot = await getDocs(
        query(collection(db, "analytics_matches"), where("groupId", "==", currentGroupId))
      );

      const analyticsData = analyticsSnapshot.docs.map((d) => d.data() as MatchAnalytics);
      setMatchAnalytics(analyticsData);

      // ── Profeta das Últimas 5 Rodadas ──
      const getTs = (u: MatchAnalytics["updatedAt"]) =>
        typeof u === "object" && u !== null && "toMillis" in u && u.toMillis
          ? u.toMillis()
          : new Date(u as string | Date).getTime();

      const last5 = [...analyticsData]
        .filter((m) => m.updatedAt && m.allUserDistances?.length)
        .sort((a, b) => getTs(b.updatedAt) - getTs(a.updatedAt))
        .slice(0, 5);

      const scores: Record<string, { exactHits: number; totalDistance: number; games: number }> = {};

      last5.forEach((match) => {
        (match.allUserDistances ?? []).forEach((entry) => {
          if (!scores[entry.username]) {
            scores[entry.username] = { exactHits: 0, totalDistance: 0, games: 0 };
          }
          scores[entry.username].exactHits += entry.exactHit ?? 0;
          scores[entry.username].totalDistance += entry.distance;
          scores[entry.username].games += 1;
        });
      });

      const prophetEntry = Object.entries(scores)
        .filter(([, s]) => s.games >= 1)
        .sort(([, a], [, b]) => {
          if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
          return a.totalDistance - b.totalDistance;
        })[0] as [string, { exactHits: number; totalDistance: number; games: number }] | undefined;

      setProphetData({ entry: prophetEntry, last5 });
    }

    carregar();
  }, []);

  const biggestZebra = [...matchAnalytics].sort((a, b) => b.surpriseIndex - a.surpriseIndex)[0];
  const mostPredictable = [...matchAnalytics].sort((a, b) => a.surpriseIndex - b.surpriseIndex)[0];
  const impossibleScore = [...matchAnalytics].sort((a, b) => a.exactScoreHits - b.exactScoreHits)[0];

  if (matchAnalytics.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4">

      {/* Maior Zebra */}
      {biggestZebra && (
        <div className="bg-gradient-to-br from-red-950 to-zinc-900 border border-red-700 rounded-3xl p-5">
          <h3 className="text-xl font-black mb-1">🐴 Maior Zebra do Torneio</h3>
          <p className="text-zinc-400 text-xs mb-3">O jogo que mais surpreendeu — a maioria errou feio</p>
          <p className="font-black text-lg">{biggestZebra.match}</p>
          <p className="text-zinc-400 text-sm mt-1">Resultado: {biggestZebra.resultadoA} x {biggestZebra.resultadoB}</p>
          <p className="text-4xl font-black text-red-400 mt-3">{biggestZebra.surpriseIndex}%</p>
          <p className="text-zinc-400 text-sm mt-1">
            dos palpiteiros erraram o <span className="text-red-400 font-black">vencedor</span>
          </p>
          <div className="flex gap-2 mt-3 text-xs text-zinc-400">
            <span>🏠 {biggestZebra.homePercent}%</span>
            <span>🤝 {biggestZebra.drawPercent}%</span>
            <span>✈️ {biggestZebra.awayPercent}%</span>
          </div>
        </div>
      )}

      {/* Jogo Mais Previsível */}
      {mostPredictable && (
        <div className="bg-gradient-to-br from-green-950 to-zinc-900 border border-green-700 rounded-3xl p-5">
          <h3 className="text-xl font-black mb-1">🎯 Jogo Mais Previsível</h3>
          <p className="text-zinc-400 text-xs mb-3">Todo mundo sabia o que ia acontecer — e aconteceu</p>
          <p className="font-black text-lg">{mostPredictable.match}</p>
          <p className="text-zinc-400 text-sm mt-1">Resultado: {mostPredictable.resultadoA} x {mostPredictable.resultadoB}</p>
          <p className="text-4xl font-black text-green-400 mt-3">{100 - mostPredictable.surpriseIndex}%</p>
          <p className="text-zinc-400 text-sm mt-1">
            dos palpiteiros acertaram o <span className="text-green-400 font-black">vencedor</span>{" "}
            (não o placar exato)
          </p>
          <div className="flex gap-2 mt-3 text-xs text-zinc-400">
            <span>🏠 {mostPredictable.homePercent}%</span>
            <span>🤝 {mostPredictable.drawPercent}%</span>
            <span>✈️ {mostPredictable.awayPercent}%</span>
          </div>
        </div>
      )}

      {/* Placar Blindado */}
      {impossibleScore && (
        <div className="bg-gradient-to-br from-yellow-950 to-zinc-900 border border-yellow-700 rounded-3xl p-5">
          <h3 className="text-xl font-black mb-1">🔒 Placar Blindado</h3>
          <p className="text-zinc-400 text-xs mb-3">O jogo onde quase ninguém acertou o placar exato</p>
          <p className="font-black text-lg">{impossibleScore.match}</p>
          <p className="text-zinc-400 text-sm mt-1">Resultado: {impossibleScore.resultadoA} x {impossibleScore.resultadoB}</p>
          <p className="text-4xl font-black text-yellow-400 mt-3">
            {impossibleScore.exactScoreHits === 0 ? "Ninguém" : impossibleScore.exactScoreHits}
          </p>
          <p className="text-zinc-400 text-sm mt-1">
            {impossibleScore.exactScoreHits === 0
              ? "acertou o placar exato 😤"
              : `acertou${impossibleScore.exactScoreHits === 1 ? "" : "m"} o placar exato`}
          </p>
        </div>
      )}

      {/* Profeta das Últimas 5 Rodadas */}
      {prophetData.entry && (
        <div className="bg-gradient-to-br from-purple-950 to-zinc-900 border border-purple-700 rounded-3xl p-5">
          <h3 className="text-xl font-black mb-1">🔭 Profeta das Últimas 5 Rodadas</h3>
          <p className="text-zinc-400 text-xs mb-3">
            Quem mais se aproximou dos resultados nos últimos 5 jogos encerrados
          </p>
          <p className="text-2xl font-black text-white">{prophetData.entry[0]}</p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <div className="bg-purple-900/50 rounded-2xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-purple-300">{prophetData.entry[1].exactHits}</p>
              <p className="text-xs text-zinc-400">placares exatos</p>
            </div>
            <div className="bg-purple-900/50 rounded-2xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-purple-300">{prophetData.entry[1].totalDistance}</p>
              <p className="text-xs text-zinc-400">gols de distância total</p>
            </div>
            <div className="bg-purple-900/50 rounded-2xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-purple-300">{prophetData.entry[1].games}</p>
              <p className="text-xs text-zinc-400">jogos avaliados</p>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Jogos considerados</p>
            {prophetData.last5.map((m) => {
              const userEntry = (m.allUserDistances ?? []).find(
                (e) => e.username === prophetData.entry![0]
              );
              return (
                <div key={m.match} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400 truncate max-w-[60%]">{m.match}</span>
                  <span className="text-zinc-300 font-bold">
                    {userEntry
                      ? userEntry.distance === 0
                        ? "🎯 Exato"
                        : `±${userEntry.distance} gol${userEntry.distance > 1 ? "s" : ""}`
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}