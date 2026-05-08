"use client";

import Link from "next/link";

import {
  useEffect,
  useState
} from "react";

import {
  db
} from "../../../lib/firebase";

import {
  collection,
  onSnapshot,
  orderBy,
  query
} from "firebase/firestore";

type Bet = {
  userName: string;
  match: string;
  golsA: string;
  golsB: string;
  createdAt?: {
    seconds: number;
  };
};

export default function AdminBetsPage() {

  const [bets, setBets] =
    useState<Bet[]>([]);

  const [selectedMatch, setSelectedMatch] =
    useState("all");

  useEffect(() => {

    const q = query(

      collection(db, "bets"),

      orderBy("createdAt", "desc")

    );

    const unsubscribe =
      onSnapshot(q, (snapshot) => {

        const betsData: Bet[] = [];

        snapshot.forEach((doc) => {

          const data = doc.data();

          betsData.push({

            userName:
              data.userName,

            match:
              data.match,

            golsA:
              data.golsA,

            golsB:
              data.golsB,

            createdAt:
              data.createdAt

          });

        });

        setBets(betsData);

      });

    return () => unsubscribe();

  }, []);

  const matches =
    [...new Set(
      bets.map((bet) => bet.match)
    )];

  const filteredBets =

    selectedMatch === "all"

      ? bets

      : bets.filter(
          (bet) =>
            bet.match === selectedMatch
        );

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-4">

      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6">

          <h1 className="text-2xl font-black">
            🎯 Painel de Palpites
          </h1>

          <Link
            href="/admin"
            className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2 rounded-xl text-sm font-bold"
          >
            ← Dashboard
          </Link>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">

          <label className="block text-sm text-zinc-400 mb-2">

            Filtrar por jogo

          </label>

          <select
            value={selectedMatch}
            onChange={(e) =>
              setSelectedMatch(
                e.target.value
              )
            }
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          >

            <option value="all">
              Todos os jogos
            </option>

            {matches.map((match) => (

              <option
                key={match}
                value={match}
              >
                {match}
              </option>

            ))}

          </select>

        </div>

        <div className="space-y-3">

          {filteredBets.length === 0 && (

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center text-zinc-400">

              Nenhum palpite encontrado.

            </div>

          )}

          {filteredBets.map((bet, index) => (

            <div
              key={index}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center"
            >

              <div>

                <p className="font-black text-sm">
                  👤 {bet.userName}
                </p>

                <p className="text-zinc-400 text-sm mt-1">
                  ⚽ {bet.match}
                </p>

              </div>

              <div className="text-right">

                <p className="text-green-400 font-black text-lg">
                  {bet.golsA}
                  {" x "}
                  {bet.golsB}
                </p>

                {bet.createdAt && (

                  <p className="text-zinc-500 text-xs mt-1">

                    {new Date(
                      bet.createdAt.seconds * 1000
                    ).toLocaleString("pt-BR")}

                  </p>

                )}

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>

  );

}