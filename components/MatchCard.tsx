"use client";

import { calculatePoints }
from "../lib/calculatePoints";

import {
  useEffect,
  useState
} from "react";

import {
  db,
  auth
} from "../lib/firebase";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

type Props = {
  teamA: string;
  teamB: string;

  emojiA: string;
  emojiB: string;

  resultadoA?: number;
  resultadoB?: number;

  matchDate: string;
};

export default function MatchCard({

  teamA,
  teamB,

  emojiA,
  emojiB,

  resultadoA,
  resultadoB,

  matchDate

}: Props) {

  const [golsA, setGolsA] =
    useState("");

  const [golsB, setGolsB] =
    useState("");

  const [salvo, setSalvo] =
    useState(false);

  const [points, setPoints] =
    useState(0);

    const [alreadyBet, setAlreadyBet] =
    useState(false);

    const currentTime =
    new Date();

 

  async function salvarPalpite() {

    const userName =
      auth.currentUser?.displayName;
    const user =
      auth.currentUser;

    if (!userName) {

      alert(
        "Faça login primeiro 😄"
      );
      return;
    }

    if (!user) {

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
    
    if (
      !userSnap.exists()
    ) {
    
      alert(
        "Usuário sem grupo 😥"
      );
    
      return;
    
    }
    
    const userData =
      userSnap.data();
    
      const groupId =
      userData.activeGroupId ||
      userData.groupId;

    const calculatedPoints =

      resultadoA !== undefined &&
      resultadoB !== undefined

        ? calculatePoints({

            apostaA:
              Number(golsA),

            apostaB:
              Number(golsB),

            resultadoA,

            resultadoB

          })

        : 0;

        const betId =
        `${groupId}-${userName}-${teamA}-${teamB}`;

    await setDoc(
      doc(db, "bets", betId),
      {

        userName,

        match:
          `${teamA} x ${teamB}`,

        golsA,
        golsB,

        points:
          calculatedPoints,

        createdAt:
          serverTimestamp(),
          groupId 

      }
    );

    setPoints(calculatedPoints);
    setAlreadyBet(true);
    window.dispatchEvent(
      new Event("betSaved")
    );

    setSalvo(true);

    setGolsA("");
    setGolsB("");

    setTimeout(() => {

      setSalvo(false);

    }, 2000);

  }

 

  useEffect(() => {

    async function carregarAposta() {
  
      const userName =
        auth.currentUser?.displayName;
  
      if (!userName) {
        return;
      }
  
      const user =
      auth.currentUser;
    
    if (!user) {
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
    
    if (
      !userSnap.exists()
    ) {
      return;
    }
    
    const groupId =
  userSnap.data().activeGroupId ||
  userSnap.data().groupId;
    
    const betId =
      `${groupId}-${userName}-${teamA}-${teamB}`;
  
      const betRef =
        doc(db, "bets", betId);
  
      const snapshot =
        await getDoc(betRef);
  
      if (snapshot.exists()) {
  
        const data =
          snapshot.data();
  
        setGolsA(data.golsA);
        setGolsB(data.golsB);
  
        setAlreadyBet(true);
  
      }
  
    }
  
    carregarAposta();
  
  }, [teamA, teamB]);
  const gameDate =
    new Date(matchDate);

  const now =
    currentTime;

  const difference =
    gameDate.getTime() -
    now.getTime();

  const oneHour =
    1000 * 60 * 60;

  const isLocked =
    difference <= oneHour;

  const isEndingSoon =

    difference > oneHour &&
    difference <= oneHour * 3;

  function getRemainingTime() {

    if (isLocked) {

      return "🔒 Apostas encerradas";
    
    }

    const totalMinutes =

      Math.floor(
        difference / 1000 / 60
      );

    const hours =

      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    if (hours > 0) {

      return `⏰ Fecha em ${hours}h ${minutes}min`;

    }

    return `⏰ Fecha em ${minutes} min`;

  }

  return (

    <div
      className={`rounded-xl p-3 transition border ${
        isLocked
          ? "bg-red-950 border-red-700"
          : isEndingSoon
          ? "bg-zinc-800 border-zinc-500"
          : "bg-blue-950 border-blue-700"
      }`}
    >

      <div className="flex items-center justify-between">

        <div className="text-center w-20">

          <p className="text-2xl mb-1">
            {emojiA}
          </p>

          <p className="font-bold text-sm">
            {teamA}
          </p>

        </div>

        <div className="flex items-center gap-2">

          <input
            type="number"
            min={0}
            max={20}
            value={golsA}
            onChange={(e) =>
              setGolsA(
                e.target.value
              )
            }
            className="w-12 h-12 bg-zinc-950 rounded-lg text-center text-xl"
            disabled={
              isLocked || alreadyBet
            }
          />

          <span className="text-zinc-500 text-lg">
            x
          </span>

          <input
            type="number"
            min={0}
            max={20}
            value={golsB}
            onChange={(e) =>
              setGolsB(
                e.target.value
              )
            }
            className="w-12 h-12 bg-zinc-950 rounded-lg text-center text-xl"
            disabled={
              isLocked || alreadyBet
            }
          />

        </div>

        <div className="text-center w-20">

          <p className="text-2xl mb-1">
            {emojiB}
          </p>

          <p className="font-bold text-sm">
            {teamB}
          </p>

        </div>

      </div>

      <div className="mt-3 flex justify-between items-center">

        <span className="text-zinc-400 text-xs">
          {getRemainingTime()}
        </span>

        {alreadyBet && (

<button
  onClick={() =>
    setAlreadyBet(false)
  }
  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 py-2 rounded-lg text-sm"
  disabled={isLocked}
>
  Alterar
</button>

)}

{!alreadyBet && !salvo && (

<button
  onClick={salvarPalpite}
  className={`px-3 py-2 rounded-lg font-bold text-sm transition ${
    isLocked
      ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
      : "bg-green-500 hover:bg-green-600 text-black"
  }`}
  disabled={isLocked}
>
  Salvar
</button>

)}

      </div>

      {salvo && (

        <div className="mt-3 bg-green-500 text-black font-bold p-2 rounded-lg text-center text-sm animate-pulse">

          ✅ Palpite salvo!

        </div>

      )}

      {resultadoA !== undefined &&
       resultadoB !== undefined && (

        <div className="mt-3 pt-3 border-t border-zinc-700">

          <div className="flex justify-between items-center">

            <p className="text-zinc-400 text-xs">
              Resultado oficial
            </p>

            <p className="font-bold text-sm">
              {resultadoA}
              {" x "}
              {resultadoB}
            </p>

          </div>

          {points > 0 && (

            <div className="mt-3 bg-green-500 text-black font-bold rounded-lg p-2 text-center text-sm">

              ⭐ Você ganhou {points} pontos!

            </div>

          )}

        </div>

      )}

    </div>

  );

}