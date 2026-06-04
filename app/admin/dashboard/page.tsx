"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  collection,
  getDocs
} from "firebase/firestore";

import { db } from "../../../lib/firebase";


type GroupStats = {

  id: string;

  name: string;

  users: number;

  bets: number;

  coverage: number;

};

type DashboardStats = {

  games: number;

  finishedGames: number;

  memes: number;

  groups: GroupStats[];

};





export default function AdminDashboard() {

const [stats, setStats] =
  useState<DashboardStats>({
    games: 0,
    finishedGames: 0,
    memes: 0,
    groups: []
  });


useEffect(() => {
  async function loadStats() {

    const groupsSnap =
  await getDocs(
    collection(db, "groups")
  );
  

    const [
      gamesSnap,
      betsSnap,
      memesSnap

    ] = await Promise.all([

      getDocs(collection(db, "games")),
      getDocs(collection(db, "bets")),
      getDocs(collection(db, "memes")),
      getDocs(collection(db, "groups"))
      

    ]);


    console.log(
      "BET EXEMPLO:",
      betsSnap.docs[0]?.data()
    );

    console.log(
      "GROUP EXEMPLO:",
      groupsSnap.docs[0]?.id,
      groupsSnap.docs[0]?.data()
    );

    const finishedGames =

      gamesSnap.docs.filter(

        (doc) => {

          const data =
            doc.data();

          return (
            data.resultadoA != null &&
            data.resultadoB != null
          );

        }

      ).length;


    const groupsStats =

      groupsSnap.docs.map(
        (groupDoc) => {

      const groupId =
        groupDoc.id;

      const groupName =
        groupDoc.data().name;

      const groupBets =

        betsSnap.docs.filter(

          (bet) =>

            bet.data().groupId ===
            groupId

        );

      const uniqueUsers =
        new Set(

          groupBets.map(

            (bet) =>

              bet.data().uid

          )

        );

      return {

        id: groupId,

        name: groupName,

        users:
          uniqueUsers.size,

        bets:
          groupBets.length,

        coverage:

          gamesSnap.size > 0

            ? Number(
                (
                  groupBets.length /
                  gamesSnap.size
                ).toFixed(1)
              )

            : 0

      };

    }

  )

  .sort(

    (a, b) =>

      a.name.localeCompare(
        b.name
      )

  );

  setStats({

    games:
      gamesSnap.size,
  
    finishedGames,
  
    memes:
      memesSnap.size,
  
    groups:
      groupsStats
  
  });

  }

  loadStats();

}, []);


  return (

    <main className="min-h-screen bg-zinc-950 text-white p-6">

      <div className="max-w-5xl mx-auto">

        <div className="mb-6">

          <Link
            href="/"
            className="
              inline-flex
              items-center
              gap-2
              bg-zinc-800
              hover:bg-zinc-700
              transition
              px-5
              py-3
              rounded-2xl
              font-bold
            "
          >
            ← Voltar ao Bolão
          </Link>

        </div>

        <h1 className="text-5xl font-black mb-10">
          👑 Painel Administrativo
        </h1>

        <div className="grid md:grid-cols-2 gap-6">

          <Link
            href="/admin"
            className="
              bg-blue-950
              hover:bg-blue-900
              transition
              border
              border-blue-700
              rounded-3xl
              p-8
            "
          >

            <div className="text-5xl mb-5">
              ⚽
            </div>

            <h2 className="text-3xl font-black mb-3">
              Jogos
            </h2>

            <p className="text-zinc-300">
              Criar, editar e organizar jogos por grupo.
            </p>

          </Link>

          <Link
            href="/admin/results"
            className="
              bg-green-950
              hover:bg-green-900
              transition
              border
              border-green-700
              rounded-3xl
              p-8
            "
          >

            <div className="text-5xl mb-5">
              🏆
            </div>

            <h2 className="text-3xl font-black mb-3">
              Resultados Oficiais
            </h2>

            <p className="text-zinc-300">
              Lance placares e atualize o ranking.
            </p>

          </Link>

          <Link
            href="/admin/memes"
            className="
              bg-purple-950
              hover:bg-purple-900
              transition
              border
              border-purple-700
              rounded-3xl
              p-8
            "
          >

            <div className="text-5xl mb-5">
              🤡
            </div>

            <h2 className="text-3xl font-black mb-3">
              Central de Memes
            </h2>

            <p className="text-zinc-300">
              Gerencie memes globais e personalizados.
            </p>

          </Link>

          <Link
            href="/admin/estatisticas"
            className="
              bg-yellow-950
              hover:bg-yellow-900
              transition
              border
              border-yellow-700
              rounded-3xl
              p-8
            "
          >

            <div className="text-5xl mb-5">
              📈
            </div>

            <h2 className="text-3xl font-black mb-3">
              Estatísticas
            </h2>

            <p className="text-zinc-300">
              Métricas matemáticas,
              desempenho,
              precisão
              e análise do bolão.
            </p>

          </Link>

       </div>
       </div>
    </main>

  );

}