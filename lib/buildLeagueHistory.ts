import { adminDb } from "@/lib/firebaseAdmin";
import { getTorneioAtivoAdmin } from "@/lib/getTorneioAtivoAdmin";
import { getTorneiosAtivosAdmin } from "@/lib/getTorneiosAtivosAdmin";
import { calculatePoints } from "./calculatePoints";
import { obterPesoDaFase } from "./copas";

type Game = {
  match?: string;
  teamA: string;
  teamB: string;
  matchDate: string;
  fase?: string;
  finished?: boolean;
  resultadoA?: number;
  resultadoB?: number;
};

type Bet = {
  uid?: string;
  username?: string;
  userName?: string;
  nome?: string;
  match: string;
  golsA: string;
  golsB: string;
  createdAt?: {
    seconds: number;
  };
};

export async function buildLeagueHistory(
  groupId: string,
  torneioId: string 
) {

  // =========================
  // TORNEIO ATIVO
  // =========================

 


  // =========================
  // JOGOS ENCERRADOS
  // =========================

  const gamesSnapshot =
    await adminDb
      .collection("games")
      .where("torneioId", "==", torneioId)
      .get();

  const games: Game[] = [];

  gamesSnapshot.forEach((doc) => {

    const game =
      doc.data() as Game;

    if (
      game.finished &&
      game.resultadoA != null &&
      game.resultadoB != null
    ) {

      games.push(game);

    }

  });

  games.sort(
    (a, b) =>
      new Date(a.matchDate).getTime() -
      new Date(b.matchDate).getTime()
  );

  // =========================
  // APOSTAS DA LIGA
  // =========================

  const betsSnapshot =
    await adminDb
      .collection("bets")
      .where("groupId", "==", groupId)
      .where("torneioId", "==", torneioId)
      .get();

  const latestBets:
    Record<string, Bet> = {};

  betsSnapshot.forEach((doc) => {

    const bet =
      doc.data() as Bet;

    const key =
      `${bet.uid || bet.userName}__${bet.match}`;

    const current =
      latestBets[key];

    const currentTime =
      current?.createdAt?.seconds || 0;

    const newTime =
      bet.createdAt?.seconds || 0;

    if (
      !current ||
      newTime > currentTime
    ) {

      latestBets[key] = bet;

    }

  });

  const bets =
    Object.values(latestBets);

  // =========================
  // USUÁRIOS
  // =========================

  const users =
    new Set<string>();

  bets.forEach((bet) => {

    const user =
      bet.username ||
      bet.userName ||
      bet.nome ||
      "Anônimo";

    users.add(user);

  });

  const acumulado:
    Record<string, number> = {};

  Array.from(users).forEach((user) => {

    acumulado[user] = 0;

  });

  // =========================
  // FRAMES
  // =========================

  const frames = [];

  for (let i = 0; i < games.length; i++) {

    const game =
      games[i];

    const apostasDoJogo =
      bets.filter(
        (bet) =>
          bet.match === game.match
      );

    apostasDoJogo.forEach((bet) => {

      const user =
        bet.username ||
        bet.userName ||
        bet.nome ||
        "Anônimo";

      const pontos =
        calculatePoints({

          apostaA:
            Number(bet.golsA),

          apostaB:
            Number(bet.golsB),

          resultadoA:
            Number(game.resultadoA),

          resultadoB:
            Number(game.resultadoB),

        });

      const peso =
        obterPesoDaFase(
          (game.fase || "Grupos") as never
        );

      acumulado[user] +=
        pontos * peso;

    });

    const ranking =
      Object.entries(acumulado)

        .map(
          ([username, points]) => ({
            username,
            points,
          })
        )

        .sort(
          (a, b) =>
            b.points - a.points
        )

        .map(
          (item, index) => ({
            ...item,
            position:
              index + 1,
          })
        );

    frames.push({

      step: i + 1,

      match:
        game.match ||
        `${game.teamA} x ${game.teamB}`,

      ranking,

    });

  }

  // =========================
  // GRAVA NO DOC COMPOSTO
  // groupId_torneioId — não usa mais só groupId,
  // pra cada torneio ter seu próprio histórico.
  // =========================

  const leagueHistoryDocId =
    `${groupId}_${torneioId}`;

  await adminDb
    .collection("leagueHistory")
    .doc(leagueHistoryDocId)
    .set({

      groupId,

      torneioId,

      updatedAt:
        new Date(),

      version: 3,

      totalGames:
        games.length,

      totalPlayers:
        users.size,

      frames,

    });

}