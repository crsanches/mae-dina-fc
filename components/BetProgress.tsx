"use client";

import {
  useEffect,
  useState
} from "react";

import {
  auth,
  db
} from "../lib/firebase";

import {
  collection,
  doc,
  getDoc,
  getDocs
} from "firebase/firestore";

type Props = {
  totalJogos: number;
};

type Bet = {
  match: string;
};

type Game = {
  teamA: string;
  teamB: string;
  grupo?: string;
  fase?: string;
};

export default function BetProgress({
  totalJogos
}: Props) {

  const [
    totalApostados,
    setTotalApostados
  ] = useState(0);

  const [
    apostasUsuario,
    setApostasUsuario
  ] = useState<Bet[]>([]);

  const [
    games,
    setGames
  ] = useState<Game[]>([]);

  useEffect(() => {

    async function carregar() {

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

      if (!userSnap.exists()) {
        return;
      }

      const userData =
        userSnap.data();

      const possibleNames = [

        userData.nome,

        userData.username,

        userData.apelido,

        user.displayName

      ].filter(Boolean);

      // =========================
      // BETS
      // =========================

      const betsSnapshot =
        await getDocs(
          collection(
            db,
            "bets"
          )
        );

      let total = 0;

      const apostas: Bet[] = [];

      betsSnapshot.forEach(
        (betDoc) => {

          const bet =
            betDoc.data();

          const nome =

            bet.username ||

            bet.userName ||

            bet.nome;

          if (
            possibleNames.includes(
              nome
            )
          ) {

            total++;

            apostas.push({
              match:
                bet.match
            });

          }

        }
      );

      setTotalApostados(
        total
      );

      setApostasUsuario(
        apostas
      );

      // =========================
      // GAMES
      // =========================

      const gamesSnapshot =
        await getDocs(
          collection(
            db,
            "games"
          )
        );

      const loadedGames:
        Game[] = [];

      gamesSnapshot.forEach(
        (gameDoc) => {

          const game =
            gameDoc.data();

          loadedGames.push({

            teamA:
              game.teamA,

            teamB:
              game.teamB,

            grupo:
              game.grupo,

            fase:
              game.fase

          });

        }
      );

      setGames(
        loadedGames
      );

    }

    carregar();

  }, []);

  const faltam =
    Math.max(
      0,
      totalJogos -
      totalApostados
    );

  const percentual =

    totalJogos === 0

      ? 0

      : Math.round(
          (
            totalApostados /
            totalJogos
          ) * 100
        );

  const grupos = [
    "A","B","C","D","E","F",
    "G","H","I","J","K","L"
  ];

  const resumoGrupos =
    grupos.map((grupo) => {

      const totalJogosGrupo =
        games.filter(
          (g) =>

            g.fase ===
              "Grupos" &&

            g.grupo ===
              grupo
        ).length;

      const apostasGrupo =
        apostasUsuario.filter(
          (bet) => {

            const game =
              games.find(
                (g) =>

                  `${g.teamA} x ${g.teamB}` ===
                  bet.match
              );

            return (
              game?.grupo ===
              grupo
            );

          }
        ).length;

      return {

        grupo,

        feitos:
          apostasGrupo,

        total:
          totalJogosGrupo,

        faltam:
          Math.max(
            0,
            totalJogosGrupo -
            apostasGrupo
          )

      };

    });

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-zinc-400 text-sm">
            Progresso dos palpites
          </p>

          <p className="font-black text-lg">

            {totalApostados}
            {" / "}
            {totalJogos}
            {" jogos"}

          </p>

        </div>

        <div>

          {faltam === 0 ? (

            <span className="text-green-400 font-black">
              ✅ Completo
            </span>

          ) : (

            <span className="text-yellow-400 font-black">
              ⚠️ Faltam {faltam}
            </span>

          )}

        </div>

      </div>

      <div className="mt-3 h-3 bg-zinc-800 rounded-full overflow-hidden">

        <div
          className="h-full bg-green-500 transition-all"
          style={{
            width: `${percentual}%`
          }}
        />

      </div>

      <div className="mt-4">

        <p className="text-zinc-400 text-sm mb-2">
          📋 Pendências por grupo
        </p>

        <div className="flex flex-wrap gap-2">

          {resumoGrupos.map(
            (g) => (

              <div
                key={g.grupo}
                className="bg-zinc-800 rounded-xl px-3 py-2 text-sm"
              >

                Grupo {g.grupo}
                {" "}

                {g.faltam === 0

                  ? "✅"

                  : `(${g.faltam})`}

              </div>

            )
          )}

        </div>

      </div>

    </div>

  );

}