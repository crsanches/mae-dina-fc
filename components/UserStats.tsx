"use client";

import {
  useEffect,
  useState
} from "react";

import {
  collection,
  doc,
  getDoc,
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

type UserData = {

  position: number;

  points: number;

};

type BetHistory = {

  jogo: string;

  aposta: string;

  resultado: string;

  pontos: number;

};

export default function UserStats() {

  const [expandido, setExpandido] =
    useState(false);

  const [data, setData] =
    useState<UserData>({
      position: 0,
      points: 0
    });

  const [betHistory, setBetHistory] =
    useState<BetHistory[]>([]);

  // =========================
  // LOAD STATS
  // =========================

  async function carregarStats() {

    try {

      const firebaseUser =
        auth.currentUser;

      if (!firebaseUser) {
        return;
      }

      // =========================
      // USER
      // =========================

      const userRef =
        doc(
          db,
          "users",
          firebaseUser.uid
        );

      const userSnap =
        await getDoc(userRef);

      if (!userSnap.exists()) {
        return;
      }

      const userData =
        userSnap.data();

      const currentGroupId =
        userData.activeGroupId;

        const currentUsername =

          userData.apelido ||

          userData.username ||

          userData.nome ||

          firebaseUser.displayName ||

          "";

      // =========================
      // RANKING OFICIAL
      // =========================

      const ranking =
        await buildRanking(
          currentGroupId
        );


        const possibleNames = [

          userData.nome,
        
          userData.username,
        
          userData.apelido,
        
          firebaseUser.displayName
        
        ].filter(Boolean);
        
      

      // =========================
      // LOCALIZA USUÁRIO
      // =========================

      const currentUserData =
        ranking.find((u) =>

          possibleNames.includes(
            u.username
          ) ||

          possibleNames.includes(
            u.nome
          )
        );

    
      // =========================
      // NÃO ENCONTROU
      // =========================

      if (!currentUserData) {

        setData({

          position: 0,

          points: 0

        });

        setBetHistory([]);

        return;

      }

      // =========================
      // POSIÇÃO
      // =========================

      const position =

      ranking.findIndex((u) =>

      possibleNames.includes(
        u.username
      ) ||
  
      possibleNames.includes(
        u.nome
      )
  
    ) + 1;

     

      // =========================
      // HISTORY
      // =========================

      const history =

        currentUserData.jogos.map(
          (jogo) => ({

            jogo:
              jogo.jogo,

            aposta:
              jogo.palpite,

            resultado:
              jogo.resultado,

            pontos:
              jogo.total

          })
        );

      // =========================
      // SET STATE
      // =========================

      setBetHistory(history);

      setData({

        position,

        points:
          currentUserData.points

      });

    } catch (error) {

      console.error(
        "Erro ao carregar stats:",
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

            setData({

              position: 0,

              points: 0

            });

            setBetHistory([]);

            return;

          }

          unsubscribeBets =
            onSnapshot(

              collection(
                db,
                "bets"
              ),

              () => {

                carregarStats();

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
  // RENDER
  // =========================

  return (

    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">

      <h2 className="text-xl font-black mb-4">
        💀 Sua Situação
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-zinc-800 rounded-2xl p-4 text-center">

          <p className="text-zinc-400 text-sm">
            Posição
          </p>

          <p className="text-3xl font-black text-yellow-400">
            #{data.position || "-"}
          </p>

        </div>

        <div className="bg-zinc-800 rounded-2xl p-4 text-center">

          <p className="text-zinc-400 text-sm">
            Pontos
          </p>

          <p className="text-3xl font-black text-green-400">
            {data.points}
          </p>

        </div>

      </div>

      <div className="mt-6">

        <button
          onClick={() =>
            setExpandido(!expandido)
          }
          className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 transition rounded-2xl p-4 mb-3"
        >

          <div className="text-left">

            <h3 className="text-lg font-black">
              🎯 Seus Palpites
            </h3>

            <p className="text-zinc-400 text-sm">
              {betHistory.length} apostas registradas
            </p>

          </div>

          <div className="text-2xl">

            {expandido
              ? "🔮 Fechar previsões"
              : "🔮 Ver minhas tragédias"}

          </div>

        </button>

        {expandido && (

          <div className="space-y-3">

            {betHistory.length === 0 && (

              <p className="text-zinc-400 text-sm">
                Nenhum palpite registrado.
              </p>

            )}

            {betHistory.map((bet, index) => (

              <div
                key={index}
                className="bg-zinc-800 rounded-2xl p-4 border border-zinc-700"
              >

                <div className="flex justify-between items-start gap-4">

                  <div>

                    <p className="font-bold text-sm mb-2">
                      ⚽ {bet.jogo}
                    </p>

                    <div className="text-xs text-zinc-400 space-y-1">

                      <p>
                        🎯 Seu palpite:
                        <span className="text-white font-bold ml-1">
                          {bet.aposta}
                        </span>
                      </p>

                      <p>
                        🏁 Resultado oficial:
                        <span className="text-white font-bold ml-1">
                          {bet.resultado}
                        </span>
                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="text-yellow-400 font-black text-lg">
                      ⭐ {bet.pontos}
                    </p>

                    <p className="text-zinc-500 text-xs">
                      pontos
                    </p>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>

  );

}