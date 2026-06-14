"use client";

import { useEffect, useState } from "react";

import { auth, db } from "../lib/firebase";

import {
  doc,
  getDoc
} from "firebase/firestore";

import {
  buildRanking
} from "../lib/buildRanking";

import {
  gerarAnaliseIA
} from "../lib/fundamentalistaIA";

export default function FundamentalistaIA() {

  const [analises, setAnalises] =
    useState<string[]>([]);

  const [pagina, setPagina] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function carregarAnalise() {

      try {

        const user =
          auth.currentUser;

        if (!user) {

          setLoading(false);

          return;

        }

        const userRef =
          doc(
            db,
            "users",
            user.uid
          );

        const userSnap =
          await getDoc(userRef);

        if (!userSnap.exists()) {

          setLoading(false);

          return;

        }

        const activeGroupId =
          userSnap.data()
            .activeGroupId;

        if (!activeGroupId) {

          setLoading(false);

          return;

        }

        const ranking =
          await buildRanking(
            activeGroupId
          );

        const resultado =
          gerarAnaliseIA(
            ranking
          );

        setAnalises(resultado);
       
      } catch (error) {

        console.error(
          "Erro Fundamentalista IA:",
          error
        );

      } finally {

        setLoading(false);

      }

    }

    carregarAnalise();

  }, []);

  useEffect(() => {

    const timer =
      setInterval(() => {
  
        setPagina((anterior) =>
          anterior + 1
        );
  
      }, 180000); // 3 minutos
  
    return () =>
      clearInterval(timer);
  
  }, []);

  // iniciando temporizador de mensagens

  const analisesPorPagina = 3;

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        analises.length /
        analisesPorPagina
      )
    );
  
  const paginaAtual =
    pagina % totalPaginas;
  
  const analisesVisiveis =
    analises.slice(
      paginaAtual *
        analisesPorPagina,
  
      (paginaAtual + 1) *
        analisesPorPagina
    );

  return (

    <div
      className="
        bg-gradient-to-r
        from-purple-900
        to-indigo-900
        rounded-3xl
        p-5
        border
        border-purple-700
        shadow-lg
      "
    >

      <div className="flex items-center gap-3 mb-4">

        <span className="text-4xl">
          🧠
        </span>

        <div>

          <h2 className="text-xl font-black text-purple-200">
            Análise Fundamentalista IA
          </h2>

          <p className="text-xs text-purple-300">
            Powered by Mãe Diná Analytics™
          </p>

        </div>

      </div>

      {loading ? (

        <p className="text-zinc-300">
          Analisando mercado de palpites...
        </p>

      ) : (

        <div className="space-y-3">

          {analisesVisiveis.map(
            (item, index) => (

              <p
                key={index}
                className="
                  text-zinc-100
                  leading-relaxed
                "
              >
                {item}
              </p>

            )
          )}

        </div>

      )}

    </div>

  );

}