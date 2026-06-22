"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { collection, doc, getDoc, query, where } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";

// ────────────────────────────────────────────────────────────
// Tipos de dados (espelham os documentos de analytics_matches)
// ────────────────────────────────────────────────────────────

type UserDistance = {
  username: string;
  distance: number;
  exactHit: number;
  palpite: string;
  points?: number;
  drawHit?: number;
  winnerHit?: number;
};

type _VisionaryEntry = string | { username: string; palpite?: string };

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
  avgHomeGoals?: number;
  avgAwayGoals?: number;
  visionaryUsers?: _VisionaryEntry[];
  matchDate?: string;
  fase?: string;
  grupo?: string;
};

type AggUser = { username: string; exactHits: number; totalDistance: number; games: number };

type StreakInfo = { username: string; length: number; hot: boolean };

type RankingFrame = {
  ranking: { username: string; position: number }[];
};

type LeagueHistory = {
  frames: RankingFrame[];
};

// ────────────────────────────────────────────────────────────
// Paleta de cores por tipo de card
// ────────────────────────────────────────────────────────────

type Accent =
  | "red"
  | "green"
  | "yellow"
  | "purple"
  | "violet"
  | "rose"
  | "amber"
  | "sky"
  | "fuchsia"
  | "indigo"
  | "cyan"
  | "orange"
  | "blue"
  | "teal"
  | "pink"
  | "lime";

const ACCENTS: Record<Accent, { card: string; textBright: string }> = {
  red:     { card: "from-red-950 to-zinc-900 border border-red-700",     textBright: "text-red-400"     },
  green:   { card: "from-green-950 to-zinc-900 border border-green-700", textBright: "text-green-400"   },
  yellow:  { card: "from-yellow-950 to-zinc-900 border border-yellow-700", textBright: "text-yellow-400" },
  purple:  { card: "from-purple-950 to-zinc-900 border border-purple-700", textBright: "text-purple-400" },
  violet:  { card: "from-violet-950 to-zinc-900 border border-violet-700", textBright: "text-violet-400" },
  rose:    { card: "from-rose-950 to-zinc-900 border border-rose-700",   textBright: "text-rose-400"    },
  amber:   { card: "from-amber-950 to-zinc-900 border border-amber-700", textBright: "text-amber-400"   },
  sky:     { card: "from-sky-950 to-zinc-900 border border-sky-700",     textBright: "text-sky-400"     },
  fuchsia: { card: "from-fuchsia-950 to-zinc-900 border border-fuchsia-700", textBright: "text-fuchsia-400" },
  indigo:  { card: "from-indigo-950 to-zinc-900 border border-indigo-700", textBright: "text-indigo-400" },
  cyan:    { card: "from-cyan-950 to-zinc-900 border border-cyan-700",   textBright: "text-cyan-400"    },
  orange:  { card: "from-orange-950 to-zinc-900 border border-orange-700", textBright: "text-orange-400" },
  blue:    { card: "from-blue-950 to-zinc-900 border border-blue-700",   textBright: "text-blue-400"    },
  teal:    { card: "from-teal-950 to-zinc-900 border border-teal-700",   textBright: "text-teal-400"    },
  pink:    { card: "from-pink-950 to-zinc-900 border border-pink-700",   textBright: "text-pink-400"    },
  lime:    { card: "from-lime-950 to-zinc-900 border border-lime-700",   textBright: "text-lime-400"    },
};

// ────────────────────────────────────────────────────────────
// Tipos dos cards de insight
// ────────────────────────────────────────────────────────────

type BaseCard = { accent: Accent; emoji: string; title: string; subtitle: string };

type _ZebraCard       = BaseCard & { type: "zebra";          match: MatchAnalytics };
type _PredictableCard = BaseCard & { type: "predictable";    match: MatchAnalytics };
type _BlindadoCard    = BaseCard & { type: "blindado";       match: MatchAnalytics };
type ProphetCard      = BaseCard & { type: "prophet";        user: AggUser; last5: MatchAnalytics[] };
type _VisionariosCard = BaseCard & { type: "visionarios";   match: MatchAnalytics; names: string[] };
type _CoracaoPartidoCard = BaseCard & { type: "coracaoPartido"; match: MatchAnalytics; entry: UserDistance };
type _VotoDeCabraCard = BaseCard & { type: "votoDeCabra";   match: MatchAnalytics; majority: { category: string; percent: number } };
type _FaroDeGolCard   = BaseCard & { type: "faroDeGol";     match: MatchAnalytics; predictedTotal: number; actualTotal: number; diff: number };
type _ManadaErradaCard = BaseCard & { type: "manadaErrada"; rate: number; wrongCount: number; total: number };
type RankingGeralCard = BaseCard & { type: "rankingGeral";  ranking: AggUser[] };
type SniperCard       = BaseCard & { type: "sniper";        user: AggUser; rate: number };
type StreakCard        = BaseCard & { type: "peQuente" | "peFrio"; streak: StreakInfo };
type _SubestimadoCard = BaseCard & { type: "subestimado";   team: string; avgBacking: number; wins: number };
type _SobrestimadoCard = BaseCard & { type: "sobrestimado"; team: string; avgBacking: number; losses: number };
type _MaisApostadoCard = BaseCard & { type: "maisApostado"; match: MatchAnalytics };
type HotLast5Card     = BaseCard & { type: "hotLast5";      ranking: { username: string; points: number; exacts: number }[] };
type ColdLast5Card    = BaseCard & { type: "coldLast5";     ranking: { username: string; points: number; exacts: number }[] };
type DrawKingsCard    = BaseCard & { type: "drawKings";     ranking: { username: string; draws: number }[] };
type ClimbersCard     = BaseCard & { type: "climbers";      ranking: { username: string; change: number }[] };
type FallersCard      = BaseCard & { type: "fallers";       ranking: { username: string; change: number }[] };

type InsightCard =
  | _ZebraCard
  | _PredictableCard
  | _BlindadoCard
  | ProphetCard
  | _VisionariosCard
  | _CoracaoPartidoCard
  | _VotoDeCabraCard
  | _FaroDeGolCard
  | _ManadaErradaCard
  | RankingGeralCard
  | SniperCard
  | StreakCard
  | _SubestimadoCard
  | _SobrestimadoCard
  | _MaisApostadoCard
  | HotLast5Card
  | ColdLast5Card
  | DrawKingsCard
  | ClimbersCard
  | FallersCard;

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function getTs(u: MatchAnalytics["updatedAt"]): number {
  if (typeof u === "object" && u !== null && "toMillis" in u && typeof u.toMillis === "function") {
    return u.toMillis();
  }
  return new Date(u as string | Date).getTime();
}

function majorityOf(m: MatchAnalytics): { category: string; percent: number } {
  const entries: [string, number][] = [
    ["home", m.homePercent ?? 0],
    ["draw", m.drawPercent ?? 0],
    ["away", m.awayPercent ?? 0],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return { category: entries[0][0], percent: entries[0][1] };
}

function aggregateUsers(matches: MatchAnalytics[]): AggUser[] {
  const map: Record<string, AggUser> = {};
  matches.forEach((m) => {
    (m.allUserDistances ?? []).forEach((e) => {
      if (!map[e.username]) {
        map[e.username] = { username: e.username, exactHits: 0, totalDistance: 0, games: 0 };
      }
      map[e.username].exactHits += e.exactHit ?? 0;
      map[e.username].totalDistance += e.distance;
      map[e.username].games += 1;
    });
  });
  return Object.values(map);
}

function buildStreaks(matches: MatchAnalytics[]): StreakInfo[] {
  const sorted = [...matches]
    .filter((m) => m.updatedAt && m.allUserDistances?.length)
    .sort((a, b) => getTs(a.updatedAt) - getTs(b.updatedAt));

  const sequences: Record<string, boolean[]> = {};
  sorted.forEach((m) => {
    (m.allUserDistances ?? []).forEach((e) => {
      if (!sequences[e.username]) sequences[e.username] = [];
      sequences[e.username].push((e.exactHit ?? 0) === 1);
    });
  });

  const result: StreakInfo[] = [];
  Object.entries(sequences).forEach(([username, seq]) => {
    if (seq.length < 2) return;
    const last = seq[seq.length - 1];
    let length = 0;
    for (let i = seq.length - 1; i >= 0 && seq[i] === last; i--) length++;
    if (length >= 2) result.push({ username, length, hot: last });
  });
  return result;
}

// ────────────────────────────────────────────────────────────
// Builders ativos
// ────────────────────────────────────────────────────────────

function buildProphetCard(matches: MatchAnalytics[]): ProphetCard | null {
  const withDate = matches.filter((m) => m.updatedAt && m.allUserDistances?.length);
  if (!withDate.length) return null;

  const last5 = [...withDate].sort((a, b) => getTs(b.updatedAt) - getTs(a.updatedAt)).slice(0, 5);

  const scores: Record<string, AggUser> = {};
  last5.forEach((m) => {
    (m.allUserDistances ?? []).forEach((entry) => {
      if (!scores[entry.username]) {
        scores[entry.username] = { username: entry.username, exactHits: 0, totalDistance: 0, games: 0 };
      }
      scores[entry.username].exactHits += entry.exactHit ?? 0;
      scores[entry.username].totalDistance += entry.distance;
      scores[entry.username].games += 1;
    });
  });

  const ranked = Object.values(scores).sort((a, b) => {
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
    return a.totalDistance - b.totalDistance;
  });
  const top = ranked[0];
  if (!top) return null;

  return {
    type: "prophet",
    accent: "purple",
    emoji: "🔭",
    title: "Profeta das Últimas 5 Rodadas",
    subtitle: "Quem mais se aproximou dos resultados nos últimos 5 jogos encerrados",
    user: top,
    last5,
  };
}

function buildRankingGeralCard(matches: MatchAnalytics[]): RankingGeralCard | null {
  const agg = aggregateUsers(matches).filter((u) => u.games >= 1);
  if (!agg.length) return null;

  const ranking = [...agg]
    .sort((a, b) => {
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      return a.totalDistance / a.games - b.totalDistance / b.games;
    })
    .slice(0, 3);

  return {
    type: "rankingGeral",
    accent: "indigo",
    emoji: "🎯🎯🎯",
    title: "Mestres do Placar",
    subtitle: "Quem mais acertou placares exatos",
    ranking,
  };
}

function buildSniperCard(matches: MatchAnalytics[]): SniperCard | null {
  const agg = aggregateUsers(matches).filter((u) => u.games >= 3 && u.exactHits > 0);
  if (!agg.length) return null;

  const ranked = [...agg].sort((a, b) => b.exactHits / b.games - a.exactHits / a.games || b.games - a.games);
  const top = ranked[0];

  return {
    type: "sniper",
    accent: "cyan",
    emoji: "🏹",
    title: "Sniper do Bolão",
    subtitle: "Maior taxa de placares exatos entre quem já jogou pelo menos 3 partidas",
    user: top,
    rate: top.exactHits / top.games,
  };
}

function buildHotLast5Card(matches: MatchAnalytics[]): HotLast5Card | null {
  const last5 = [...matches]
    .filter((m): m is MatchAnalytics & { matchDate: string } => Boolean(m.matchDate))
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
    .slice(-5);

  const stats: Record<string, { points: number; exacts: number }> = {};

  last5.forEach((match) => {
    (match.allUserDistances || []).forEach((user) => {
      if (!stats[user.username]) stats[user.username] = { points: 0, exacts: 0 };
      stats[user.username].points += Number(user.points || 0);
      stats[user.username].exacts += Number(user.exactHit || 0);
    });
  });

  const ranking = Object.entries(stats)
    .map(([username, s]) => ({ username, points: s.points, exacts: s.exacts }))
    .sort((a, b) => (b.points !== a.points ? b.points - a.points : b.exacts - a.exacts))
    .slice(0, 3);

  if (!ranking.length) return null;

  return {
    type: "hotLast5",
    accent: "orange",
    emoji: "🔥",
    title: "Reis das Últimas 5 Rodadas",
    subtitle: "Quem mais pontuou recentemente",
    ranking,
  };
}

function buildColdLast5Card(matches: MatchAnalytics[]): ColdLast5Card | null {
  const last5 = [...matches]
    .filter((m): m is MatchAnalytics & { matchDate: string } => Boolean(m.matchDate))
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
    .slice(-5);

  const stats: Record<string, { points: number; exacts: number }> = {};

  last5.forEach((match) => {
    (match.allUserDistances || []).forEach((user) => {
      if (!stats[user.username]) stats[user.username] = { points: 0, exacts: 0 };
      stats[user.username].points += Number(user.points || 0);
      stats[user.username].exacts += Number(user.exactHit || 0);
    });
  });

  const ranking = Object.entries(stats)
    .map(([username, s]) => ({ username, points: s.points, exacts: s.exacts }))
    .sort((a, b) => (a.points !== b.points ? a.points - b.points : a.exacts - b.exacts))
    .slice(0, 3);

  if (!ranking.length) return null;

  return {
    type: "coldLast5",
    accent: "blue",
    emoji: "🥶",
    title: "Congelados das Últimas 5 Rodadas",
    subtitle: "Quem menos pontuou recentemente",
    ranking,
  };
}

function buildDrawKingsCard(matches: MatchAnalytics[]): DrawKingsCard | null {
  const validMatches = matches.filter((m) => m.allUserDistances?.length);

  const stats: Record<string, { exacts: number }> = {};

  validMatches.forEach((match) => {
    (match.allUserDistances || []).forEach((user) => {
      if (!stats[user.username]) stats[user.username] = { exacts: 0 };
      stats[user.username].exacts += Number(user.drawHit || 0);
    });
  });

  const ranking = Object.entries(stats)
    .map(([username, s]) => ({ username, draws: s.exacts }))
    .sort((a, b) => b.draws - a.draws)
    .slice(0, 3);

  if (!ranking.length) return null;

  return {
    type: "drawKings",
    accent: "cyan",
    emoji: "🤝",
    title: "Reis dos Empates Exatos",
    subtitle: "Quem mais acertou empates na mosca",
    ranking,
  };
}

function buildClimbersCard(history: LeagueHistory | null): ClimbersCard | null {
  const frames = history?.frames || [];
  if (frames.length < 6) return null;

  const currentFrame = frames[frames.length - 1];
  const oldFrame = frames[frames.length - 6];

  const changes: { username: string; change: number }[] = [];

  currentFrame.ranking.forEach((current: RankingFrame["ranking"][number]) => {
    const old = oldFrame.ranking.find(
      (r: RankingFrame["ranking"][number]) => r.username === current.username
    );
    if (!old) return;
    changes.push({ username: current.username, change: old.position - current.position });
  });

  const ranking = changes.filter((c) => c.change > 0).sort((a, b) => b.change - a.change).slice(0, 3);

  if (!ranking.length) return null;

  return {
    type: "climbers",
    accent: "lime",
    emoji: "📈",
    title: "Escaladores",
    subtitle: "Quem mais subiu nos últimos 5 jogos",
    ranking,
  };
}

function buildFallersCard(history: LeagueHistory | null): FallersCard | null {
  const frames = history?.frames || [];
  if (frames.length < 6) return null;

  const currentFrame = frames[frames.length - 1];
  const oldFrame = frames[frames.length - 6];

  const changes: { username: string; change: number }[] = [];

  currentFrame.ranking.forEach((current: RankingFrame["ranking"][number]) => {
    const old = oldFrame.ranking.find(
      (r: RankingFrame["ranking"][number]) => r.username === current.username
    );
    if (!old) return;
    changes.push({ username: current.username, change: old.position - current.position });
  });

  const ranking = changes.filter((c) => c.change < 0).sort((a, b) => a.change - b.change).slice(0, 3);

  if (!ranking.length) return null;

  return {
    type: "fallers",
    accent: "rose",
    emoji: "📉",
    title: "Despencaram",
    subtitle: "Quem mais perdeu posições nos últimos 5 jogos",
    ranking,
  };
}

// ────────────────────────────────────────────────────────────
// Builders comentados (mantidos para uso futuro)
// ────────────────────────────────────────────────────────────

/*
function _resultLabel(category: string): string {
  if (category === "home") return "vitória da casa";
  if (category === "away") return "vitória de fora";
  return "empate";
}

function _namesOf(arr: _VisionaryEntry[] | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => (typeof item === "string" ? item : item?.username))
    .filter((name): name is string => Boolean(name));
}

function _getTeams(match: string): [string, string] | null {
  const parts = match.split(/\s+x\s+/i);
  if (parts.length !== 2) return null;
  return [parts[0].trim(), parts[1].trim()];
}

function _buildTeamEntries(matches: MatchAnalytics[]): _TeamEntry[] {
  const entries: _TeamEntry[] = [];
  matches.forEach((m) => {
    if (m.realWinner === "draw") return;
    const teams = _getTeams(m.match);
    if (!teams) return;
    const [home, away] = teams;
    entries.push({ team: home, backing: m.homePercent ?? 0, won: m.realWinner === "home" });
    entries.push({ team: away, backing: m.awayPercent ?? 0, won: m.realWinner === "away" });
  });
  return entries;
}

type _TeamEntry = { team: string; backing: number; won: boolean };

function _buildZebraCard(matches: MatchAnalytics[]): _ZebraCard | null {
  if (!matches.length) return null;
  const match = [...matches].sort((a, b) => b.surpriseIndex - a.surpriseIndex)[0];
  return { type: "zebra", accent: "red", emoji: "🐴", title: "Maior Zebra do Torneio", subtitle: "O jogo que mais surpreendeu — a maioria errou feio", match };
}

function _buildPredictableCard(matches: MatchAnalytics[]): _PredictableCard | null {
  if (!matches.length) return null;
  const match = [...matches].sort((a, b) => a.surpriseIndex - b.surpriseIndex)[0];
  return { type: "predictable", accent: "green", emoji: "🎯", title: "Jogo Mais Previsível", subtitle: "Todo mundo sabia o que ia acontecer — e aconteceu", match };
}

function _buildBlindadoCard(matches: MatchAnalytics[]): _BlindadoCard | null {
  if (!matches.length) return null;
  const match = [...matches].sort((a, b) => a.exactScoreHits - b.exactScoreHits)[0];
  return { type: "blindado", accent: "yellow", emoji: "🔒", title: "Placar Blindado", subtitle: "O jogo onde quase ninguém acertou o placar exato", match };
}

function _buildVisionariosCard(matches: MatchAnalytics[]): _VisionariosCard | null {
  if (!matches.length) return null;
  const zebra = [...matches].sort((a, b) => b.surpriseIndex - a.surpriseIndex)[0];
  const names = _namesOf(zebra.visionaryUsers);
  if (!names.length) return null;
  return { type: "visionarios", accent: "violet", emoji: "🔮", title: "Visionários da Zebra", subtitle: "Quem acreditou na zebra e acertou o vencedor", match: zebra, names };
}

function _buildCoracaoPartidoCard(matches: MatchAnalytics[]): _CoracaoPartidoCard | null {
  type BestEntry = { match: MatchAnalytics; entry: UserDistance };
  let best: BestEntry | undefined;
  matches.forEach((m) => {
    (m.allUserDistances ?? []).forEach((entry) => {
      if (entry.distance <= 0) return;
      if (!best || entry.distance < best.entry.distance || (entry.distance === best.entry.distance && getTs(m.updatedAt) > getTs(best.match.updatedAt))) {
        best = { match: m, entry };
      }
    });
  });
  if (best === undefined) return null;
  return { type: "coracaoPartido", accent: "rose", emoji: "💔", title: "Coração Partido", subtitle: "Chegou mais perto que ninguém e ainda assim não foi o placar exato", match: best.match, entry: best.entry };
}

function _buildVotoDeCabraCard(matches: MatchAnalytics[]): _VotoDeCabraCard | null {
  const candidates = matches
    .map((m) => ({ match: m, majority: majorityOf(m) }))
    .filter(({ match, majority }) => majority.percent > 0 && majority.category !== match.realWinner);
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.majority.percent - a.majority.percent);
  const top = candidates[0];
  return { type: "votoDeCabra", accent: "amber", emoji: "🐐", title: "Voto de Cabra", subtitle: "O jogo em que a maioria apostou todas as fichas e errou redondamente", match: top.match, majority: top.majority };
}

function _buildFaroDeGolCard(matches: MatchAnalytics[]): _FaroDeGolCard | null {
  const withAvg = matches.filter((m) => typeof m.avgHomeGoals === "number" && typeof m.avgAwayGoals === "number");
  if (!withAvg.length) return null;
  const scored = withAvg.map((m) => {
    const predictedTotal = (m.avgHomeGoals as number) + (m.avgAwayGoals as number);
    const actualTotal = m.resultadoA + m.resultadoB;
    return { match: m, predictedTotal, actualTotal, diff: Math.abs(predictedTotal - actualTotal) };
  });
  scored.sort((a, b) => a.diff - b.diff);
  const best = scored[0];
  return { type: "faroDeGol", accent: "sky", emoji: "🥅", title: "Faro de Gol", subtitle: "O jogo em que a média de gols do grupo mais se aproximou do placar real", match: best.match, predictedTotal: best.predictedTotal, actualTotal: best.actualTotal, diff: best.diff };
}

function _buildManadaErradaCard(matches: MatchAnalytics[]): _ManadaErradaCard | null {
  const withPercents = matches.filter((m) => (m.homePercent ?? 0) + (m.drawPercent ?? 0) + (m.awayPercent ?? 0) > 0 && m.realWinner);
  if (withPercents.length < 3) return null;
  const wrongCount = withPercents.filter((m) => majorityOf(m).category !== m.realWinner).length;
  const rate = Math.round((wrongCount / withPercents.length) * 100);
  return { type: "manadaErrada", accent: "fuchsia", emoji: "🐑", title: "Manada Errada", subtitle: "Com que frequência a opção mais votada do grupo não é quem vence", rate, wrongCount, total: withPercents.length };
}

function _buildSubestimadoCard(matches: MatchAnalytics[]): _SubestimadoCard | null {
  const wins = _buildTeamEntries(matches).filter((e) => e.won);
  if (!wins.length) return null;
  const byTeam: Record<string, number[]> = {};
  wins.forEach((e) => { if (!byTeam[e.team]) byTeam[e.team] = []; byTeam[e.team].push(e.backing); });
  const ranked = Object.entries(byTeam).map(([team, backings]) => ({ team, avgBacking: backings.reduce((a, b) => a + b, 0) / backings.length, wins: backings.length })).sort((a, b) => a.avgBacking - b.avgBacking);
  const top = ranked[0];
  if (!top) return null;
  return { type: "subestimado", accent: "teal", emoji: "💎", title: "Time Subestimado", subtitle: "Vence sempre, mas o grupo nunca acreditou muito", team: top.team, avgBacking: Math.round(top.avgBacking), wins: top.wins };
}

function _buildSobrestimadoCard(matches: MatchAnalytics[]): _SobrestimadoCard | null {
  const losses = _buildTeamEntries(matches).filter((e) => !e.won);
  if (!losses.length) return null;
  const byTeam: Record<string, number[]> = {};
  losses.forEach((e) => { if (!byTeam[e.team]) byTeam[e.team] = []; byTeam[e.team].push(e.backing); });
  const ranked = Object.entries(byTeam).map(([team, backings]) => ({ team, avgBacking: backings.reduce((a, b) => a + b, 0) / backings.length, losses: backings.length })).filter((t) => t.avgBacking >= 50).sort((a, b) => b.avgBacking - a.avgBacking);
  const top = ranked[0];
  if (!top) return null;
  return { type: "sobrestimado", accent: "pink", emoji: "📉", title: "Time Sobrestimado", subtitle: "Era o favorito do grupo, mas decepcionou nas vezes que perdeu", team: top.team, avgBacking: Math.round(top.avgBacking), losses: top.losses };
}

function _buildMaisApostadoCard(matches: MatchAnalytics[]): _MaisApostadoCard | null {
  if (!matches.length) return null;
  const top = [...matches].sort((a, b) => (b.totalBets ?? 0) - (a.totalBets ?? 0))[0];
  if (!top.totalBets) return null;
  return { type: "maisApostado", accent: "lime", emoji: "🎰", title: "Jogo Mais Apostado", subtitle: "O confronto que mais mobilizou palpites no grupo", match: top };
}
*/

// ────────────────────────────────────────────────────────────
// Monta a lista final de cards
// ────────────────────────────────────────────────────────────

function buildInsights(matches: MatchAnalytics[], leagueHistory: LeagueHistory | null): InsightCard[] {
  if (!matches.length) return [];

  const streaks = buildStreaks(matches);
  const hotStreaks = streaks.filter((s) => s.hot).sort((a, b) => b.length - a.length);
  const coldStreaks = streaks.filter((s) => !s.hot).sort((a, b) => b.length - a.length);

  const cards: (InsightCard | null)[] = [
    buildProphetCard(matches),
    buildRankingGeralCard(matches),
    buildSniperCard(matches),
    buildHotLast5Card(matches),
    buildColdLast5Card(matches),
    buildDrawKingsCard(matches),
    buildClimbersCard(leagueHistory),
    buildFallersCard(leagueHistory),
    hotStreaks[0]
      ? { type: "peQuente", accent: "orange", emoji: "🔥", title: "Pé Quente", subtitle: "Sequência atual de placares exatos sem errar", streak: hotStreaks[0] }
      : null,
    coldStreaks[0]
      ? { type: "peFrio", accent: "blue", emoji: "🥶", title: "Pé Frio", subtitle: "Sequência atual sem acertar um placar exato", streak: coldStreaks[0] }
      : null,
  ];

  return cards.filter((c): c is InsightCard => c !== null);
}

// ────────────────────────────────────────────────────────────
// UI
// ────────────────────────────────────────────────────────────

function CardShell({
  accent,
  emoji,
  title,
  subtitle,
  children,
}: {
  accent: Accent;
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const styles = ACCENTS[accent];

  return (
    <div
      className={`bg-gradient-to-br ${styles.card} rounded-3xl p-5 h-[280px] flex flex-col overflow-y-auto`}
    >
      <h3 className="text-xl font-black mb-1">{emoji} {title}</h3>
      <p className="text-zinc-400 text-xs mb-3">{subtitle}</p>
      {children}
    </div>
  );
}

function renderCard(card: InsightCard) {
  switch (card.type) {

    case "prophet":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="text-2xl font-black text-white">{card.user.username}</p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <div className="bg-purple-900/50 rounded-2xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-purple-300">{card.user.exactHits}</p>
              <p className="text-xs text-zinc-400">placares exatos</p>
            </div>
            <div className="bg-purple-900/50 rounded-2xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-purple-300">{card.user.totalDistance}</p>
              <p className="text-xs text-zinc-400">gols de distância total</p>
            </div>
            <div className="bg-purple-900/50 rounded-2xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-purple-300">{card.user.games}</p>
              <p className="text-xs text-zinc-400">jogos avaliados</p>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Jogos considerados</p>
            {card.last5.map((m) => {
              const userEntry = (m.allUserDistances ?? []).find((e) => e.username === card.user.username);
              return (
                <div key={m.match} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400 truncate max-w-[60%]">{m.match}</span>
                  <span className="text-zinc-300 font-bold">
                    {userEntry ? (userEntry.distance === 0 ? "🎯 Exato" : `±${userEntry.distance} gol${userEntry.distance > 1 ? "s" : ""}`) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </CardShell>
      );

    case "rankingGeral":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <div className="space-y-2 mt-1">
            {card.ranking.map((u, i) => (
              <div key={u.username} className="flex items-center justify-between bg-indigo-900/40 rounded-2xl px-4 py-2">
                <span className="font-black text-white">{i + 1}º {u.username}</span>
                <span className="text-indigo-300 text-sm font-bold">
                  {u.exactHits} exato{u.exactHits !== 1 ? "s" : ""} · {(u.totalDistance / u.games).toFixed(1)} gols/jogo
                </span>
              </div>
            ))}
          </div>
        </CardShell>
      );

    case "sniper":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="text-2xl font-black text-cyan-300">{card.user.username}</p>
          <p className="text-3xl font-black text-cyan-400 mt-2">
            {Math.round(card.rate * 100)}% de placares exatos em {card.user.games} jogo{card.user.games !== 1 ? "s" : ""} avaliados
          </p>
        </CardShell>
      );

    case "peQuente":
    case "peFrio":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="text-2xl font-black text-white">{card.streak.username}</p>
          <p className={`text-3xl font-black mt-2 ${ACCENTS[card.accent].textBright}`}>
            {card.streak.length} {card.type === "peQuente" ? "placares exatos seguidos" : "jogos seguidos sem acertar o placar exato"}
          </p>
        </CardShell>
      );

    case "hotLast5":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <div className="space-y-2">
            {card.ranking.map((item, index) => (
              <div key={item.username} className="flex justify-between bg-orange-900/40 rounded-2xl px-4 py-2">
                <span className="font-black">{index + 1}º {item.username}</span>
                <span className="text-orange-300 font-bold">{item.points} pts ({item.exacts} exatos)</span>
              </div>
            ))}
          </div>
        </CardShell>
      );

    case "coldLast5":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <div className="space-y-2">
            {card.ranking.map((item, index) => (
              <div key={item.username} className="flex justify-between bg-blue-900/40 rounded-2xl px-4 py-2">
                <span className="font-black">{index + 1}º {item.username}</span>
                <span className="text-blue-300 font-bold">{item.points} pts ({item.exacts} exatos)</span>
              </div>
            ))}
          </div>
        </CardShell>
      );

    case "drawKings":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <div className="space-y-2">
            {card.ranking.map((item, index) => (
              <div key={item.username} className="flex justify-between bg-cyan-900/40 rounded-2xl px-4 py-2">
                <span className="font-black">{index + 1}º {item.username}</span>
                <span className="text-cyan-300 font-bold">{item.draws} empates exatos</span>
              </div>
            ))}
          </div>
        </CardShell>
      );

    case "climbers":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <div className="space-y-2">
            {card.ranking.map((item, index) => (
              <div key={item.username} className="flex justify-between bg-lime-900/40 rounded-2xl px-4 py-2">
                <span className="font-black">{index + 1}º {item.username}</span>
                <span className="text-lime-300 font-bold">+{item.change} posições</span>
              </div>
            ))}
          </div>
        </CardShell>
      );

    case "fallers":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <div className="space-y-2">
            {card.ranking.map((item, index) => (
              <div key={item.username} className="flex justify-between bg-rose-900/40 rounded-2xl px-4 py-2">
                <span className="font-black">{index + 1}º {item.username}</span>
                <span className="text-rose-300 font-bold">{item.change} posições</span>
              </div>
            ))}
          </div>
        </CardShell>
      );

    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────

const ROTATION_INTERVAL_MS = 60_000;

export default function MatchInsightCards() {

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {

    let unsubscribe: (() => void) | undefined;

    async function carregar() {

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const currentGroupId = userSnap.data().activeGroupId;

      const q = query(
        collection(db, "analytics_matches"),
        where("groupId", "==", currentGroupId)
      );

      const historyRef = doc(db, "leagueHistory", currentGroupId);
      const historySnap = await getDoc(historyRef);

      const historyData: LeagueHistory | null = historySnap.exists()
        ? (historySnap.data() as LeagueHistory)
        : null;

      unsubscribe = onSnapshot(q, (snapshot) => {
        const analyticsData = snapshot.docs.map((d) => d.data() as MatchAnalytics);
        setInsights(buildInsights(analyticsData, historyData));
      });
    }

    carregar();

    return () => {
      if (unsubscribe) unsubscribe();
    };

  }, []);

  useEffect(() => {
    if (insights.length < 2 || paused) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % insights.length);
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [insights.length, paused]);

  if (insights.length === 0) return null;

  const card = insights[activeIndex];

  const goTo = (index: number) => {
    setActiveIndex(((index % insights.length) + insights.length) % insights.length);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) goTo(activeIndex + 1);
    if (distance < -minSwipeDistance) goTo(activeIndex - 1);
  };

  return (
    <div
      className="flex flex-col gap-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {renderCard(card)}

      {insights.length > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            className="text-zinc-400 hover:text-white text-2xl px-2 transition-colors"
            aria-label="Análise anterior"
          >
            ⏪
          </button>
          <div className="flex gap-1.5">
            {insights.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir para análise ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex ? "w-6 bg-zinc-300" : "w-1.5 bg-zinc-700"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            className="text-zinc-400 hover:text-white text-2xl px-2 transition-colors"
            aria-label="Próxima análise"
          >
            ⏩
          </button>
        </div>
      )}
    </div>
  );
}