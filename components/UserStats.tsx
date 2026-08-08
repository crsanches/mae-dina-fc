"use client";

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
  onSnapshot
} from "firebase/firestore";

import {
  auth,
  db
} from "../lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  buildRanking
} from "../lib/buildRanking";

import {
  calculatePoints
} from "../lib/calculatePoints";

import { useTorneioSelecionado, TORNEIOS_INFO } from "../lib/useTorneioSelecionado";
import { getConfigTorneio } from "../lib/torneios";

type UserData = {
  position: number;
  points: number;
};

type BetHistory = {
  jogo: string;
  aposta: string;
  resultado?: string;
  pontos?: number;
  fase?: string;
  grupo?: string;
  matchDate?: string;
  emojiA?: string;
  emojiB?: string;
};

export default function UserStats() {

  const [expandido, setExpandido] = useState(false);

  const [data, setData] = useState<UserData>({
    position: 0,
    points: 0
  });

  const [betHistory, setBetHistory] = useState<BetHistory[]>([]);

  const [loading, setLoading] = useState(true);

  const {
    torneioSelecionado,
    torneiosDisponiveis,
    selecionarTorneio,
    groupId,
    loading: loadingTorneio,
  } = useTorneioSelecionado();

  const configTorneio = getConfigTorneio(torneioSelecionado);

  const [tipoVisualizacao, setTipoVisualizacao] = useState<"grupos" | "matamata">("matamata");

  const [grupoSelecionado, setGrupoSelecionado] = useState("A");

  const [faseSelecionada, setFaseSelecionada] = useState("Oitavas");

  // =========================
  // LOAD PALPITES (histórico de apostas do usuário)
  // =========================

  async function carregarPalpites(torneioId: string, currentGroupId: string) {

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    const betsSnapshot = await getDocs(
      query(
        collection(db, "bets"),
        where("groupId", "==", currentGroupId),
        where("uid", "==", firebaseUser.uid),
        where("torneioId", "==", torneioId)
      )
    );

    const gamesSnapshot = await getDocs(
      query(
        collection(db, "games"),
        where("torneioId", "==", torneioId)
      )
    );

    type GameData = {
      teamA: string;
      teamB: string;
      resultadoA?: number;
      resultadoB?: number;
      fase?: string;
      grupo?: string;
      matchDate?: string;
      emojiA?: string;
      emojiB?: string;
    };

    const gamesMap: Record<string, GameData> = {};

    gamesSnapshot.forEach((gameDoc) => {
      const game = gameDoc.data() as GameData;
      gamesMap[`${game.teamA} x ${game.teamB}`] = game;
    });

    const history: BetHistory[] = [];

    betsSnapshot.forEach((betDoc) => {
      const bet = betDoc.data();

      if (bet.uid !== firebaseUser.uid) return;

      const game = gamesMap[bet.match];
      if (!game) return;

      let pontosCalculados = 0;

      if (game.resultadoA != null && game.resultadoB != null) {
        pontosCalculados = calculatePoints({
          apostaA: Number(bet.golsA),
          apostaB: Number(bet.golsB),
          resultadoA: Number(game.resultadoA),
          resultadoB: Number(game.resultadoB),
        });
      }

      history.push({
        jogo: bet.match,
        aposta: `${bet.golsA} x ${bet.golsB}`,
        resultado:
          game.resultadoA != null && game.resultadoB != null
            ? `${game.resultadoA} x ${game.resultadoB}`
            : undefined,
        pontos: pontosCalculados,
        fase: game.fase,
        grupo: game.grupo,
        matchDate: game.matchDate,
        emojiA: game.emojiA,
        emojiB: game.emojiB
      });
    });

    history.sort((a, b) => (a.matchDate || "").localeCompare(b.matchDate || ""));

    setBetHistory(history);
  }

  // =========================
  // LOAD STATS
  // =========================

  async function carregarStats(torneioId: string, currentGroupId: string) {

    setLoading(true);

    try {

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();

      // Se a fase selecionada não existe no torneio ativo, cai
      // pra primeira fase disponível (ex: trocou de torneio e
      // "Fase32" não existe mais).
      const config = getConfigTorneio(torneioId);
      if (!config.fasesMataMata.some((f) => f.id === faseSelecionada)) {
        setFaseSelecionada(config.fasesMataMata[0]?.id || "Oitavas");
      }
      if (!config.temGrupos && tipoVisualizacao === "grupos") {
        setTipoVisualizacao("matamata");
      }

      // =========================
      // RANKING OFICIAL
      // =========================

      const ranking = await buildRanking(currentGroupId, torneioId);

      const possibleNames = [
        userData.nome,
        userData.username,
        userData.apelido,
        firebaseUser.displayName
      ].filter(Boolean);

      const currentUserData = ranking.find((u) =>
        possibleNames.includes(u.username) || possibleNames.includes(u.nome)
      );

      // Sem dados nesse torneio ainda (ex: Libertadores sem jogos/apostas
      // cadastrados) — reseta posição/pontos em vez de deixar os valores
      // do torneio anterior na tela.
      if (!currentUserData) {
        setData({ position: 0, points: 0 });
        await carregarPalpites(torneioId, currentGroupId);
        setLoading(false);
        return;
      }

      const position = ranking.findIndex((u) =>
        possibleNames.includes(u.username) || possibleNames.includes(u.nome)
      ) + 1;

      setData({
        position,
        points: currentUserData.points
      });

      await carregarPalpites(torneioId, currentGroupId);
      setLoading(false);

    } catch (error) {
      console.error("Erro ao carregar stats:", error);
      setLoading(false);
    }
  }

  // =========================
  // EFFECT — recarrega quando o torneio selecionado muda,
  // e escuta mudanças em `games` (resultados) enquanto o usuário
  // estiver logado.
  // =========================

  useEffect(() => {

    if (!torneioSelecionado || !groupId) return;

    let unsubscribeGames: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setData({ position: 0, points: 0 });
        setBetHistory([]);
        return;
      }

      carregarStats(torneioSelecionado, groupId);

      // A pontuação do usuário só muda quando um RESULTADO muda —
      // não precisamos reagir a cada aposta feita por outros usuários.
      unsubscribeGames = onSnapshot(
        query(collection(db, "games"), where("torneioId", "==", torneioSelecionado)),
        () => {
          carregarStats(torneioSelecionado, groupId);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeGames) unsubscribeGames();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [torneioSelecionado, groupId]);

  const grupos = [
    "A","B","C","D","E","F",
    "G","H","I","J","K","L"
  ];

  const resumoGrupos = grupos.reduce(
    (acc, grupo) => {
      const feitos = betHistory.filter((bet) => bet.grupo === grupo).length;
      acc[grupo] = { feitos, total: 6 };
      return acc;
    },
    {} as Record<string, { feitos: number; total: number }>
  );

  const apostasFiltradas = betHistory.filter((bet) => {
    if (tipoVisualizacao === "grupos") {
      return String(bet.grupo || "").toUpperCase() === grupoSelecionado.toUpperCase();
    }
    return (
      configTorneio.fasesMataMata.some((f) => f.id === bet.fase) &&
      bet.fase === faseSelecionada
    );
  });

  const groupedBets = apostasFiltradas.reduce(
    (acc, bet) => {
      const key = bet.grupo ? `Grupo ${bet.grupo}` : (bet.fase || "Outros");
      if (!acc[key]) acc[key] = [];
      acc[key].push(bet);
      return acc;
    },
    {} as Record<string, BetHistory[]>
  );

  // =========================
  // RENDER
  // =========================

  if (loadingTorneio) {
    return (
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5 text-center text-zinc-500 text-sm">
        Carregando...
      </div>
    );
  }

  return (

    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">

      <h2 className="text-xl font-black mb-4">
        💀 Sua Situação no Ranking Geral
      </h2>

      {/* ABAS DE TORNEIO */}
      {torneiosDisponiveis.length > 1 && (
        <div className="flex gap-2 mb-4">
          {torneiosDisponiveis.map((id) => (
            <button
              key={id}
              onClick={() => {
                selecionarTorneio(id);
                setExpandido(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                torneioSelecionado === id
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {TORNEIOS_INFO[id]?.emoji} {TORNEIOS_INFO[id]?.nome || id}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-zinc-800 rounded-2xl p-4 text-center">
          <p className="text-zinc-400 text-sm">Posição</p>
          <p className="text-3xl font-black text-yellow-400">
            #{data.position || "-"}
          </p>
        </div>

        <div className="bg-zinc-800 rounded-2xl p-4 text-center">
          <p className="text-zinc-400 text-sm">Pontos</p>
          <p className="text-3xl font-black text-green-400">
            {data.points}
          </p>
        </div>

      </div>

      <div className="mt-6">

        <button
          onClick={() => setExpandido(!expandido)}
          className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 transition rounded-2xl p-4 mb-3"
        >
          <div className="text-left">
            <h3 className="text-lg font-black">🎯 Seus Palpites</h3>
            <p className="text-zinc-400 text-sm">
              {betHistory.length} apostas registradas
            </p>
          </div>

          <div className="text-2xl">
            {expandido ? "🔮 Fechar previsões" : "🔮 Abrir meus palpites"}
          </div>
        </button>

        {expandido && (
          <div className="mt-4">

            {configTorneio.temGrupos && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTipoVisualizacao("grupos")}
                  className={
                    tipoVisualizacao === "grupos"
                      ? "bg-yellow-500 text-black px-3 py-2 rounded-xl font-black"
                      : "bg-zinc-700 px-3 py-2 rounded-xl"
                  }
                >
                  🌎 Grupos
                </button>

                <button
                  onClick={() => setTipoVisualizacao("matamata")}
                  className={
                    tipoVisualizacao === "matamata"
                      ? "bg-yellow-500 text-black px-3 py-2 rounded-xl font-black"
                      : "bg-zinc-700 px-3 py-2 rounded-xl"
                  }
                >
                  ⚔️ Mata-mata
                </button>
              </div>
            )}

            {configTorneio.temGrupos && tipoVisualizacao === "grupos" && (
              <div className="flex flex-wrap gap-2 mb-4">
                {grupos.map((grupo) => {
                  const info = resumoGrupos[grupo];
                  const faltam = info.total - info.feitos;

                  return (
                    <button
                      key={grupo}
                      onClick={() => setGrupoSelecionado(grupo)}
                      className={
                        grupoSelecionado === grupo
                          ? "bg-green-500 text-black px-3 py-2 rounded-xl font-black"
                          : "bg-zinc-700 px-3 py-2 rounded-xl"
                      }
                    >
                      <div className="flex items-center gap-1">
                        <span>{grupo}</span>
                        {faltam === 0 ? (
                          <span className="text-xs">✅</span>
                        ) : (
                          <span className="text-xs text-red-300">({faltam})</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {(!configTorneio.temGrupos || tipoVisualizacao === "matamata") && (
              <div className="flex flex-wrap gap-2 mb-4">
                {configTorneio.fasesMataMata.map((fase) => (
                  <button
                    key={fase.id}
                    onClick={() => setFaseSelecionada(fase.id)}
                    className={
                      faseSelecionada === fase.id
                        ? "bg-red-500 text-black px-3 py-2 rounded-xl font-black"
                        : "bg-zinc-700 px-3 py-2 rounded-xl"
                    }
                  >
                    {fase.label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {apostasFiltradas.length === 0 && (
                <p className="text-zinc-400 text-sm">Nenhum palpite registrado.</p>
              )}

              {Object.entries(groupedBets).map(([grupo, bets]) => (
                <div key={grupo} className="mb-5">

                  <h3 className="font-black text-yellow-400 mb-3">
                    {grupo.startsWith("Grupo") ? `🌎 ${grupo}` : `⚔️ ${grupo}`}
                  </h3>

                  <div className="space-y-3">
                    {bets.map((bet, index) => (
                      <div
                        key={index}
                        className="bg-zinc-800 rounded-2xl p-4 border border-zinc-700"
                      >
                        <p className="font-bold text-sm mb-2">⚽ {bet.jogo}</p>
                        <p className="text-zinc-300 text-sm">🎯 Palpite: {bet.aposta}</p>

                        {bet.resultado ? (
                          <>
                            <p className="text-zinc-300 text-sm">
                              🏁 Resultado: {bet.resultado}
                            </p>
                            <p className="text-yellow-400 text-sm font-bold">
                              ⭐ {bet.pontos || 0} pontos
                            </p>
                          </>
                        ) : (
                          <p className="text-blue-400 text-sm">⏳ Aguardando jogo</p>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>

  );
}