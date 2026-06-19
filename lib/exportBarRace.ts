import {
    collection,
    getDocs,
    query,
    where,
  } from "firebase/firestore";
  
  import { db } from "./firebase";
  import { calculatePoints } from "./calculatePoints";
  import { obterPesoDaFase } from "./copas";
  
  type Game = {
    match: string;
    teamA: string;
    teamB: string;
    emojiA?: string;
    emojiB?: string;
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
  
  export async function exportBarRace(
    groupId: string
  ): Promise<string> {
  
    // =========================
    // BUSCA JOGOS
    // =========================
  
    const gamesSnapshot =
      await getDocs(
        collection(db, "games")
      );
  
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
    // BUSCA APOSTAS
    // =========================
  
    const betsQuery =
      query(
        collection(db, "bets"),
        where(
          "groupId",
          "==",
          groupId
        )
      );
  
    const betsSnapshot =
      await getDocs(betsQuery);
  
    // =========================
    // REMOVE DUPLICADAS
    // =========================
  
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
  
      const nome =
        bet.username ||
        bet.userName ||
        bet.nome ||
        "Anônimo";
  
      users.add(nome);
  
    });
  
    const sortedUsers =
      Array.from(users).sort();
  
    // =========================
    // ESTRUTURA CSV
    // =========================
  
    const headers = [
      "Nome",
      "Liga",
    ];
  
    games.forEach((game, index) => {
  
      headers.push(
        `J${String(index + 1).padStart(2, "0")} ${game.emojiA || ""} ${game.teamA} x ${game.emojiB || ""} ${game.teamB}`
      );
  
    });
  
    const rows:
      Record<string, Record<string, string | number>> = {};
  
    const acumulado:
      Record<string, number> = {};
  
    sortedUsers.forEach((user) => {
  
      acumulado[user] = 0;
  
      rows[user] = {
        Nome: user,
        Liga: "Sinergia",
      };
  
    });
  
    // =========================
    // PROCESSA JOGO A JOGO
    // =========================
  
    games.forEach((game, index) => {
  
      const coluna =
        headers[index + 2];
  
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
            (game.fase ||
              "Grupos") as any
          );
  
        acumulado[user] +=
          pontos * peso;
  
      });
  
      // fotografia do ranking
      sortedUsers.forEach((user) => {
  
        rows[user][coluna] =
          acumulado[user];
  
      });
  
    });
  
    // =========================
    // GERA CSV
    // =========================
  
    const csvRows = [
      headers.join(","),
    ];
  
    sortedUsers.forEach((user) => {
  
      const values =
        headers.map(
          (header) =>
            rows[user][header] ?? 0
        );
  
      csvRows.push(
        values.join(",")
      );
  
    });
  
    return csvRows.join("\n");
  
  }