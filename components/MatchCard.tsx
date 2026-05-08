"use client";
import { calculatePoints } from "../lib/calculatePoints";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";

import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

type Props = {
  teamA: string;
  teamB: string;
  emojiA: string;
  emojiB: string;
  resultadoA: number;
  resultadoB: number;
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

  // useStates: 
  const [golsA, setGolsA] = useState("");
  const [golsB, setGolsB] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [points, setPoints] = useState(0);
  const storageKey = `${teamA}-${teamB}`;
  const [currentTime, setCurrentTime] =
  useState(new Date());
  
  

  async function salvarPalpite() {
    const user =
    localStorage.getItem("mae-dina-user");

     if (!user) {
     alert("Digite seu nome antes 😄");
    return; 
    }


    const calculatedPoints = calculatePoints({
      apostaA: Number(golsA),
      apostaB: Number(golsB),
      resultadoA,
      resultadoB
    });


    await addDoc(collection(db, "bets"), {

      userName:
        localStorage.getItem("mae-dina-user"),
    
      match:
        `${teamA} x ${teamB}`,
    
      golsA,
      golsB,
    
      points,
    
      createdAt:
        serverTimestamp()
    
    });
    setPoints(calculatedPoints);
    window.dispatchEvent(
      new Event("betSaved")
    );

    setSalvo(true);
  
    setTimeout(() => {
      setSalvo(false);
    }, 2000);
  
  }
  useEffect(() => {

    const timeout = setTimeout(() => {
  
      const savedBet =
        localStorage.getItem(storageKey);
  
      if (savedBet) {
  
        try {
  
          const parsedBet =
            JSON.parse(savedBet);
  
          setGolsA(parsedBet.golsA);
          setGolsB(parsedBet.golsB);
          setPoints(parsedBet.points || 0);
  
        } catch {
  
          console.error(
            "Erro ao carregar aposta"
          );
  
        }
  
      }
  
    }, 0);
  
    return () => clearTimeout(timeout);
  
  }, [storageKey]);

useEffect(() => {

  const interval = setInterval(() => {

    setCurrentTime(new Date());

  }, 60000);

  return () => clearInterval(interval);

}, []);



const gameDate = new Date(matchDate);

const now = currentTime;

const difference =
  gameDate.getTime() - now.getTime();

const oneHour = 1000 * 60 * 60;

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
      Math.floor(difference / 1000 / 60);
  
    const hours =
      Math.floor(totalMinutes / 60);
  
    const minutes =
      totalMinutes % 60;
  
    if (hours > 0) {
      return `⏰ Fecha em ${hours}h ${minutes}min`;
    }
  
    return `⏰ Fecha em ${minutes} min`;
  
  }






  return (
    <div
  className={`rounded-2xl p-4 transition border ${
    isLocked
      ? "bg-red-950 border-red-700"
      : isEndingSoon
      ? "bg-yellow-950 border-yellow-600"
      : "bg-zinc-800 border-zinc-700"
  }`}>

      <div className="flex items-center justify-between">

        <div className="text-center w-24">
          <p className="text-3xl mb-1">
            {emojiA}
          </p>

          <p className="font-bold">
            {teamA}
          </p>
        </div>

        <div className="flex items-center gap-3">

          <input
            type="number"
            min={0}
            max={20}
            value={golsA}
            onChange={(e) => setGolsA(e.target.value)}
            className="w-14 h-14 bg-zinc-950 rounded-xl text-center text-2xl"
            disabled={isLocked}
          />

          <span className="text-zinc-500 text-xl">
            x
          </span>

          <input
            type="number"
            min={0}
            max={20}
            value={golsB}
            onChange={(e) => setGolsB(e.target.value)}
            className="w-14 h-14 bg-zinc-950 rounded-xl text-center text-2xl"
            disabled={isLocked}
          />

        </div>

        <div className="text-center w-24">
          <p className="text-3xl mb-1">
            {emojiB}
          </p>

          <p className="font-bold">
            {teamB}
          </p>
        </div>

      </div>

      <div className="mt-4 flex justify-between items-center">

        <span className="text-zinc-400 text-sm">
        {getRemainingTime()}
        </span>

        <button
          onClick={salvarPalpite}
          className={`px-4 py-2 rounded-xl font-bold transition ${
            isLocked
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-black"
          }`}
          disabled={isLocked}
        >
          Salvar Palpite
        </button>

      </div>
      {salvo && (
        <div className="mt-4 bg-green-500 text-black font-bold p-3 rounded-xl text-center animate-pulse">
          ✅ Palpite salvo com sucesso!
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-zinc-700">

      <div className="flex justify-between items-center">

        <p className="text-zinc-400 text-sm">
          Resultado oficial
        </p>

        <p className="font-bold">
          {resultadoA} x {resultadoB}
        </p>

      </div>

      {points > 0 && (
        <div className="mt-3 bg-green-500 text-black font-bold rounded-xl p-2 text-center">
          ⭐ Você ganhou {points} pontos!
        </div>
      )}

      </div>
    </div>
  );
}