"use client";

import {
  useEffect,
  useState,
  useCallback
} from "react";

import {
  query,
  where
} from "firebase/firestore";

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

import { getTorneioAtivo } from "../lib/getTorneioAtivo";
import { getConfigTorneio } from "../lib/torneios";

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

  const [
    torneioId,
    setTorneioId
  ] = useState<string | null>(null);

  const configTorneio = getConfigTorneio(torneioId);

  const carregar = useCallback(
    async () => {

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

    const currentGroupId =
      userData.activeGroupId;

    const possibleNames = [

      userData.nome,

      userData.username,

      userData.apelido,

      user.displayName

    ].filter(Boolean);

    const idTorneioAtivo =
      await getTorneioAtivo();

    setTorneioId(idTorneioAtivo);

    const betsSnapshot =
      await getDocs(

        query(

          collection(
            db,
            "bets"
          ),

          where(
            "groupId",
            "==",
            currentGroupId
          ),

          where(
            "torneioId",
            "==",
            idTorneioAtivo
          )

        )

      );

    let total = 0;

    const apostas: Bet[] = [];

    betsSnapshot.forEach(
      (betDoc) => {

        const bet =
          betDoc.data();

        const isOwner =
          bet.uid === user.uid ||
          possibleNames.includes(bet.userName) ||
          possibleNames.includes(bet.nome);

        if (isOwner) {

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

    const gamesSnapshot =
      await getDocs(
        query(
          collection(
            db,
            "games"
          ),
          where(
            "torneioId",
            "==",
            idTorneioAtivo
          )
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

  },
  []
  );



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

  // Só faz sentido calcular isso quando o torneio ativo tem fase de grupos
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

  // Usado quando o torneio ativo NÃO tem fase de grupos (ex: Copa do Brasil) —
  // mostra pendências por fase do mata-mata em vez de por grupo.
  const resumoFases =
    configTorneio.fasesMataMata.map((fase) => {

      const totalJogosFase =
        games.filter(
          (g) => g.fase === fase.id
        ).length;

      const apostasFase =
        apostasUsuario.filter(
          (bet) => {

            const game =
              games.find(
                (g) =>
                  `${g.teamA} x ${g.teamB}` ===
                  bet.match
              );

            return game?.fase === fase.id;

          }
        ).length;

      return {

        id: fase.id,
        label: fase.label,

        feitos: apostasFase,
        total: totalJogosFase,

        faltam: Math.max(
          0,
          totalJogosFase - apostasFase
        ),

      };

    });

    useEffect(() => {

      const atualizar = () => {

        carregar();

      };

      const timer = setTimeout(
        atualizar,
        0
      );

      window.addEventListener(
        "betSaved",
        atualizar
      );

      return () => {

        clearTimeout(timer);

        window.removeEventListener(
          "betSaved",
          atualizar
        );

      };

    }, [carregar]);

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

      {/* PENDÊNCIAS — por grupo (torneios com fase de grupos) ou por fase (mata-mata puro, ex: Copa do Brasil) */}

      <div className="mt-4">

        <p className="text-zinc-400 text-sm mb-2">
          {configTorneio.temGrupos
            ? "📋 Pendências por grupo"
            : "📋 Pendências por fase"}
        </p>

        <div className="flex flex-wrap gap-2">

          {configTorneio.temGrupos

            ? resumoGrupos.map(
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
              )

            : resumoFases.map(
                (f) => (

                  <div
                    key={f.id}
                    className="bg-zinc-800 rounded-xl px-3 py-2 text-sm"
                  >

                    {f.label}
                    {" "}

                    {f.total === 0

                      ? "—"

                      : f.faltam === 0

                        ? "✅"

                        : `(${f.faltam})`}

                  </div>

                )
              )}

        </div>

      </div>

    </div>

  );

}