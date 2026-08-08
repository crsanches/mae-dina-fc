"use client";

import {
  useEffect,
  useState
} from "react";

import Link from "next/link";

import {
  buildRanking,
  type RankingUser
} from "../../lib/buildRanking";

import { useTorneioSelecionado, TORNEIOS_INFO } from "../../lib/useTorneioSelecionado";
import { getConfigTorneio } from "../../lib/torneios";

/* =========================
   PAGE
========================= */

export default function AuditoriaPage() {

  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingUser[]>([]);

  const {
    torneioSelecionado,
    torneiosDisponiveis,
    selecionarTorneio,
    groupId,
    loading: loadingTorneio,
  } = useTorneioSelecionado();

  const configTorneio = getConfigTorneio(torneioSelecionado);

  // "Geral" e "Grupos" não fazem parte de FaseCopa — usamos string aqui
  // porque as fases disponíveis dependem do torneio selecionado.
  const [faseSelecionada, setFaseSelecionada] = useState<string>("Geral");

  // Fases exibidas nos botões: Geral + (Grupos, se o torneio tiver) + fases de mata-mata do torneio
  const fasesDisponiveis: { id: string; label: string }[] = [
    { id: "Geral", label: "🏆 Geral" },
    ...(configTorneio.temGrupos ? [{ id: "Grupos", label: "🌎 Grupos" }] : []),
    ...configTorneio.fasesMataMata,
  ];

  // Se a fase guardada não existe mais no torneio selecionado, exibe
  // "Geral" apenas para fins de leitura (sem forçar setState em efeito)
  const faseEfetiva = fasesDisponiveis.some((f) => f.id === faseSelecionada)
    ? faseSelecionada
    : "Geral";

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {

    if (!torneioSelecionado || !groupId) return;

    const torneioAtual = torneioSelecionado;
    const groupIdAtual = groupId;

    async function loadData() {
      setLoading(true);
      try {
        const rankingData = await buildRanking(groupIdAtual, torneioAtual);
        setRanking(rankingData);
      } catch (error) {
        console.error("Erro auditoria:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();

  }, [torneioSelecionado, groupId]);

  /* =========================
     LOADING
  ========================= */

  if (loadingTorneio || loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">Carregando auditoria...</p>
      </main>
    );
  }

  /* =========================
     RENDER
   ========================= */

  function getTituloAuditoria() {
    if (faseEfetiva === "Geral") return "📋 Auditoria Oficial";
    if (faseEfetiva === "Grupos") return "🌎 Auditoria — Fase de Grupos";
    const fase = configTorneio.fasesMataMata.find((f) => f.id === faseEfetiva);
    return fase ? `${fase.label} Auditoria` : "📋 Auditoria Oficial";
  }

  const rankingFiltrado = ranking.map((user) => {

    if (faseEfetiva === "Geral") {
      return user;
    }

    const jogosFiltrados = user.jogos.filter((jogo) => jogo.fase === faseEfetiva);

    const pontosDaFase = user.porFase?.[faseEfetiva as keyof typeof user.porFase] || 0;

    const exatosDaFase = jogosFiltrados.filter((jogo) => jogo.pontosPlacar > 0).length;

    const acertosParciaisDaFase = jogosFiltrados.reduce(
      (acc, jogo) =>
        acc + ((jogo.pontosVencedor > 0 || jogo.pontosEmpate > 0) ? 1 : 0),
      0
    );

    const desempateDaFase = jogosFiltrados.reduce(
      (acc, jogo) => acc + (jogo.desempate || 0),
      0
    );

    return {
      ...user,
      points: pontosDaFase,
      jogos: jogosFiltrados,
      exatos: exatosDaFase,
      aproximacaoVencedor: desempateDaFase,
      aproximacaoEmpate: 0,
      acertosParciais: acertosParciaisDaFase
    };

  }).sort((a, b) => b.points - a.points);

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-4">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}

        <div className="flex items-center justify-between mb-6">

          <div>
            <h1 className="text-4xl font-black">
              {getTituloAuditoria()}
            </h1>
            <p className="text-zinc-400 mt-2">
              Relatório completo de pontuação
            </p>
          </div>

          <Link
            href="/"
            className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-3 rounded-2xl font-bold"
          >
            ← Voltar
          </Link>

        </div>

        {/* ABAS DE TORNEIO */}

        {torneiosDisponiveis.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {torneiosDisponiveis.map((id) => (
              <button
                key={id}
                onClick={() => {
                  selecionarTorneio(id);
                  setFaseSelecionada("Geral");
                }}
                className={`px-3 py-2 rounded-xl text-sm font-black transition ${
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

        {/* FILTRO DE FASE */}

        <div className="flex flex-wrap gap-2 mb-6">
          {fasesDisponiveis.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFaseSelecionada(id)}
              className={`px-3 py-2 rounded-xl text-sm font-black transition ${
                faseEfetiva === id
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6">

          <h2 className="text-2xl font-black mb-5">
            🏆 Classificação Oficial
          </h2>

          <div className="grid md:grid-cols-2 gap-4 text-sm mb-5">

            {/* PONTUAÇÃO */}

            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">

              <h3 className="font-black text-lg mb-4 text-yellow-400">
                🎯 Pontuação dos Jogos
              </h3>

              <div className="space-y-3 text-zinc-300 leading-6">

                <p>✅ <span className="font-bold text-white">5 pontos</span> — Placar exato</p>
                <p>✅ <span className="font-bold text-white">3 pontos</span> — Acertou o vencedor</p>
                <p>✅ <span className="font-bold text-white">2 pontos</span> — Acertou empate</p>
                <p>❌ <span className="font-bold text-white">0 pontos</span> — Errou tudo</p>

                <h3 className="font-black text-lg mb-4 text-yellow-400">
                  🎯 Peso por fase
                </h3>

                <p>✅ <span className="font-bold text-white">Fase 1 - peso 1</span></p>
                <p>✅ <span className="font-bold text-white">Fase 32 - peso 3</span></p>
                <p>✅ <span className="font-bold text-white">Fase Oitavas de final - peso 5</span></p>
                <p>✅ <span className="font-bold text-white">Fase Quartas de final - peso 8</span></p>
                <p>✅ <span className="font-bold text-white">Fase Semi Final - peso 12</span></p>
                <p>✅ <span className="font-bold text-white">Fase Final - peso 18</span></p>

              </div>

            </div>

            {/* DESEMPATE */}

            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">

              <h3 className="font-black text-lg mb-4 text-green-400">
                🏆 Critérios de Desempate
              </h3>

              <div className="space-y-3 text-zinc-300 leading-6">

                <p>1️⃣ Maior número de placares exatos</p>
                <p>2️⃣ Menor distância acumulada dos resultados em jogos onde acertou o vencedor</p>
                <p>3️⃣ Menor distância acumulada dos resultados em jogos empatados</p>
                <p>4️⃣ Maior número de acertos parciais de gols</p>

                <div className="pt-2 border-t border-zinc-700 space-y-3">
                  <p>🎯 O total exibido no desempate representa apenas a soma das distâncias entre os palpites e os resultados reais.</p>
                  <p>🎯 Os acertos parciais de gols são utilizados separadamente como critério adicional de desempate.</p>
                  <p>🎯 Quanto menor o valor do desempate, melhor foi a precisão média dos palpites.</p>
                  <p>🎯 A distância é zero quando o placar exato é acertado.</p>
                </div>

              </div>

            </div>

          </div>

          <div className="space-y-3">

            {rankingFiltrado.map((user, index) => (

              <div
                key={user.username}
                className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 flex justify-between items-center"
              >

                <div>

                  <p className="font-black text-lg">
                    #{index + 1} {user.username}
                  </p>

                  <div className="text-zinc-400 text-sm mt-1 space-y-1">
                    <p>🎯 {user.exatos} maior número de placares exatos</p>
                    <p>📏 Menor distância acumulada em apostas onde houve acerto dos vencedores: {user.aproximacaoVencedor}</p>
                    <p>🤝 Menor distância acumulada entre o acerto dos empates: {user.aproximacaoEmpate}</p>
                    <p>⚽ Acertos de número de gols - critério adicional: {user.acertosParciais}</p>
                  </div>

                </div>

                <div className="text-right">
                  <p className="text-3xl font-black text-green-400">{user.points}</p>
                  <p className="text-zinc-500 text-xs">pontos</p>
                  <p className="text-sm text-yellow-400 mt-2 font-bold">
                    🎯 Desempate: {user.aproximacaoVencedor + user.aproximacaoEmpate}
                  </p>
                </div>

              </div>

            ))}

          </div>

        </div>

        {/* USERS */}

        <div className="space-y-5">

          {rankingFiltrado.map((user) => (

            <details
              key={user.username}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden"
            >

              <summary className="cursor-pointer list-none p-5 flex justify-between items-center hover:bg-zinc-800 transition">

                <div>
                  <p className="text-xl font-black">👤 {user.username}</p>
                  <p className="text-zinc-400 text-sm mt-1">🎯 {user.exatos} exatos</p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-black text-green-400">{user.points}</p>
                  <p className="text-zinc-500 text-xs">pontos</p>
                  <p className="text-sm text-yellow-400 mt-2 font-bold">
                    🎯 Desempate: {user.aproximacaoVencedor + user.aproximacaoEmpate}
                  </p>
                </div>

              </summary>

              <div className="p-4 border-t border-zinc-800 space-y-4">

                {user.jogos.map((jogo, index) => (

                  <div
                    key={index}
                    className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4"
                  >

                    <div className="flex justify-between items-start gap-3">

                      <div>
                        <p className="font-black text-lg">⚽ {jogo.jogo}</p>
                        <p className="text-zinc-400 mt-2">
                          Palpite: <span className="text-white font-bold">{jogo.palpite}</span>
                        </p>
                        <p className="text-zinc-400">
                          Resultado: <span className="text-white font-bold">{jogo.resultado}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-3xl font-black text-green-400">{jogo.total}</p>
                        <p className="text-zinc-500 text-xs">pontos</p>
                      </div>

                    </div>

                    <div className="grid grid-cols-4 gap-3 mt-5">

                      <div className="bg-zinc-900 rounded-2xl p-3 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Placar</p>
                        <p className="font-black text-xl">+{jogo.pontosPlacar}</p>
                      </div>

                      <div className="bg-zinc-900 rounded-2xl p-3 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Vencedor</p>
                        <p className="font-black text-xl">+{jogo.pontosVencedor}</p>
                      </div>

                      <div className="bg-zinc-900 rounded-2xl p-3 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Empate</p>
                        <p className="font-black text-xl">+{jogo.pontosEmpate}</p>
                      </div>

                      <div className="bg-zinc-900 rounded-2xl p-3 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Desempate</p>
                        <p className="font-black text-xl">{jogo.desempate ?? "-"}</p>
                      </div>

                    </div>

                    {jogo.createdAt && (
                      <p className="text-zinc-500 text-xs mt-5">
                        🕒 Apostado em: {new Date(jogo.createdAt * 1000).toLocaleString("pt-BR")}
                      </p>
                    )}

                  </div>

                ))}

              </div>

            </details>

          ))}

        </div>

      </div>

    </main>

  );

}