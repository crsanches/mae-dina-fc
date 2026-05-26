"use client";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import Link from "next/link";

import {
  collection,
  getDocs
} from "firebase/firestore";

import { db } from "../../lib/firebase";

import {
  calculateAuditPoints
} from "../../lib/calculateAuditPoints";

/* =========================
   TYPES
========================= */

type Bet = {

  id: string;

  userName: string;

  match: string;

  golsA: string;

  golsB: string;

  points?: number;

  createdAt?: {
    seconds: number;
  };

};

type Game = {

  id: string;

  teamA: string;
  teamB: string;

  emojiA: string;
  emojiB: string;

  phase: string;

  resultadoA?: number;
  resultadoB?: number;

};

type AuditGame = {

  jogo: string;

  resultado: string;

  palpite: string;

  pontosPlacar: number;

  pontosVencedor: number;

  pontosEmpate: number;

  total: number;

  desempate: number | null;

  exato: boolean;

  createdAt?: number;

};

type AuditUser = {

  userName: string;

  total: number;

  exatos: number;

  aproximacaoVencedor: number;

  aproximacaoEmpate: number;

  ultimoHorarioAposta: number;

  acertosParciais: number;

  jogos: AuditGame[];

};

/* =========================
   PAGE
========================= */

export default function AuditoriaPage() {

  const [bets, setBets] =
    useState<Bet[]>([]);

  const [games, setGames] =
    useState<Game[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {

    async function loadData() {

      try {

        const [

          betsSnapshot,

          gamesSnapshot

        ] = await Promise.all([

          getDocs(
            collection(db, "bets")
          ),

          getDocs(
            collection(db, "games")
          )

        ]);

        const loadedBets: Bet[] = [];

        betsSnapshot.forEach((docItem) => {

          const data = docItem.data();

          loadedBets.push({

            id: docItem.id,

            userName:
              data.userName,

            match:
              data.match,

            golsA:
              data.golsA,

            golsB:
              data.golsB,

            points:
              data.points,

            createdAt:
              data.createdAt

          });

        });

        const loadedGames: Game[] = [];

        gamesSnapshot.forEach((docItem) => {

          const data = docItem.data();

          loadedGames.push({

            id: docItem.id,

            teamA:
              data.teamA,

            teamB:
              data.teamB,

            emojiA:
              data.emojiA,

            emojiB:
              data.emojiB,

            phase:
              data.phase,

            resultadoA:
              data.resultadoA,

            resultadoB:
              data.resultadoB

          });

        });

        setBets(loadedBets);

        setGames(loadedGames);

      } catch (error) {

        console.error(
          "Erro auditoria:",
          error
        );

      } finally {

        setLoading(false);

      }

    }

    loadData();

  }, []);

  /* =========================
     BUILD AUDIT
  ========================= */

  const ranking =
    useMemo(() => {

      const usersMap:
        Record<string, AuditUser> = {};

      // =========================
      // REMOVE APOSTAS DUPLICADAS
      // MANTÉM SOMENTE A MAIS RECENTE
      // =========================

      const latestBetsMap:
        Record<string, Bet> = {};

      bets.forEach((bet) => {

        const key =
          `${bet.userName}__${bet.match}`;

        const current =
          latestBetsMap[key];

        const currentTime =
          current?.createdAt?.seconds || 0;

        const newTime =
          bet.createdAt?.seconds || 0;

        if (
          !current ||
          newTime > currentTime
        ) {

          latestBetsMap[key] = bet;

        }

      });

      const uniqueBets =
        Object.values(latestBetsMap);

      uniqueBets.forEach((bet) => {

        const game =
          games.find(
            (g) =>
              `${g.teamA} x ${g.teamB}` ===
              bet.match
          );

        if (
          !game ||
          game.resultadoA == null ||
          game.resultadoB == null
        ) {

          return;

        }

        const audit =
          calculateAuditPoints({

            apostaA:
              Number(bet.golsA),

            apostaB:
              Number(bet.golsB),

            resultadoA:
              Number(game.resultadoA),

            resultadoB:
              Number(game.resultadoB)

          });

        // =========================
        // DISTÂNCIA DO PLACAR
        // =========================

        const distancia =

          Math.abs(
            Number(bet.golsA) -
            Number(game.resultadoA)
          ) +

          Math.abs(
            Number(bet.golsB) -
            Number(game.resultadoB)
          );

        // =========================
        // ACERTOS PARCIAIS
        // =========================

        let acertosParciais = 0;

        // acertou gols mandante

        if (
          Number(bet.golsA) ===
          Number(game.resultadoA)
        ) {

          acertosParciais += 1;

        }

        // acertou gols visitante

        if (
          Number(bet.golsB) ===
          Number(game.resultadoB)
        ) {

          acertosParciais += 1;

        }

        // remove casos de placar exato
        // porque isso já conta em "exatos"

        if (audit.exato) {

          acertosParciais = 0;

        }

        // =========================
        // CRIA USUÁRIO
        // =========================

        if (!usersMap[bet.userName]) {

          usersMap[bet.userName] = {

            userName:
              bet.userName,

            total: 0,

            exatos: 0,

            aproximacaoVencedor: 0,

            aproximacaoEmpate: 0,

            ultimoHorarioAposta: 0,

            acertosParciais: 0,

            jogos: []

          };

        }

        // =========================
        // TOTAL DE PONTOS
        // =========================

        usersMap[bet.userName]
          .total += audit.total;

        // =========================
        // ACERTOS PARCIAIS
        // =========================

        usersMap[
          bet.userName
        ].acertosParciais +=
          acertosParciais;

        // =========================
        // PLACARES EXATOS
        // =========================

        if (audit.exato) {

          usersMap[bet.userName]
            .exatos += 1;

        }

        // =========================
        // APROXIMAÇÃO VENCEDOR
        // =========================

        if (
          audit.pontosVencedor > 0
        ) {

          usersMap[
            bet.userName
          ].aproximacaoVencedor +=
            distancia;

        }

        // =========================
        // APROXIMAÇÃO EMPATE
        // =========================

        if (
          audit.pontosEmpate > 0
        ) {

          usersMap[
            bet.userName
          ].aproximacaoEmpate +=
            distancia;

        }

        // =========================
        // ÚLTIMO HORÁRIO APOSTA
        // =========================

        const horario =
          bet.createdAt?.seconds || 0;

        if (
          horario <
            usersMap[
              bet.userName
            ].ultimoHorarioAposta ||

          usersMap[
            bet.userName
          ].ultimoHorarioAposta === 0
        ) {

          usersMap[
            bet.userName
          ].ultimoHorarioAposta =
            horario;

        }

        // =========================
        // JOGOS
        // =========================

        usersMap[bet.userName]
          .jogos.push({

            jogo:
              bet.match,

            resultado:
              `${game.resultadoA} x ${game.resultadoB}`,

            palpite:
              `${bet.golsA} x ${bet.golsB}`,

            pontosPlacar:
              audit.pontosPlacar,

            pontosVencedor:
              audit.pontosVencedor,

            pontosEmpate:
              audit.pontosEmpate,

            total:
              audit.total,

            desempate:
              audit.pontosVencedor > 0 ||
              audit.pontosEmpate > 0 ||
              audit.exato

                ? distancia

                : null,

            exato:
              audit.exato,

            createdAt:
              bet.createdAt?.seconds

          });

      });

      return Object.values(usersMap)

      .sort((a, b) => {

        // =========================
        // 1. PONTOS
        // =========================
      
        const totalA =
          a.total || 0;
      
        const totalB =
          b.total || 0;
      
        if (totalB !== totalA) {
      
          return totalB - totalA;
      
        }
      
        // =========================
        // 2. PLACARES EXATOS
        // =========================
      
        const exatosA =
          a.exatos || 0;
      
        const exatosB =
          b.exatos || 0;
      
        if (exatosB !== exatosA) {
      
          return exatosB - exatosA;
      
        }
      
        // =========================
        // 3. APROXIMAÇÃO VENCEDOR
        // MENOR É MELHOR
        // =========================
      
        const aproxVencedorA =
          a.aproximacaoVencedor || 0;
      
        const aproxVencedorB =
          b.aproximacaoVencedor || 0;
      
        if (
          aproxVencedorA !==
          aproxVencedorB
        ) {
      
          return (
            aproxVencedorA -
            aproxVencedorB
          );
      
        }
      
        // =========================
        // 4. APROXIMAÇÃO EMPATE
        // MENOR É MELHOR
        // =========================
      
        const aproxEmpateA =
          a.aproximacaoEmpate || 0;
      
        const aproxEmpateB =
          b.aproximacaoEmpate || 0;
      
        if (
          aproxEmpateA !==
          aproxEmpateB
        ) {
      
          return (
            aproxEmpateA -
            aproxEmpateB
          );
      
        }
      
        // =========================
        // 5. ACERTOS PARCIAIS
        // MAIOR É MELHOR
        // =========================
      
        const parciaisA =
          a.acertosParciais || 0;
      
        const parciaisB =
          b.acertosParciais || 0;
      
        if (
          parciaisB !==
          parciaisA
        ) {
      
          return (
            parciaisB -
            parciaisA
          );
      
        }
      
        // =========================
        // 6. QUEM APOSTOU PRIMEIRO
        // =========================
      
        const horarioA =
          a.ultimoHorarioAposta || 0;
      
        const horarioB =
          b.ultimoHorarioAposta || 0;
      
        return (
          horarioA -
          horarioB
        );
      
      });

    }, [bets, games]);

  /* =========================
     LOADING
  ========================= */

  if (loading) {

    return (

      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">

        <p className="text-zinc-400">
          Carregando auditoria...
        </p>

      </main>

    );

  }

  /* =========================
     RENDER
  ========================= */

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-4">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}

        <div className="flex items-center justify-between mb-6">

          <div>

            <h1 className="text-4xl font-black">
              📋 Auditoria Oficial
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

        {/* RANKING */}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6">

          <h2 className="text-2xl font-black mb-5">
            🏆 Classificação Oficial
          </h2>

          <div className="grid md:grid-cols-2 gap-4 text-sm mb-5">

{/* =========================
    PONTUAÇÃO
========================= */}

<div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">

  <h3 className="font-black text-lg mb-4 text-yellow-400">

    🎯 Pontuação dos Jogos

  </h3>

  <div className="space-y-3 text-zinc-300 leading-6">

    <p>
      ✅ <span className="font-bold text-white">
        5 pontos
      </span>
      {" "}
      — Placar exato
    </p>

    <p>
      ✅ <span className="font-bold text-white">
        3 pontos
      </span>
      {" "}
      — Acertou o vencedor
    </p>

    <p>
      ✅ <span className="font-bold text-white">
        2 pontos
      </span>
      {" "}
      — Acertou empate
    </p>

    <p>
      ❌ <span className="font-bold text-white">
        0 pontos
      </span>
      {" "}
      — Errou tudo
    </p>

  </div>

</div>

{/* =========================
    DESEMPATE
========================= */}

<div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">

  <h3 className="font-black text-lg mb-4 text-green-400">

    🏆 Critérios de Desempate

  </h3>

  <div className="space-y-3 text-zinc-300 leading-6">

  <p>
    1️⃣ Maior número de placares exatos
  </p>

  <p>
    2️⃣ Menor distância acumulada dos resultados
    em jogos onde acertou o vencedor
  </p>

  <p>
    3️⃣ Menor distância acumulada dos resultados
    em jogos empatados
  </p>

  <p>
    4️⃣ Maior número de acertos parciais de gols
  </p>

  <div className="pt-2 border-t border-zinc-700 space-y-3">

    <p>
      🎯 O total exibido no desempate representa
      apenas a soma das distâncias entre os palpites
      e os resultados reais.
    </p>

    <p>
      🎯 Os acertos parciais de gols são utilizados
      separadamente como critério adicional de desempate.
    </p>

    <p>
      🎯 Quanto menor o valor do desempate,
      melhor foi a precisão média dos palpites.
    </p>

    <p>
      🎯 A distância é zero quando o placar exato é acertado.
    </p>

  </div>

</div>

</div>

</div>

          <div className="space-y-3">

            {ranking.map(
              (user, index) => (

                <div
                  key={user.userName}
                  className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 flex justify-between items-center"
                >

                  <div>

                    <p className="font-black text-lg">

                      #{index + 1}
                      {" "}
                      {user.userName}

                    </p>

                    <div className="text-zinc-400 text-sm mt-1 space-y-1">

                      <p>
                        🎯 {user.exatos} maior número de placares exatos
                      </p>

                      <p>
                        📏 Menor distância acumulada em apostas onde houve acerto
                        dos vencedores:
                        {" "}
                        {user.aproximacaoVencedor}
                      </p>

                      <p>
                        🤝 Menor istância acumulada entre o acerto
                        dos empates:
                        {" "}
                        {user.aproximacaoEmpate}
                      </p>

                      <p>
                        ⚽ Acertos de numero de gols - critério adicional:
                        {" "}
                        {user.acertosParciais}
                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="text-3xl font-black text-green-400">

                      {user.total}

                    </p>

                    <p className="text-zinc-500 text-xs">
                      pontos
                    </p>

                    <p className="text-sm text-yellow-400 mt-2 font-bold">

                      🎯 Desempate:
                      {" "}

                      {user.aproximacaoVencedor +
                        user.aproximacaoEmpate}

                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

        {/* USERS */}

        <div className="space-y-5">

          {ranking.map((user) => (

            <details
              key={user.userName}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden"
            >

              <summary className="cursor-pointer list-none p-5 flex justify-between items-center hover:bg-zinc-800 transition">

                <div>

                  <p className="text-xl font-black">

                    👤
                    {" "}
                    {user.userName}

                  </p>

                  <p className="text-zinc-400 text-sm mt-1">

                    🎯
                    {" "}
                    {user.exatos}
                    {" "}
                    exatos

                  </p>

                </div>

                <div className="text-right">

                  <p className="text-3xl font-black text-green-400">

                    {user.total}

                  </p>

                  <p className="text-zinc-500 text-xs">
                    pontos
                  </p>

                  <p className="text-sm text-yellow-400 mt-2 font-bold">

                    🎯 Desempate:
                    {" "}
                    {user.aproximacaoVencedor +
                      user.aproximacaoEmpate}

                  </p>

                </div>

              </summary>

              <div className="p-4 border-t border-zinc-800 space-y-4">

                {user.jogos.map(
                  (jogo, index) => (

                    <div
                      key={index}
                      className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4"
                    >

                      <div className="flex justify-between items-start gap-3">

                        <div>

                          <p className="font-black text-lg">

                            ⚽
                            {" "}
                            {jogo.jogo}

                          </p>

                          <p className="text-zinc-400 mt-2">

                            Palpite:
                            {" "}

                            <span className="text-white font-bold">
                              {jogo.palpite}
                            </span>

                          </p>

                          <p className="text-zinc-400">

                            Resultado:
                            {" "}

                            <span className="text-white font-bold">
                              {jogo.resultado}
                            </span>

                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-3xl font-black text-green-400">

                            {jogo.total}

                          </p>

                          <p className="text-zinc-500 text-xs">
                            pontos
                          </p>

                        </div>

                      </div>

                      <div className="grid grid-cols-4 gap-3 mt-5">

                        <div className="bg-zinc-900 rounded-2xl p-3 text-center">

                          <p className="text-xs text-zinc-500 mb-1">
                            Placar
                          </p>

                          <p className="font-black text-xl">

                            +{jogo.pontosPlacar}

                          </p>

                        </div>

                        <div className="bg-zinc-900 rounded-2xl p-3 text-center">

                          <p className="text-xs text-zinc-500 mb-1">
                            Vencedor
                          </p>

                          <p className="font-black text-xl">

                            +{jogo.pontosVencedor}

                          </p>

                        </div>

                        <div className="bg-zinc-900 rounded-2xl p-3 text-center">

                          <p className="text-xs text-zinc-500 mb-1">
                            Empate
                          </p>

                          <p className="font-black text-xl">

                            +{jogo.pontosEmpate}

                          </p>

                        </div>

                        <div className="bg-zinc-900 rounded-2xl p-3 text-center">

                          <p className="text-xs text-zinc-500 mb-1">
                            Desempate
                          </p>

                          <p className="font-black text-xl">

                            {jogo.desempate ?? "-"}

                          </p>

                        </div>

                      </div>

                      {jogo.createdAt && (

                        <p className="text-zinc-500 text-xs mt-5">

                          🕒 Apostado em:
                          {" "}

                          {new Date(
                            jogo.createdAt * 1000
                          ).toLocaleString("pt-BR")}

                        </p>

                      )}

                    </div>

                  )
                )}

              </div>

            </details>

          ))}

        </div>

      </div>

    </main>

  );

}