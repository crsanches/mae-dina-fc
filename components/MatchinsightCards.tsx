
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import {
  onSnapshot
} from "firebase/firestore";

// ────────────────────────────────────────────────────────────
// Tipos de dados (espelham os documentos de analytics_matches)
// ────────────────────────────────────────────────────────────

type UserDistance = {
  username: string;
  distance: number;
  exactHit: number;
  palpite: string;
};

type VisionaryEntry = string | { username: string; palpite?: string };

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
  visionaryUsers?: VisionaryEntry[];
};

type AggUser = { username: string; exactHits: number; totalDistance: number; games: number };

type StreakInfo = { username: string; length: number; hot: boolean };

// ────────────────────────────────────────────────────────────
// Paleta de cores por tipo de card (classes completas e literais
// para o Tailwind conseguir detectar tudo em build)
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
  red: { card: "from-red-950 to-zinc-900 border border-red-700", textBright: "text-red-400" },
  green: { card: "from-green-950 to-zinc-900 border border-green-700", textBright: "text-green-400" },
  yellow: { card: "from-yellow-950 to-zinc-900 border border-yellow-700", textBright: "text-yellow-400" },
  purple: { card: "from-purple-950 to-zinc-900 border border-purple-700", textBright: "text-purple-400" },
  violet: { card: "from-violet-950 to-zinc-900 border border-violet-700", textBright: "text-violet-400" },
  rose: { card: "from-rose-950 to-zinc-900 border border-rose-700", textBright: "text-rose-400" },
  amber: { card: "from-amber-950 to-zinc-900 border border-amber-700", textBright: "text-amber-400" },
  sky: { card: "from-sky-950 to-zinc-900 border border-sky-700", textBright: "text-sky-400" },
  fuchsia: { card: "from-fuchsia-950 to-zinc-900 border border-fuchsia-700", textBright: "text-fuchsia-400" },
  indigo: { card: "from-indigo-950 to-zinc-900 border border-indigo-700", textBright: "text-indigo-400" },
  cyan: { card: "from-cyan-950 to-zinc-900 border border-cyan-700", textBright: "text-cyan-400" },
  orange: { card: "from-orange-950 to-zinc-900 border border-orange-700", textBright: "text-orange-400" },
  blue: { card: "from-blue-950 to-zinc-900 border border-blue-700", textBright: "text-blue-400" },
  teal: { card: "from-teal-950 to-zinc-900 border border-teal-700", textBright: "text-teal-400" },
  pink: { card: "from-pink-950 to-zinc-900 border border-pink-700", textBright: "text-pink-400" },
  lime: { card: "from-lime-950 to-zinc-900 border border-lime-700", textBright: "text-lime-400" },
};




// ────────────────────────────────────────────────────────────
// Union de todos os cards de insight possíveis
// ────────────────────────────────────────────────────────────

type BaseCard = { accent: Accent; emoji: string; title: string; subtitle: string };

type ZebraCard = BaseCard & { type: "zebra"; match: MatchAnalytics };
type PredictableCard = BaseCard & { type: "predictable"; match: MatchAnalytics };
type BlindadoCard = BaseCard & { type: "blindado"; match: MatchAnalytics };
type ProphetCard = BaseCard & { type: "prophet"; user: AggUser; last5: MatchAnalytics[] };
type VisionariosCard = BaseCard & { type: "visionarios"; match: MatchAnalytics; names: string[] };
type CoracaoPartidoCard = BaseCard & { type: "coracaoPartido"; match: MatchAnalytics; entry: UserDistance };
type VotoDeCabraCard = BaseCard & {
  type: "votoDeCabra";
  match: MatchAnalytics;
  majority: { category: string; percent: number };
};
type FaroDeGolCard = BaseCard & {
  type: "faroDeGol";
  match: MatchAnalytics;
  predictedTotal: number;
  actualTotal: number;
  diff: number;
};
type ManadaErradaCard = BaseCard & { type: "manadaErrada"; rate: number; wrongCount: number; total: number };
type RankingGeralCard = BaseCard & { type: "rankingGeral"; ranking: AggUser[] };
type SniperCard = BaseCard & { type: "sniper"; user: AggUser; rate: number };
type StreakCard = BaseCard & { type: "peQuente" | "peFrio"; streak: StreakInfo };
type SubestimadoCard = BaseCard & { type: "subestimado"; team: string; avgBacking: number; wins: number };
type SobrestimadoCard = BaseCard & { type: "sobrestimado"; team: string; avgBacking: number; losses: number };
type MaisApostadoCard = BaseCard & { type: "maisApostado"; match: MatchAnalytics };

type InsightCard =
  | ZebraCard
  | PredictableCard
  | BlindadoCard
  | ProphetCard
  | VisionariosCard
  | CoracaoPartidoCard
  | VotoDeCabraCard
  | FaroDeGolCard
  | ManadaErradaCard
  | RankingGeralCard
  | SniperCard
  | StreakCard
  | SubestimadoCard
  | SobrestimadoCard
  | MaisApostadoCard;

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function getTs(u: MatchAnalytics["updatedAt"]): number {
  if (typeof u === "object" && u !== null && "toMillis" in u && typeof u.toMillis === "function") {
    return u.toMillis();
  }
  return new Date(u as string | Date).getTime();
}

function namesOf(arr: VisionaryEntry[] | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => (typeof item === "string" ? item : item?.username))
    .filter((name): name is string => Boolean(name));
}

function resultLabel(category: string): string {
  if (category === "home") return "vitória da casa";
  if (category === "away") return "vitória de fora";
  return "empate";
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

function getTeams(match: string): [string, string] | null {
  const parts = match.split(/\s+x\s+/i);
  if (parts.length !== 2) return null;
  return [parts[0].trim(), parts[1].trim()];
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

type TeamEntry = { team: string; backing: number; won: boolean };

function buildTeamEntries(matches: MatchAnalytics[]): TeamEntry[] {
  const entries: TeamEntry[] = [];
  matches.forEach((m) => {
    if (m.realWinner === "draw") return;
    const teams = getTeams(m.match);
    if (!teams) return;
    const [home, away] = teams;
    entries.push({ team: home, backing: m.homePercent ?? 0, won: m.realWinner === "home" });
    entries.push({ team: away, backing: m.awayPercent ?? 0, won: m.realWinner === "away" });
  });
  return entries;
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
// Builders: cada um lê os dados e devolve um card pronto, ou
// null quando não há dados suficientes para gerar aquele insight
// ────────────────────────────────────────────────────────────

function buildZebraCard(matches: MatchAnalytics[]): ZebraCard | null {
  if (!matches.length) return null;
  const match = [...matches].sort((a, b) => b.surpriseIndex - a.surpriseIndex)[0];
  return {
    type: "zebra",
    accent: "red",
    emoji: "🐴",
    title: "Maior Zebra do Torneio",
    subtitle: "O jogo que mais surpreendeu — a maioria errou feio",
    match,
  };
}

function buildPredictableCard(matches: MatchAnalytics[]): PredictableCard | null {
  if (!matches.length) return null;
  const match = [...matches].sort((a, b) => a.surpriseIndex - b.surpriseIndex)[0];
  return {
    type: "predictable",
    accent: "green",
    emoji: "🎯",
    title: "Jogo Mais Previsível",
    subtitle: "Todo mundo sabia o que ia acontecer — e aconteceu",
    match,
  };
}

function buildBlindadoCard(matches: MatchAnalytics[]): BlindadoCard | null {
  if (!matches.length) return null;
  const match = [...matches].sort((a, b) => a.exactScoreHits - b.exactScoreHits)[0];
  return {
    type: "blindado",
    accent: "yellow",
    emoji: "🔒",
    title: "Placar Blindado",
    subtitle: "O jogo onde quase ninguém acertou o placar exato",
    match,
  };
}

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

function buildVisionariosCard(matches: MatchAnalytics[]): VisionariosCard | null {
  if (!matches.length) return null;
  const zebra = [...matches].sort((a, b) => b.surpriseIndex - a.surpriseIndex)[0];
  const names = namesOf(zebra.visionaryUsers);
  if (!names.length) return null;

  return {
    type: "visionarios",
    accent: "violet",
    emoji: "🔮",
    title: "Visionários da Zebra",
    subtitle: "Quem acreditou na zebra e acertou o vencedor",
    match: zebra,
    names,
  };
}

function buildCoracaoPartidoCard(matches: MatchAnalytics[]): CoracaoPartidoCard | null {
  type BestEntry = {
    match: MatchAnalytics;
    entry: UserDistance;
  };
  
  let best: BestEntry | undefined;

  matches.forEach((m) => {
    (m.allUserDistances ?? []).forEach((entry) => {
      if (entry.distance <= 0) return;
      if (
        !best ||
        entry.distance < best.entry.distance ||
        (entry.distance === best.entry.distance && getTs(m.updatedAt) > getTs(best.match.updatedAt))
      ) {
        best = { match: m, entry };
      }
    });
  });

  if (best === undefined) return null;

  return {
    type: "coracaoPartido",
    accent: "rose",
    emoji: "💔",
    title: "Coração Partido",
    subtitle: "Chegou mais perto que ninguém e ainda assim não foi o placar exato",
    match: best.match,
    entry: best.entry,
  };
}

function buildVotoDeCabraCard(matches: MatchAnalytics[]): VotoDeCabraCard | null {
  const candidates = matches
    .map((m) => ({ match: m, majority: majorityOf(m) }))
    .filter(({ match, majority }) => majority.percent > 0 && majority.category !== match.realWinner);

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.majority.percent - a.majority.percent);
  const top = candidates[0];

  return {
    type: "votoDeCabra",
    accent: "amber",
    emoji: "🐐",
    title: "Voto de Cabra",
    subtitle: "O jogo em que a maioria apostou todas as fichas e errou redondamente",
    match: top.match,
    majority: top.majority,
  };
}

function buildFaroDeGolCard(matches: MatchAnalytics[]): FaroDeGolCard | null {
  const withAvg = matches.filter(
    (m) => typeof m.avgHomeGoals === "number" && typeof m.avgAwayGoals === "number"
  );
  if (!withAvg.length) return null;

  const scored = withAvg.map((m) => {
    const predictedTotal = (m.avgHomeGoals as number) + (m.avgAwayGoals as number);
    const actualTotal = m.resultadoA + m.resultadoB;
    return { match: m, predictedTotal, actualTotal, diff: Math.abs(predictedTotal - actualTotal) };
  });

  scored.sort((a, b) => a.diff - b.diff);
  const best = scored[0];

  return {
    type: "faroDeGol",
    accent: "sky",
    emoji: "🥅",
    title: "Faro de Gol",
    subtitle: "O jogo em que a média de gols do grupo mais se aproximou do placar real",
    match: best.match,
    predictedTotal: best.predictedTotal,
    actualTotal: best.actualTotal,
    diff: best.diff,
  };
}

function buildManadaErradaCard(matches: MatchAnalytics[]): ManadaErradaCard | null {
  const withPercents = matches.filter(
    (m) => (m.homePercent ?? 0) + (m.drawPercent ?? 0) + (m.awayPercent ?? 0) > 0 && m.realWinner
  );
  if (withPercents.length < 3) return null;

  const wrongCount = withPercents.filter((m) => majorityOf(m).category !== m.realWinner).length;
  const rate = Math.round((wrongCount / withPercents.length) * 100);

  return {
    type: "manadaErrada",
    accent: "fuchsia",
    emoji: "🐑",
    title: "Manada Errada",
    subtitle: "Com que frequência a opção mais votada do grupo não é quem vence",
    rate,
    wrongCount,
    total: withPercents.length,
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

function buildSubestimadoCard(matches: MatchAnalytics[]): SubestimadoCard | null {
  const wins = buildTeamEntries(matches).filter((e) => e.won);
  if (!wins.length) return null;

  const byTeam: Record<string, number[]> = {};
  wins.forEach((e) => {
    if (!byTeam[e.team]) byTeam[e.team] = [];
    byTeam[e.team].push(e.backing);
  });

  const ranked = Object.entries(byTeam)
    .map(([team, backings]) => ({
      team,
      avgBacking: backings.reduce((a, b) => a + b, 0) / backings.length,
      wins: backings.length,
    }))
    .sort((a, b) => a.avgBacking - b.avgBacking);

  const top = ranked[0];
  if (!top) return null;

  return {
    type: "subestimado",
    accent: "teal",
    emoji: "💎",
    title: "Time Subestimado",
    subtitle: "Vence sempre, mas o grupo nunca acreditou muito",
    team: top.team,
    avgBacking: Math.round(top.avgBacking),
    wins: top.wins,
  };
}

function buildSobrestimadoCard(matches: MatchAnalytics[]): SobrestimadoCard | null {
  const losses = buildTeamEntries(matches).filter((e) => !e.won);
  if (!losses.length) return null;

  const byTeam: Record<string, number[]> = {};
  losses.forEach((e) => {
    if (!byTeam[e.team]) byTeam[e.team] = [];
    byTeam[e.team].push(e.backing);
  });

  const ranked = Object.entries(byTeam)
    .map(([team, backings]) => ({
      team,
      avgBacking: backings.reduce((a, b) => a + b, 0) / backings.length,
      losses: backings.length,
    }))
    .filter((t) => t.avgBacking >= 50)
    .sort((a, b) => b.avgBacking - a.avgBacking);

  const top = ranked[0];
  if (!top) return null;

  return {
    type: "sobrestimado",
    accent: "pink",
    emoji: "📉",
    title: "Time Sobrestimado",
    subtitle: "Era o favorito do grupo, mas decepcionou nas vezes que perdeu",
    team: top.team,
    avgBacking: Math.round(top.avgBacking),
    losses: top.losses,
  };
}

function buildMaisApostadoCard(matches: MatchAnalytics[]): MaisApostadoCard | null {
  if (!matches.length) return null;
  const top = [...matches].sort((a, b) => (b.totalBets ?? 0) - (a.totalBets ?? 0))[0];
  if (!top.totalBets) return null;

  return {
    type: "maisApostado",
    accent: "lime",
    emoji: "🎰",
    title: "Jogo Mais Apostado",
    subtitle: "O confronto que mais mobilizou palpites no grupo",
    match: top,
  };
}

// ────────────────────────────────────────────────────────────
// Monta a lista final de cards a partir dos dados já carregados
// ────────────────────────────────────────────────────────────

function buildInsights(matches: MatchAnalytics[]): InsightCard[] {
  if (!matches.length) return [];

  const streaks = buildStreaks(matches);
  const hotStreaks = streaks.filter((s) => s.hot).sort((a, b) => b.length - a.length);
  const coldStreaks = streaks.filter((s) => !s.hot).sort((a, b) => b.length - a.length);

  const cards: (InsightCard | null)[] = [
    buildZebraCard(matches),
    buildPredictableCard(matches),
    buildBlindadoCard(matches),
    buildProphetCard(matches),
    buildVisionariosCard(matches),
    buildCoracaoPartidoCard(matches),
    buildVotoDeCabraCard(matches),
    buildFaroDeGolCard(matches),
    buildManadaErradaCard(matches),
    buildRankingGeralCard(matches),
    buildSniperCard(matches),
    hotStreaks[0]
      ? {
          type: "peQuente",
          accent: "orange",
          emoji: "🔥",
          title: "Pé Quente",
          subtitle: "Sequência atual de placares exatos sem errar",
          streak: hotStreaks[0],
        }
      : null,
    coldStreaks[0]
      ? {
          type: "peFrio",
          accent: "blue",
          emoji: "🥶",
          title: "Pé Frio",
          subtitle: "Sequência atual sem acertar um placar exato",
          streak: coldStreaks[0],
        }
      : null,
    buildSubestimadoCard(matches),
    buildSobrestimadoCard(matches),
    buildMaisApostadoCard(matches),
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


// ────────────────────────────────────────────────────────────
// renderizacao
// ────────────────────────────────────────────────────────────




  return (
    <div
    className={`
      bg-gradient-to-br
      ${styles.card}
      rounded-3xl
      p-5
      h-[280px]
      flex
      flex-col
      overflow-y-auto
    `}
  >
      <h3 className="text-xl font-black mb-1">
        {emoji} {title}
      </h3>
      <p className="text-zinc-400 text-xs mb-3">{subtitle}</p>
      {children}
    </div>
  );
}

function renderCard(card: InsightCard) {
  switch (card.type) {
    case "zebra":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="font-black text-lg text-center">{card.match.match}</p>
          <p className="font-black text-lg mt-1 text-center">
            Resultado: {card.match.resultadoA} x {card.match.resultadoB}
          </p>
          <p className="text-4xl font-black text-red-400 mt-3">{card.match.surpriseIndex}% dos palpiteiros erraram o <span className="text-red-400 font-black">vencedor </span></p>
         
          <div className="flex gap-2 mt-3 text-xs text-zinc-400">
            <span>🏠 {card.match.homePercent}%</span>
            <span>🤝 {card.match.drawPercent}%</span>
            <span>✈️ {card.match.awayPercent}%</span>
          </div>
        </CardShell>
      );

    case "predictable":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="font-black text-lg text-center">{card.match.match}</p>
          <p className="font-black text-lg mt-1 text-center">
            Resultado: {card.match.resultadoA} x {card.match.resultadoB}
          </p>
          <p className="text-4xl font-black text-green-400 mt-3">{100 - card.match.surpriseIndex}% dos palpiteiros acertaram o <span className="text-green-400 font-black">vencedor</span> (não o
            placar exato)</p>
         
          <div className="flex gap-2 mt-3 text-xs text-zinc-400">
            <span>🏠 {card.match.homePercent}%</span>
            <span>🤝 {card.match.drawPercent}%</span>
            <span>✈️ {card.match.awayPercent}%</span>
          </div>
        </CardShell>
      );

    case "blindado":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="font-black text-lg text-center">{card.match.match}</p>
          <p className="font-black text-lg mt-1 text-center">
            Resultado: {card.match.resultadoA} x {card.match.resultadoB}
          </p>
          <p className="text-4xl font-black text-yellow-400 mt-3">
            {card.match.exactScoreHits === 0 ? "Ninguém" : card.match.exactScoreHits} {card.match.exactScoreHits === 0
              ? "acertou o placar exato 😤"
              : `acertou${card.match.exactScoreHits === 1 ? "" : "m"} o placar exato`}
          </p>
         
        </CardShell>
      );

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
        </CardShell>
      );

    case "visionarios":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="font-black text-lg text-center">{card.match.match}</p>
          <p className="font-black text-lg mt-1 text-center">
            Resultado: {card.match.resultadoA} x {card.match.resultadoB}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {card.names.map((name) => (
              <span
                key={name}
                className="bg-violet-900/50 text-violet-300 text-xs font-bold rounded-full px-3 py-1"
              >
                {name}
              </span>
            ))}
          </div>
        </CardShell>
      );

    case "coracaoPartido":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="font-black text-lg text-center">{card.match.match}</p>
          <p className="font-black text-lg mt-1 text-center">
            Resultado: {card.match.resultadoA} x {card.match.resultadoB}
          </p>
          <p className="text-2xl font-black text-rose-300 mt-3">{card.entry.username}  Palpitou <span className="text-rose-400 font-black">{card.entry.palpite}</span> e ficou a só{" "}
            <span className="text-rose-400 font-black">
              {card.entry.distance} gol{card.entry.distance > 1 ? "s" : ""}
            </span>{" "}
            do placar exato</p>
         
        </CardShell>
      );

    case "votoDeCabra":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="font-black text-lg text-center">{card.match.match}</p>
          <p className="font-black text-lg mt-1 text-center">
            Resultado: {card.match.resultadoA} x {card.match.resultadoB}
          </p>
          <p className="text-4xl font-black text-amber-400 mt-3">{card.majority.percent}% apostou em <span className="text-amber-400 font-black">{resultLabel(card.majority.category)}</span> —
            e errou o vencedor</p>
          
        </CardShell>
      );

    case "faroDeGol":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="font-black text-lg text-center">{card.match.match}</p>
          <p className="font-black text-lg mt-1 text-center">
            Resultado: {card.match.resultadoA} x {card.match.resultadoB}
          </p>
          <div className="flex gap-3 mt-3">
            <div className="bg-sky-900/50 rounded-2xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-sky-300">{card.predictedTotal.toFixed(1)}</p>
              <p className="text-xs text-zinc-400">gols esperados (média)</p>
            </div>
            <div className="bg-sky-900/50 rounded-2xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-sky-300">{card.actualTotal}</p>
              <p className="text-xs text-zinc-400">gols reais</p>
            </div>
          </div>
          <p className="text-4xl font-black text-teal-400 mt-2">
            Diferença de só {card.diff.toFixed(1)} gol{card.diff !== 1 ? "s" : ""} — o grupo sentiu o jogo
          </p>
        </CardShell>
      );

    case "manadaErrada":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="text-4xl font-black text-fuchsia-400 mt-1">{card.rate}% dos jogos analisados ({card.wrongCount} de {card.total}), a opção mais votada do grupo não foi quem
            venceu</p>
          
        </CardShell>
      );

    case "rankingGeral":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <div className="space-y-2 mt-1">
            {card.ranking.map((u, i) => (
              <div
                key={u.username}
                className="flex items-center justify-between bg-indigo-900/40 rounded-2xl px-4 py-2"
              >
                <span className="font-black text-white">
                  {i + 1}º {u.username}
                </span>
                <span className="text-indigo-300 text-sm font-bold">
                  {u.exactHits} exato{u.exactHits !== 1 ? "s" : ""} ·{" "}
                  {(u.totalDistance / u.games).toFixed(1)} gols/jogo
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
          <p className="text-4xl font-black text-cyan-400 mt-2">{Math.round(card.rate * 100)}% de placares exatos em {card.user.games} jogo{card.user.games !== 1 ? "s" : ""} avaliados</p>
         
        </CardShell>
      );

    case "peQuente":
    case "peFrio":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="text-2xl font-black text-white">{card.streak.username} </p>
          <p className={`text-4xl font-black mt-2 ${ACCENTS[card.accent].textBright}`}>{card.streak.length} {card.type === "peQuente" ? "placares exatos seguidos" : "jogos seguidos sem acertar o placar exato"}</p>
          
        </CardShell>
      );

    case "subestimado":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="text-2xl font-black text-white">{card.team}</p>
          <p className="text-4xl font-black text-teal-400 mt-2">{card.avgBacking}% era a fé média do grupo nas {card.wins} vez{card.wins !== 1 ? "es" : ""} em que esse time venceu</p>
         
        </CardShell>
      );

    case "sobrestimado":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="text-2xl font-black text-white">{card.team}</p>
          <p className="text-4xl font-black text-pink-400 mt-2">{card.avgBacking}%  era a fé média do grupo nas {card.losses} vez{card.losses !== 1 ? "es" : ""} em que esse time perdeu</p>
        
        </CardShell>
      );

    case "maisApostado":
      return (
        <CardShell accent={card.accent} emoji={card.emoji} title={card.title} subtitle={card.subtitle}>
          <p className="font-black text-lg text-center">{card.match.match}</p>
          <p className="font-black text-lg mt-1 text-center">
            Resultado: {card.match.resultadoA} x {card.match.resultadoB} 
          </p>
          <p className="text-4xl font-black text-lime-400 mt-3">{card.match.totalBets} palpites registrados — o jogo que mais mobilizou o grupo</p>
         
        </CardShell>
      );

    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────────
// Componente principal: busca os dados uma vez e roda um
// carrossel que troca de card automaticamente a cada 60s
// ────────────────────────────────────────────────────────────

const ROTATION_INTERVAL_MS = 60_000;

export default function MatchInsightCards() {

  // criando const para girar cards na tela

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);


  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {

    let unsubscribe:
      (() => void) | undefined;
  
    async function carregar() {
  
      const currentUser =
        auth.currentUser;
  
      if (!currentUser) return;
  
      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );
  
      const userSnap =
        await getDoc(userRef);
  
      if (!userSnap.exists()) return;
  
      const currentGroupId =
        userSnap.data().activeGroupId;
  
      const q = query(
        collection(
          db,
          "analytics_matches"
        ),
        where(
          "groupId",
          "==",
          currentGroupId
        )
      );
  
      unsubscribe =
        onSnapshot(
          q,
          (snapshot) => {
  
            console.log(
              "🔄 Analytics atualizados"
            );
  
            const analyticsData =
            snapshot.docs
            // Ignora analytics antigos gerados pelo buildMatchAnalyticsAdmin
              .filter((d) => !d.id.includes("___"))
              .map(
                (d) =>
                  d.data() as MatchAnalytics
              );

              console.log(
                "TOTAL ANALYTICS DO GRUPO:",
                analyticsData.length
              );
  
            setInsights(
              buildInsights(
                analyticsData
              )
            );
  
          }
        );
  
    }
  
    carregar();
  
    return () => {
  
      if (unsubscribe) {
  
        unsubscribe();
  
      }
  
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
  // pra girar cards

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

  const isLeftSwipe = distance > minSwipeDistance;
  const isRightSwipe = distance < -minSwipeDistance;

  if (isLeftSwipe) {
    goTo(activeIndex + 1);
  }

  if (isRightSwipe) {
    goTo(activeIndex - 1);
  }
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