"use client";

import {
  useEffect,
  useState
} from "react";

import {
  buildRanking
} from "../lib/buildRanking";

import {
  collection,
  doc,
  getDoc,
  onSnapshot
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  db,
  auth
} from "../lib/firebase";

import type {
  RankingUser
} from "../lib/buildRanking";

export default function RealRanking() {

  const [ranking, setRanking] =
    useState<RankingUser[]>([]);

  const [faseSelecionada, setFaseSelecionada] =
    useState<
      | "Geral"
      | "Grupos"
      | "Fase32"
      | "Oitavas"
      | "Quartas"
      | "Semi"
      | "Final"
    >("Geral");

  // =========================
  // CARREGA RANKING
  // =========================

  async function carregarRanking() {

    try {

      const currentUser =
        auth.currentUser;

      if (!currentUser) {

        setRanking([]);

        return;

      }

      // =========================
      // USUÁRIO ATUAL
      // =========================

      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );

      const userSnap =
        await getDoc(userRef);

      if (!userSnap.exists()) {
        return;
      }

      const currentGroupId =
        userSnap.data().activeGroupId;

      if (!currentGroupId) {
        return;
      }

      // =========================
      // BUILD RANKING OFICIAL
      // =========================

      const rankingArray =
        await buildRanking(
          currentGroupId
        );

      setRanking(rankingArray);

    } catch (error) {

      console.error(
        "Erro ao carregar ranking:",
        error
      );

    }

  }

  // =========================
  // EFFECT
  // =========================

  useEffect(() => {

    let unsubscribeBets:
      (() => void) | undefined;

    const unsubscribeAuth =
      onAuthStateChanged(

        auth,

        (user) => {

          if (!user) {

            setRanking([]);

            return;

          }

          unsubscribeBets =
            onSnapshot(

              collection(
                db,
                "bets"
              ),

              () => {

                carregarRanking();

              }

            );

        }

      );

    return () => {

      unsubscribeAuth();

      if (
        unsubscribeBets
      ) {

        unsubscribeBets();

      }

    };

  }, []);

  // =========================
  // TÍTULO
  // =========================

  function getTituloRanking() {

    switch (faseSelecionada) {

      case "Grupos":
        return "🌎 Ranking da Fase de Grupos";

        case "Segunda":
          return "⚔️ 🚪 Ranking da Segunda";

      case "Oitavas":
        return "⚔️ Ranking das Oitavas";

      case "Quartas":
        return "🏟️ Ranking das Quartas";

      case "Semi":
        return "🔥 Ranking da Semifinal";

      case "Final":
        return "👑 Ranking da Final";

      default:
        return "🏆 Ranking Geral";

    }

  }

  // =========================
  // RANKING EXIBIDO
  // =========================

  const rankingExibido =

    ranking

      .map((user) => {

        if (
          faseSelecionada ===
          "geral"
        ) {

          return user;

        }

        return {

          ...user,

          points:

            user.porFase?.[
              faseSelecionada
            ] || 0

        };

      })

      

      .sort(
        (a, b) =>
          b.points - a.points
      );

 // =========================
  // CRIANDO TOP 1 E TOP 3
  // =========================

      const campeaoAtual =
      rankingExibido[0];

      const top3 =
      rankingExibido.slice(0, 3);


  // =========================
  // RENDER
  // =========================

  return (

    <div className="
      bg-zinc-900
      rounded-xl
      p-4
      border
      border-zinc-800
    ">

      <h2 className="
        text-xl
        font-black
        mb-4
      ">
        {getTituloRanking()}
      </h2>

      {/* FILTROS */}

      <div className="
        flex
        flex-wrap
        gap-2
        mb-5
      ">

        {[
          ["Geral", "🏆 Geral"],
          ["Grupos", "🌎 Grupos"],
          ["Segunda", "⚔️ 🚪 segunda"],
          ["Oitavas", "⚔️ Oitavas"],
          ["Quartas", "🏟️ Quartas"],
          ["Semi", "🔥 Semi"],
          ["Final", "👑 Final"],
        ].map(([id, label]) => (

          <button
            key={id}

            onClick={() =>
              setFaseSelecionada(
                id as typeof faseSelecionada
              )
            }

            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              faseSelecionada === id

                ? "bg-yellow-500 text-black"

                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >

            {label}

          </button>

        ))}

      </div>

      {campeaoAtual && (

<div className="
  mb-5
  bg-gradient-to-br
  from-yellow-500
  to-yellow-700
  text-black
  rounded-2xl
  p-4
  shadow-xl
">

  <div className="
    flex
    items-center
    justify-between
  ">

    <div>

      <p className="
        text-xs
        font-black
        uppercase
        opacity-70
      ">

        {faseSelecionada === "geral"

          ? "🏆 Campeão Geral"

          : "👑 Líder da Fase"}

      </p>

      <h3 className="
        text-2xl
        font-black
        mt-1
      ">

        {campeaoAtual.username ===
         campeaoAtual.nome

          ? campeaoAtual.nome

          : `${campeaoAtual.username} (${campeaoAtual.nome})`
        }

      </h3>

    </div>

    <div className="text-right">

      <p className="
        text-3xl
        font-black
      ">
        ⭐ {campeaoAtual.points}
      </p>

      <p className="
        text-xs
        font-bold
        opacity-70
      ">
        pontos
      </p>

    </div>

  </div>

  {/* TOP 3 */}

  <div className="
    mt-4
    grid
    grid-cols-3
    gap-2
  ">

    {top3.map((user, index) => (

      <div
        key={index}
        className="
          bg-black/20
          rounded-xl
          p-2
          text-center
        "
      >

        <div className="text-xl mb-1">

          {index === 0 && "🥇"}
          {index === 1 && "🥈"}
          {index === 2 && "🥉"}

        </div>

        <p className="
          text-xs
          font-black
          truncate
        ">

          {user.username}

        </p>

        <p className="
          text-sm
          font-black
        ">

          ⭐ {user.points}

        </p>

      </div>

    ))}

  </div>

</div>

)}

      <div className="space-y-3">

        {rankingExibido.length === 0 && (

          <p className="
            text-zinc-400
            text-sm
          ">
            Nenhuma aposta registrada.
          </p>

        )}

        {rankingExibido.map(
          (user, index) => (

            <div
              key={index}
              className="
                bg-zinc-800
                rounded-xl
                p-3
                flex
                justify-between
                items-center
              "
            >

              <div className="
                flex
                items-center
                gap-3
              ">

                <span className="text-xl">

                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && "⚽"}

                </span>

                <div>

                  <p className="
                    font-bold
                    text-sm
                  ">

                    {user.username ===
                     user.nome

                      ? user.nome

                      : `${user.username} (${user.nome})`
                    }

                  </p>

                  <p className="
                    text-zinc-400
                    text-xs
                  ">
                    #{index + 1}
                  </p>

                </div>

              </div>

              <div className="text-right">

                <p className="
                  text-yellow-400
                  font-black
                  text-sm
                ">
                  ⭐ {user.points}
                </p>

                {faseSelecionada !== "geral" && (

                  <p className="
                    text-zinc-500
                    text-xs
                    mt-1
                  ">
                    fase
                  </p>

                )}

              </div>

            </div>

          )
        )}

      </div>

    </div>

  );

}