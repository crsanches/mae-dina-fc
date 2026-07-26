
"use client";

//PAGINA PRINCIPAL DO APP

import {
  useEffect,
  useState,
  useCallback
} from "react";

import dynamic from "next/dynamic";
import Link from "next/link";

import LoginCard from "../components/LoginCard";
import GroupCard from "../components/GroupCard";
import Footer from "../components/footer";

import { db, auth } from "../lib/firebase";
import { getAutomaticMeme } from "../lib/automaticMemes";
import { calculatePoints } from "../lib/calculatePoints";
import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

import { getTorneioAtivo } from "../lib/getTorneioAtivo";

const UserStats = dynamic(() => import("../components/UserStats"), { ssr: false });
const RealRanking = dynamic(() => import("../components/RealRanking"), { ssr: false });
const FundamentalistaIA = dynamic(() => import("../components/FundamentalistaIA"), { ssr: false });
const AnalyticsDashboard = dynamic(() => import("../components/AnalyticsDashboard"), { ssr: false });
const MatchInsightCards = dynamic(() => import("../components/MatchinsightCards"), { ssr: false });
const CentralCorneta = dynamic(() => import("../components/CentralCorneta"), { ssr: false });


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
  apiStatus?: string;
};

type UsuarioLiga = {
  id: string;
  nome: string;
  username: string;
  activeGroupId: string;
};

export default function Home() {

  const [isLogged, setIsLogged] = useState(false);
  const [ligaId, setLigaId] = useState("");
  const [usuariosLiga, setUsuariosLiga] = useState<UsuarioLiga[]>([]);
  const [jogos, setJogos] = useState<Game[]>([]);
  const [automaticMeme, setAutomaticMeme] = useState<{ text: string; image?: string } | null>(null);
  const [showHeavyComponents, setShowHeavyComponents] = useState(false);

  const gerarMemeAutomatico = useCallback(async (currentUser: string, currentGroupId: string) => {
    try {
      const torneioId = await getTorneioAtivo();
  
      const betsQuery = query(
        collection(db, "bets"),
        where("groupId", "==", currentGroupId),
        where("torneioId", "==", torneioId)
      );
      const gamesQuery = query(
        collection(db, "games"),
        where("torneioId", "==", torneioId)
      );
      const [betsSnapshot, gamesSnapshot] = await Promise.all([
        getDocs(betsQuery),
        getDocs(gamesQuery),
      ]);
  
      const ranking: Record<string, number> = {};
      let exactScore = false;
      let crazyBet = false;

      betsSnapshot.forEach((betDoc) => {
        const bet = betDoc.data() as {
          userName: string;
          match: string;
          golsA: string;
          golsB: string;
          createdAt?: { seconds: number };
          nome?: string;
          username?: string;
          uid?: string;
        };

        let points = 0;

        gamesSnapshot.forEach((gameDoc) => {
          const game = gameDoc.data();
          if (
            `${game.teamA} x ${game.teamB}` === bet.match &&
            game.resultadoA != null &&
            game.resultadoB != null
          ) {
            points = calculatePoints({
              apostaA: Number(bet.golsA),
              apostaB: Number(bet.golsB),
              resultadoA: Number(game.resultadoA),
              resultadoB: Number(game.resultadoB),
            });
            if (
              bet.userName === currentUser &&
              Number(bet.golsA) === Number(game.resultadoA) &&
              Number(bet.golsB) === Number(game.resultadoB)
            ) exactScore = true;
            if (
              bet.userName === currentUser &&
              (Number(bet.golsA) >= 6 || Number(bet.golsB) >= 6)
            ) crazyBet = true;
          }
        });

        if (!ranking[bet.userName]) ranking[bet.userName] = 0;
        ranking[bet.userName] += points;
      });

      const sorted = Object.entries(ranking).sort((a, b) => b[1] - a[1]);
      const isLeader = sorted[0]?.[0] === currentUser;
      const isLastPlace = sorted[sorted.length - 1]?.[0] === currentUser;
      const meme = getAutomaticMeme({ isLeader, isLastPlace, exactScore, crazyBet });
      if (meme) setAutomaticMeme(meme);

    } catch (error) {
      console.error("Erro meme automático:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLogged(!!user);
      if (!user) { setAutomaticMeme(null); return; }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const activeGroupId = userSnap.data().activeGroupId;
      if (!activeGroupId) return;

      setLigaId(activeGroupId);

      const usersSnapshot = await getDocs(
        query(collection(db, "users"), where("groups", "array-contains", activeGroupId))
      );

      setUsuariosLiga(usersSnapshot.docs.map((userDoc) => {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          nome: data.nome || data.displayName || data.username || "Jogador",
          username: data.username || data.displayName || "Jogador",
          activeGroupId: data.activeGroupId,
        };
      }));

      await gerarMemeAutomatico(user.displayName || "", activeGroupId);
    });

    return () => unsubscribe();
  }, [gerarMemeAutomatico]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
  
    getTorneioAtivo().then((torneioId) => {
      const q = query(
        collection(db, "games"),
        where("torneioId", "==", torneioId),
        orderBy("createdAt", "asc")
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        const games: Game[] = [];
        snapshot.forEach((docItem) => {
          const data = docItem.data();
          games.push({
            id: docItem.id,
            teamA: data.teamA,
            teamB: data.teamB,
            emojiA: data.emojiA,
            emojiB: data.emojiB,
            fase: data.fase || data.phase,
            grupo: data.grupo,
            matchDate: data.matchDate,
            resultadoA: data.resultadoA,
            resultadoB: data.resultadoB,
            apiStatus: data.status || data.apiStatus,
          });
        });
        setJogos(games);
      });
    });
  
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setShowHeavyComponents(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  function getStatusJogo(jogo: Game, agora: number) {
    const inicioJogo = new Date(jogo.matchDate).getTime();
    const fechamentoApostas = inicioJogo - 60 * 60 * 1000;
  
    if (agora < fechamentoApostas) return "🟢 Apostas abertas";
    if (agora < inicioJogo) return "🔒 Apostas encerradas";
  
    // Status vindo do TheSportsDB (fonte da verdade)
    if (jogo.apiStatus) {
      if (["FT", "AET", "AP", "Match Finished"].includes(jogo.apiStatus))
      return "✅ Jogo encerrado";
      if (["ET", "BT"].includes(jogo.apiStatus))
        return "⏱️ Prorrogação";
      if (jogo.apiStatus === "P")
        return "🥅 Pênaltis";
      if (["1H", "HT", "2H"].includes(jogo.apiStatus))
        return "⚽ Jogo em andamento";
     
    }
  
    // Fallback por tempo (se o sync ainda não gravou status)
    const fimTempoNormal = inicioJogo + 125 * 60 * 1000;
    const fimProrrogacao = inicioJogo + 163 * 60 * 1000;
    const empatado =
      jogo.resultadoA != null &&
      jogo.resultadoB != null &&
      jogo.resultadoA === jogo.resultadoB;
  
    if (agora < fimTempoNormal) return "⚽ Jogo em andamento";
    if (!jogo.grupo && empatado && agora < fimProrrogacao)
      return "⏱️ Prorrogação";
  
    return "✅ Jogo encerrado";
  }
  const jogosEncerrados = jogos.filter((jogo) => {
    const difference = new Date(jogo.matchDate).getTime() - new Date().getTime();
    return difference <= 1000 * 60 * 60;
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const duasDiasAtras = new Date(hoje);
  duasDiasAtras.setDate(hoje.getDate() - 2);

  const jogosEncerradosPorFase = jogosEncerrados
    .filter((jogo) => new Date(jogo.matchDate) >= duasDiasAtras)
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .reduce((acc, jogo) => {
      if (!acc[jogo.fase]) acc[jogo.fase] = [];
      acc[jogo.fase].push(jogo);
      return acc;
    }, {} as Record<string, typeof jogos[number][]>);

  const agora = new Date().getTime();

  if (!isLogged) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-7xl mb-6">⚽</div>
          <h1 className="text-5xl font-black mb-4">Mãe Diná FC</h1>
          <p className="text-zinc-400 mb-8 text-lg">
            O único bolão onde a humilhação é em tempo real 😂
          </p>
          <LoginCard />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-20">
      <section className="max-w-2xl mx-auto px-2 md:px-4 grid gap-3 pt-[350px]">

        <LoginCard />
        <GroupCard />

        {/* BOTÃO ADMIN */}
        {auth.currentUser?.uid === "s45fFE4vSrOmnpQIcjuWnWU0pKB3" && (
          <Link
            href="/admin/dashboard"
            className="bg-zinc-800 hover:bg-zinc-700 transition border border-zinc-600 rounded-3xl p-5 flex items-center gap-4"
          >
            <div className="text-5xl">👑</div>
            <div>
              <h2 className="text-2xl font-black">Painel Admin</h2>
              <p className="text-zinc-400 text-sm mt-1">Gerenciar jogos e resultados</p>
            </div>
          </Link>
        )}

        {/* APOSTAS */}
        <Link
          href="/play"
          className="bg-yellow-500 hover:bg-green-600 transition text-black font-black rounded-3xl p-5 flex items-center gap-4"
        >
          <div className="text-5xl">🎯</div>
          <div>
            <h2 className="text-2xl font-black">Fazer Palpites</h2>
            <p className="text-black text-sm mt-1 font-semibold">
              Entre na área de apostas da rodada 😄
            </p>
          </div>
        </Link>
          {/* ======================================
            HISTÓRIA DA LIGA
          ====================================== */}

          <Link
            href={`/historia/${ligaId}`}
          >
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-3xl p-5">
              <h3 className="font-bold text-xl">
                🏆 História da Liga
              </h3>

              <p className="text-sm opacity-80">
                Veja a evolução do ranking jogo a jogo
              </p>
            </div>
          </Link>

        {/* ======================================
            ORDEM DOS COMPONENTES:
            1. UserStats
            2. FundamentalistaIA
            3. MatchInsightCards  ← 4 cards de destaque
            4. RealRanking        ← ranking colapsável (5 primeiros)
            5. CentralCorneta
            6. AnalyticsDashboard ← gráfico + insights + conquistas
            7. BetTable
        ====================================== */}
        {showHeavyComponents && (
          <>
            <UserStats />
            <FundamentalistaIA />
            <MatchInsightCards />
            <RealRanking />
            <CentralCorneta ligaId={ligaId} usuarios={usuariosLiga} />
            <AnalyticsDashboard />
           
          </>
        )}

        {/* MEMES */}
        {/* {automaticMeme && (
          <div className="mb-5 bg-purple-900 border border-purple-700 rounded-2xl p-4 text-center overflow-hidden">
            {automaticMeme.image && (
              <img src={automaticMeme.image} alt="Meme" loading="lazy" className="rounded-2xl mb-4 w-full" />
            )}
            <p className="text-lg font-black">🤖 {automaticMeme.text}</p>
          </div>
        )}*/}

        {/* RESULTADOS */}
        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold">
              Resultados Oficiais dos últimos dois dias.
              <p className="text-zinc-400 text-sm mt-1">
                Os demais resultados você vê em &quot;seus palpites&quot;
              </p>
            </h2>
          </div>

          {Object.entries(jogosEncerradosPorFase).map(([fase, jogosDaFase]) => (
            <div key={fase} className="mb-5">
              <h3 className="text-base font-black mb-3 text-red-400">{fase}</h3>
              <div className="space-y-3">
                {jogosDaFase.map((jogo) => (
                  <div
                    key={`${jogo.teamA}-${jogo.teamB}`}
                    className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-sm flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          {jogo.emojiA?.startsWith("/") ? (
                            <img src={jogo.emojiA} alt={jogo.teamA} loading="lazy" className="w-5 h-5 object-contain inline-block" />
                          ) : (
                            <span className="text-lg leading-none">{jogo.emojiA}</span>
                          )}
                          <span>{jogo.teamA}</span>
                        </span>
                        <span>x</span>
                        <span className="flex items-center gap-1">
                          {jogo.emojiB?.startsWith("/") ? (
                            <img src={jogo.emojiB} alt={jogo.teamB} loading="lazy" className="w-5 h-5 object-contain inline-block" />
                          ) : (
                            <span className="text-lg leading-none">{jogo.emojiB}</span>
                          )}
                          <span>{jogo.teamB}</span>
                        </span>
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {new Date(jogo.matchDate).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-zinc-400 text-xs">
                      {getStatusJogo(jogo, agora)}
                    </p>
                    </div>
                    <p className="font-black text-lg">
                      {jogo.resultadoA != null && jogo.resultadoB != null ? (
                        <>
                          {jogo.resultadoA} x {jogo.resultadoB}
                          {["⚽ Jogo em andamento", "⏱️ Prorrogação"].includes(
                          getStatusJogo(jogo, agora)
                        ) && (
                          <span className="text-xs text-green-400 ml-2 animate-pulse">● AO VIVO</span>
                        )}
                        </>
                      ) : "⏳"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AUDITORIA */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl px-5 py-3 border border-red-800/40 shadow-xl shadow-red-950/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-yellow-300 tracking-wide leading-none">
                Relatório de Auditoria
              </h2>
              <p className="text-zinc-400 text-sm mt-1">Transparência total da rodada</p>
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <Link href="/auditoria" className="hover:scale-105 transition-all duration-300">
              <img src="/logos/casa_mae_joana.png" alt="Auditoria" className="w-84 object-contain drop-shadow-2xl" />
            </Link>
          </div>
        </div>

        <Footer />

      </section>
    </main>
  );
}



