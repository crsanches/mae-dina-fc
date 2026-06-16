"use client";

import {
  auth,
  db
} from "../lib/firebase";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  useEffect,
  useState
} from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  calculatePoints
} from "../lib/calculatePoints";

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
  winnerPredictions: { home: number; draw: number; away: number };
  avgHomeGoals: number;
  avgAwayGoals: number;
  exactScoreHits: number;
  surpriseIndex: number;
  closestUsers: UserDistance[];
  allUserDistances: UserDistance[];
  visionaryUsers: string[];
  updatedAt: { toMillis?: () => number } | string | Date;
};

type StatItem = {
  user: string;
  value: number;
};

type Stats = {
  leader: StatItem;
  lastPlace: StatItem;
  drawKing: StatItem;
  coldStreak: StatItem;
  biggestClimb: StatItem;
  totalBets: number;
  totalGames: number;
  totalExactScores: number;
  totalCrazyBets: number;
};

type ChartRow = {
  jogo: string;
  [key: string]: string | number;
};

export default function AnalyticsPage() {

  const [stats, setStats] = useState<Stats>({
    coldStreak: { user: "-", value: 0 },
    biggestClimb: { user: "-", value: 0 },
    leader: { user: "-", value: 0 },
    lastPlace: { user: "-", value: 0 },
    drawKing: { user: "-", value: 0 },
    totalBets: 0,
    totalGames: 0,
    totalExactScores: 0,
    totalCrazyBets: 0,
  });

  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [usersToShow, setUsersToShow] = useState<string[]>([]);

  const [analyticsWinners, setAnalyticsWinners] = useState({
    exactMasterWinner: null as [string, number] | null,
    incendiaryEntry: null as [string, number] | null,
    retranqueiroEntry: null as [string, number] | null,
    chaosEntry: null as [string, number] | null,
    almostEntry: null as [string, number] | null,
  });

  const [matchAnalytics, setMatchAnalytics] = useState<MatchAnalytics[]>([]);

  // Estado do Profeta das Últimas 5 Rodadas
  const [prophetData, setProphetData] = useState<{
    entry: [string, { exactHits: number; totalDistance: number; games: number }] | undefined;
    last5: MatchAnalytics[];
  }>({ entry: undefined, last5: [] });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const [nicknameMap, setNicknameMap] = useState<Record<string, string>>({});

  useEffect(() => {

    async function carregarAnalytics() {

      // ── Verifica auth PRIMEIRO ──
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const currentGroupId = userSnap.data().activeGroupId;

      // ── Carrega todas as coleções ──
      const [analyticsSnapshot, betsSnapshot, gamesSnapshot, usersSnapshot] =
        await Promise.all([
          getDocs(query(collection(db, "analytics_matches"), where("groupId", "==", currentGroupId))),
          getDocs(collection(db, "bets")),
          getDocs(collection(db, "games")),
          getDocs(collection(db, "users")),
        ]);

      const analyticsData = analyticsSnapshot.docs.map((doc) => doc.data() as MatchAnalytics);
      setMatchAnalytics(analyticsData);

      // ── Mapa nome → apelido ──
      const nameToNickname: Record<string, string> = {};
      const uidToNickname: Record<string, string> = {};

      usersSnapshot.forEach((userDoc) => {
        const data = userDoc.data();
        if (data.uid && data.username) {
          uidToNickname[data.uid] = data.username;
          if (data.nome) nameToNickname[data.nome] = data.username;
        }
      });

      betsSnapshot.forEach((betDoc) => {
        const bet = betDoc.data();
        if (bet.uid && bet.userName && uidToNickname[bet.uid]) {
          nameToNickname[bet.userName] = uidToNickname[bet.uid];
        }
      });

      setNicknameMap(nameToNickname);

      // ── Contadores ──
      const ranking: Record<string, number> = {};
      const drawCount: Record<string, number> = {};
      const exactCount: Record<string, number> = {};
      const exactNoDraw: Record<string, number> = {};
      const exactDraw: Record<string, number> = {};
      const totalBetsPerUser: Record<string, number> = {};
      const exactRateMap: Record<string, number> = {};
      const winnerHits: Record<string, number> = {};
      const winnerRate: Record<string, number> = {};
      const totalGoalsBet: Record<string, number> = {};
      const averageGoals: Record<string, number> = {};
      const chaosScore: Record<string, number> = {};
      const almostHits: Record<string, number> = {};
      const maxZeroStreak: Record<string, number> = {};
      const biggestClimbMap: Record<string, number> = {};
      const roundPoints: Record<string, number[]> = {};

      let totalExactScores = 0;
      let totalCrazyBets = 0;
      let totalBets = 0;

      betsSnapshot.forEach((betDoc) => {
        const bet = betDoc.data();
        if (bet.groupId !== currentGroupId) return;

        totalBets++;
        const user = bet.userName;

        if (!totalBetsPerUser[user]) totalBetsPerUser[user] = 0;
        if (!winnerHits[user]) winnerHits[user] = 0;
        if (!totalGoalsBet[user]) totalGoalsBet[user] = 0;
        if (!chaosScore[user]) chaosScore[user] = 0;
        if (!almostHits[user]) almostHits[user] = 0;
        if (!ranking[user]) ranking[user] = 0;
        if (!drawCount[user]) drawCount[user] = 0;
        if (!exactCount[user]) exactCount[user] = 0;
        if (!exactNoDraw[user]) exactNoDraw[user] = 0;
        if (!exactDraw[user]) exactDraw[user] = 0;

        totalBetsPerUser[user]++;

        const golsA = Number(bet.golsA);
        const golsB = Number(bet.golsB);

        totalGoalsBet[user] += golsA + golsB;

        if (golsA >= 6 || golsB >= 6) totalCrazyBets++;
        if (Math.abs(golsA - golsB) >= 5) chaosScore[user] += 1;
        if (golsA >= 7 || golsB >= 7) chaosScore[user] += 3;
        if (golsA === golsB && golsA >= 4) chaosScore[user] += 2;
        if (Number(bet.golsA) === Number(bet.golsB)) drawCount[user]++;

        gamesSnapshot.forEach((gameDoc) => {
          const game = gameDoc.data();
          if (
            game.match === bet.match &&
            game.resultadoA != null &&
            game.resultadoB != null
          ) {
            const points = calculatePoints({
              apostaA: Number(bet.golsA),
              apostaB: Number(bet.golsB),
              resultadoA: Number(game.resultadoA),
              resultadoB: Number(game.resultadoB),
            });

            ranking[user] += points;

            const apostaDiff = Number(bet.golsA) - Number(bet.golsB);
            const resultadoDiff = Number(game.resultadoA) - Number(game.resultadoB);

            const acertouVencedor =
              (apostaDiff > 0 && resultadoDiff > 0) ||
              (apostaDiff < 0 && resultadoDiff < 0) ||
              (apostaDiff === 0 && resultadoDiff === 0);

            if (acertouVencedor) winnerHits[user]++;

            const diffA = Math.abs(Number(bet.golsA) - Number(game.resultadoA));
            const diffB = Math.abs(Number(bet.golsB) - Number(game.resultadoB));

            if (
              diffA + diffB <= 2 &&
              !(
                Number(bet.golsA) === Number(game.resultadoA) &&
                Number(bet.golsB) === Number(game.resultadoB)
              )
            ) {
              almostHits[user]++;
            }

            if (
              Number(bet.golsA) === Number(game.resultadoA) &&
              Number(bet.golsB) === Number(game.resultadoB)
            ) {
              exactCount[user]++;
              totalExactScores++;
              const empate = Number(game.resultadoA) === Number(game.resultadoB);
              if (empate) exactDraw[user]++;
              else exactNoDraw[user]++;
            }
          }
        });
      });

      // ── Rankings ──
      const leaderEntry = Object.entries(ranking).sort((a, b) => b[1] - a[1])[0];
      const lastPlaceEntry = Object.entries(ranking).sort((a, b) => a[1] - b[1])[0];
      const drawKingEntry = Object.entries(drawCount).sort((a, b) => b[1] - a[1])[0];

      // ── Gráfico de evolução ──
      const evolution: ChartRow[] = [];
      const cumulative: Record<string, number> = {};

      const allUsers = Array.from(
        new Set(
          betsSnapshot.docs
            .map((doc) => doc.data())
            .filter((bet) => bet.groupId === currentGroupId)
            .map((bet) => bet.userName)
        )
      );

      allUsers.forEach((user) => { cumulative[user] = 0; });

      const sortedRanking = Object.entries(ranking).sort((a, b) => {
        const userA = a[0], userB = b[0];
        const pointsA = a[1], pointsB = b[1];
        if (pointsB !== pointsA) return pointsB - pointsA;
        const enA = exactNoDraw[userA] || 0, enB = exactNoDraw[userB] || 0;
        if (enB !== enA) return enB - enA;
        const edA = exactDraw[userA] || 0, edB = exactDraw[userB] || 0;
        if (edB !== edA) return edB - edA;
        const wA = winnerHits[userA] || 0, wB = winnerHits[userB] || 0;
        if (wB !== wA) return wB - wA;
        return (chaosScore[userA] || 0) - (chaosScore[userB] || 0);
      });

      const topUsers = sortedRanking.slice(0, 2).map(([user]) => user);
      const bottomUsers = sortedRanking.slice(-2).map(([user]) => user);

      const currentUserBet = betsSnapshot.docs
        .map((d) => d.data())
        .find((bet) => bet.uid === currentUser.uid && bet.groupId === currentGroupId);

      const currentUserName =
        currentUserBet?.userName ||
        userSnap.data().nome ||
        currentUser.displayName ||
        "";

      const visibleUsers = Array.from(new Set([...topUsers, ...bottomUsers, currentUserName]));

      gamesSnapshot.docs
        .filter((doc) => {
          const game = doc.data();
          return game.resultadoA != null && game.resultadoB != null;
        })
        .forEach((gameDoc, index) => {
          const game = gameDoc.data();
          const processedUsers = new Set();
          const rodadaAtual: Record<string, number> = {};

          betsSnapshot.forEach((betDoc) => {
            const bet = betDoc.data();
            if (bet.groupId !== currentGroupId) return;
            if (
              bet.match === game.match &&
              game.resultadoA != null &&
              game.resultadoB != null
            ) {
              if (processedUsers.has(bet.userName)) return;
              processedUsers.add(bet.userName);

              const points = calculatePoints({
                apostaA: Number(bet.golsA),
                apostaB: Number(bet.golsB),
                resultadoA: Number(game.resultadoA),
                resultadoB: Number(game.resultadoB),
              });

              cumulative[bet.userName] += points;
              rodadaAtual[bet.userName] = points;

              if (!roundPoints[bet.userName]) roundPoints[bet.userName] = [];
              roundPoints[bet.userName].push(points);
            }
          });

          const row: ChartRow = { jogo: `J${index + 1}` };
          visibleUsers.forEach((user) => { row[user] = cumulative[user]; });
          evolution.push(row);
        });

      Object.entries(roundPoints).forEach(([user, rounds]) => {
        let current = 0, max = 0;
        rounds.forEach((pts) => {
          if (pts === 0) { current++; if (current > max) max = current; }
          else current = 0;
        });
        maxZeroStreak[user] = max;
      });

      Object.keys(totalBetsPerUser).forEach((user) => {
        exactRateMap[user] = (exactCount[user] || 0) / totalBetsPerUser[user];
        winnerRate[user] = (winnerHits[user] || 0) / totalBetsPerUser[user];
        averageGoals[user] = (totalGoalsBet[user] || 0) / totalBetsPerUser[user];
      });

      const exactMasterWinner = Object.entries(exactRateMap)
        .filter(([user, rate]) =>
          totalBetsPerUser[user] >= 10 &&
          (exactCount[user] || 0) >= 3 &&
          rate >= 0.15
        )
        .sort((a, b) => b[1] - a[1])[0];

      const incendiaryEntry = Object.entries(averageGoals)
        .filter(([, avg]) => avg >= 4)
        .sort((a, b) => b[1] - a[1])[0];

      const retranqueiroEntry = Object.entries(averageGoals)
        .filter(([, avg]) => avg <= 2)
        .sort((a, b) => a[1] - b[1])[0];

      const chaosEntry = Object.entries(chaosScore)
        .filter(([, chaos]) => chaos >= 5)
        .sort((a, b) => b[1] - a[1])[0];

      const coldStreakEntry = Object.entries(maxZeroStreak)
        .sort((a, b) => b[1] - a[1])[0];

      const biggestClimbEntry = Object.entries(biggestClimbMap)
        .sort((a, b) => b[1] - a[1])[0];

      const almostEntry = Object.entries(almostHits)
        .sort((a, b) => b[1] - a[1])[0];

      // ── Profeta das Últimas 5 Rodadas ──
      const last5Matches = [...analyticsData]
        .filter((m) => m.updatedAt && m.allUserDistances?.length)
        .sort((a, b) => {
          const getTs = (u: MatchAnalytics["updatedAt"]) => typeof u === "object" && u !== null && "toMillis" in u && (u as {toMillis?: () => number}).toMillis ? (u as {toMillis: () => number}).toMillis() : new Date(u as string | Date).getTime(); const tsA = getTs(a.updatedAt);
          const tsB = getTs(b.updatedAt);
          return tsB - tsA;
        })
        .slice(0, 5);

      const prophetScores: Record<
        string,
        { exactHits: number; totalDistance: number; games: number }
      > = {};

      last5Matches.forEach((match) => {
        (match.allUserDistances ?? []).forEach(
          (entry: { username: string; distance: number; exactHit: number }) => {
            if (!prophetScores[entry.username]) {
              prophetScores[entry.username] = { exactHits: 0, totalDistance: 0, games: 0 };
            }
            prophetScores[entry.username].exactHits += entry.exactHit ?? 0;
            prophetScores[entry.username].totalDistance += entry.distance;
            prophetScores[entry.username].games += 1;
          }
        );
      });

      const prophetEntry = Object.entries(prophetScores)
        .filter(([, s]) => s.games >= 1)
        .sort(([, a], [, b]) => {
          if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
          return a.totalDistance - b.totalDistance;
        })[0] as [string, { exactHits: number; totalDistance: number; games: number }] | undefined;

      setProphetData({ entry: prophetEntry, last5: last5Matches });

      // ── Setando estados ──
      setChartData(evolution);
      setUsersToShow(visibleUsers);

      setAnalyticsWinners({
        exactMasterWinner,
        incendiaryEntry,
        retranqueiroEntry,
        chaosEntry,
        almostEntry,
      });

      setStats({
        coldStreak: { user: coldStreakEntry?.[0] || "-", value: coldStreakEntry?.[1] || 0 },
        biggestClimb: { user: biggestClimbEntry?.[0] || "-", value: biggestClimbEntry?.[1] || 0 },
        leader: { user: leaderEntry?.[0] || "-", value: leaderEntry?.[1] || 0 },
        lastPlace: { user: lastPlaceEntry?.[0] || "-", value: lastPlaceEntry?.[1] || 0 },
        drawKing: { user: drawKingEntry?.[0] || "-", value: drawKingEntry?.[1] || 0 },
        totalBets,
        totalGames: gamesSnapshot.size,
        totalExactScores,
        totalCrazyBets,
      });
    }

    carregarAnalytics();
  }, []);

  function apelido(userName: string): string {
    return nicknameMap[userName] || userName;
  }

  // ── Cards do marquee ──
  const cards: {
    emoji: string;
    title: string;
    user: string;
    value: string;
    badge: string;
  }[] = [];

  cards.push({
    emoji: "👑",
    title: "Líder Supremo",
    user: apelido(stats.leader.user),
    value: `${stats.leader.value} pts`,
    badge: "🏆 Dono do campeonato",
  });

  if (stats.totalGames >= 5) {
    cards.push({
      emoji: "🐢",
      title: "Lanterna da Vergonha",
      user: apelido(stats.lastPlace.user),
      value: `${stats.lastPlace.value} pts`,
      badge: "⚽ Técnico do Íbis FC",
    });
  }

  if (analyticsWinners.exactMasterWinner) {
    cards.push({
      emoji: "🎯",
      title: "Mestre dos Placares",
      user: apelido(analyticsWinners.exactMasterWinner[0]),
      value: `${Math.round(analyticsWinners.exactMasterWinner[1] * 100)}% de precisão`,
      badge: "🏹 Sniper do futebol",
    });
  }

  if (prophetData.entry) {
    cards.push({
      emoji: "🔭",
      title: "Profeta",
      user: apelido(prophetData.entry[0]),
      value: `${prophetData.entry[1].exactHits} acertos exatos nas últimas 5`,
      badge: "🔮 Vidente esportivo",
    });
  }

  if (stats.coldStreak.value >= 3) {
    cards.push({
      emoji: "🥶",
      title: "Geladeira FC",
      user: apelido(stats.coldStreak.user),
      value: `${stats.coldStreak.value} jogos sem pontuar`,
      badge: "❄️ Congelado",
    });
  }

  if (analyticsWinners.chaosEntry) {
    cards.push({
      emoji: "💣",
      title: "Agente do Caos",
      user: apelido(analyticsWinners.chaosEntry[0]),
      value: `${analyticsWinners.chaosEntry[1]} pontos de insanidade`,
      badge: "🔥 Futebol sem limites",
    });
  }

  if (analyticsWinners.incendiaryEntry) {
    cards.push({
      emoji: "🔥",
      title: "Incendiário",
      user: apelido(analyticsWinners.incendiaryEntry[0]),
      value: `${analyticsWinners.incendiaryEntry[1].toFixed(1)} gols/jogo`,
      badge: "⚽ Viciado em goleada",
    });
  }

  if (analyticsWinners.retranqueiroEntry) {
    cards.push({
      emoji: "🧱",
      title: "Retranqueiro",
      user: apelido(analyticsWinners.retranqueiroEntry[0]),
      value: `${analyticsWinners.retranqueiroEntry[1].toFixed(1)} gols/jogo`,
      badge: "🚌 Estacionou o ônibus",
    });
  }

  if (analyticsWinners.almostEntry) {
    cards.push({
      emoji: "🎯",
      title: "Bateu na Trave",
      user: apelido(analyticsWinners.almostEntry[0]),
      value: `${analyticsWinners.almostEntry[1]} quase acertos`,
      badge: "😩 Quase foi",
    });
  }

  const colors = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a855f7", "#14b8a6"];

  // ── Insights ──
  const insights: string[] = [];

  if (stats.leader.user !== "-") {
    insights.push(
      `${apelido(stats.leader.user)} lidera o campeonato com ${stats.leader.value} pontos e já começou a falar em soberba esportiva.`
    );
  }

  if (stats.coldStreak.value >= 3) {
    insights.push(
      `${apelido(stats.coldStreak.user)} está há ${stats.coldStreak.value} jogos sem pontuar e entrou oficialmente em crise.`
    );
  }

  if (analyticsWinners.chaosEntry) {
    insights.push(
      `${apelido(analyticsWinners.chaosEntry[0])} segue produzindo apostas incompatíveis com qualquer realidade conhecida.`
    );
  }

  if (stats.drawKing.value >= 5) {
    insights.push(
      `${apelido(stats.drawKing.user)} continua acreditando que todo jogo termina empatado.`
    );
  }

  if (prophetData.entry) {
    insights.push(
      `${apelido(prophetData.entry[0])} é o Profeta do momento: ${prophetData.entry[1].exactHits} acerto(s) exato(s) nos últimos 5 jogos com apenas ${prophetData.entry[1].totalDistance} gol(s) de distância total.`
    );
  }

  // ── Achievements ──
  const achievements: {
    user: string;
    title: string;
    emoji: string;
    description: string;
  }[] = [];

  if (analyticsWinners.chaosEntry) {
    achievements.push({
      user: apelido(analyticsWinners.chaosEntry[0]),
      title: "Agente do Caos",
      emoji: "💣",
      description: `${analyticsWinners.chaosEntry[1]} pontos de insanidade`,
    });
  }

  if (stats.drawKing.value >= 10) {
    achievements.push({
      user: apelido(stats.drawKing.user),
      title: "Diplomata do Empate",
      emoji: "🤝",
      description: `${stats.drawKing.value} empates apostados`,
    });
  }

  // ── Derived match analytics ──
  const biggestZebra = [...matchAnalytics].sort((a, b) => b.surpriseIndex - a.surpriseIndex)[0];
  const mostPredictable = [...matchAnalytics].sort((a, b) => a.surpriseIndex - b.surpriseIndex)[0];
  const impossibleScore = [...matchAnalytics].sort((a, b) => a.exactScoreHits - b.exactScoreHits)[0];

  // ─────────────────────────────────────────
  // RENDERIZAÇÃO
  // ─────────────────────────────────────────

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black">📊 Estatísticas da Vergonha</h1>
        </div>

        {/* Totais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-green-400">{stats.totalBets}</p>
            <p className="text-zinc-400 text-sm mt-2">📊 Apostas</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-blue-400">{stats.totalGames}</p>
            <p className="text-zinc-400 text-sm mt-2">⚽ Jogos</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-yellow-400">{stats.totalExactScores}</p>
            <p className="text-zinc-400 text-sm mt-2">🎯 Placares Exatos</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-red-400">{stats.totalCrazyBets}</p>
            <p className="text-zinc-400 text-sm mt-2">💣 Apostas Insanas</p>
          </div>
        </div>

        {/* Cards de analytics por jogo */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">

          {biggestZebra && (
            <div className="bg-gradient-to-br from-red-950 to-zinc-900 border border-red-700 rounded-3xl p-5">
              <h3 className="text-xl font-black mb-1">🐴 Maior Zebra do Torneio</h3>
              <p className="text-zinc-400 text-xs mb-3">O jogo que mais surpreendeu — a maioria errou feio</p>
              <p className="font-black text-lg">{biggestZebra.match}</p>
              <p className="text-zinc-400 text-sm mt-1">Resultado: {biggestZebra.resultadoA} x {biggestZebra.resultadoB}</p>
              <p className="text-4xl font-black text-red-400 mt-3">{biggestZebra.surpriseIndex}%</p>
              <p className="text-zinc-400 text-sm mt-1">dos palpiteiros erraram o <span className="text-red-400 font-black">vencedor</span></p>
              <div className="flex gap-2 mt-3 text-xs text-zinc-400">
                <span>🏠 {biggestZebra.homePercent}%</span>
                <span>🤝 {biggestZebra.drawPercent}%</span>
                <span>✈️ {biggestZebra.awayPercent}%</span>
              </div>
            </div>
          )}

          {mostPredictable && (
            <div className="bg-gradient-to-br from-green-950 to-zinc-900 border border-green-700 rounded-3xl p-5">
              <h3 className="text-xl font-black mb-1">🎯 Jogo Mais Previsível</h3>
              <p className="text-zinc-400 text-xs mb-3">Todo mundo sabia o que ia acontecer — e aconteceu</p>
              <p className="font-black text-lg">{mostPredictable.match}</p>
              <p className="text-zinc-400 text-sm mt-1">Resultado: {mostPredictable.resultadoA} x {mostPredictable.resultadoB}</p>
              <p className="text-4xl font-black text-green-400 mt-3">{100 - mostPredictable.surpriseIndex}%</p>
              <p className="text-zinc-400 text-sm mt-1">dos palpiteiros acertaram o <span className="text-green-400 font-black">vencedor</span> (não o placar exato)</p>
              <div className="flex gap-2 mt-3 text-xs text-zinc-400">
                <span>🏠 {mostPredictable.homePercent}%</span>
                <span>🤝 {mostPredictable.drawPercent}%</span>
                <span>✈️ {mostPredictable.awayPercent}%</span>
              </div>
            </div>
          )}

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
                {impossibleScore.exactScoreHits === 0 ? "acertou o placar exato 😤" : `acertou${impossibleScore.exactScoreHits === 1 ? "" : "m"} o placar exato`}
              </p>
            </div>
          )}

          {prophetData.entry && (
            <div className="bg-gradient-to-br from-purple-950 to-zinc-900 border border-purple-700 rounded-3xl p-5">
              <h3 className="text-xl font-black mb-1">🔭 Profeta das Últimas 5 Rodadas</h3>
              <p className="text-zinc-400 text-xs mb-3">Quem mais se aproximou dos resultados nos últimos 5 jogos encerrados</p>
              <p className="text-2xl font-black text-white">{apelido(prophetData.entry[0])}</p>
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
                    (e: { username: string }) => e.username === prophetData.entry![0]
                  );
                  return (
                    <div key={m.match} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400 truncate max-w-[60%]">{m.match}</span>
                      <span className="text-zinc-300 font-bold">
                        {userEntry ? userEntry.distance === 0 ? "🎯 Exato" : `±${userEntry.distance} gol${userEntry.distance > 1 ? "s" : ""}` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Gráfico */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6">
          <h2 className="text-2xl font-black mb-5">🐢 Evolução dos Palpiteiros</h2>
          {mounted && chartData.length > 0 && (
            <div style={{ width: "100%" }}>
              <div className="flex flex-wrap gap-3 mb-4">
                {usersToShow.map((user, index) => (
                  <div key={user} className="flex items-center gap-2">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: colors[index % colors.length],
                        flexShrink: 0,
                      }}
                    />
                    <span className="text-sm text-zinc-300">
                      {nicknameMap[user] || user}
                    </span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="jogo" stroke="#a1a1aa" />
                  <YAxis domain={[0, "dataMax + 5"]} stroke="#a1a1aa" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value, name) => [
                      `${Number(value)} pts`,
                      nicknameMap[name as string] || (name as string),
                    ]}
                  />
                  {usersToShow.map((user, index) => (
                    <Line
                      key={user}
                      type="monotone"
                      dataKey={user}
                      strokeWidth={3}
                      dot={false}
                      connectNulls
                      stroke={colors[index % colors.length]}
                      legendType="none"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Relatório automático */}
        <div className="mb-6 bg-gradient-to-br from-green-950 to-zinc-900 border border-green-700 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="text-5xl">🤖</div>
            <div>
              <h2 className="text-2xl font-black text-green-300">
                Relatório automático da insanidade esportiva
              </h2>
              <p className="text-zinc-400 text-sm">
                Não temos responsabilidade alguma sobre isso....
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {insights.length === 0 && (
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 text-zinc-400">
                🤖 A IA ainda está coletando dados para humilhar os participantes.
              </div>
            )}
            {insights.map((text, index) => (
              <div
                key={index}
                className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 text-zinc-200 leading-relaxed"
              >
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {achievements.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-yellow-900 to-zinc-900 border border-yellow-700 rounded-3xl p-5"
              >
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3 className="text-xl font-black text-yellow-300">{item.title}</h3>
                <p className="text-2xl font-black mt-2 text-white">{item.user}</p>
                <p className="text-zinc-300 text-sm mt-2">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee fixo no topo */}
        <div className="fixed top-0 left-0 right-0 z-50 px-2 drop-shadow-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-5 pt-4 pb-2 border-b border-zinc-800 bg-zinc-900">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-3">
                  <img src="/icon.png" alt="Mãe Diná FC" className="w-10 h-10 rounded-xl" />
                  <h1 className="text-3xl font-black">⚽ Mãe Diná FC ⚽</h1>
                </div>
                <p className="text-zinc-400 text-sm mt-2">
                  O único bolão onde errar feio também vira troféu.
                </p>
              </div>
              <div className="border-t border-zinc-800 pt-4">
                <h2 className="text-2xl font-black">🏅 Conquistas da Vergonha</h2>
              </div>
            </div>

            <div className="flex gap-4 py-4 px-4 animate-marquee w-max">
              {[...cards, ...cards].map((card, index) => (
                <div
                  key={`${card.title}-${index}`}
                  className="min-w-[260px] bg-zinc-900 border border-zinc-700 rounded-3xl p-3 flex items-center gap-3 shadow-xl"
                >
                  <div className="text-5xl">{card.emoji}</div>
                  <div>
                    <h2 className="font-black text-lg text-white">{card.title}</h2>
                    <p className="text-green-400 font-black text-xl">{card.user}</p>
                    <p className="text-zinc-400 text-sm">{card.value}</p>
                    <div className="mt-2 inline-flex items-center gap-2 bg-purple-900 border border-purple-700 rounded-full px-3 py-1 text-xs font-bold text-purple-200">
                      {card.badge}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}