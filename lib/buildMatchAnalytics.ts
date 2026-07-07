import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "./firebase";

export async function buildMatchAnalytics(
  matchName: string,
  resultadoA: number,
  resultadoB: number,
  groupId: string          // ← novo parâmetro
) {

  const betsQuery = query(
    collection(db, "bets"),
    where("match", "==", matchName),
    where("groupId", "==", groupId)  // ← filtrar por grupo
  );

  const betsSnapshot = await getDocs(betsQuery);

  let totalBets = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalHomeGoals = 0;
  let totalAwayGoals = 0;
  let exactScoreHits = 0;

  const allUserDistances: {
    username: string;
    distance: number;
    exactHit: number;
    palpite: string;
  }[] = [];

  const visionaryUsers: string[] = [];

  const realWinner =
    resultadoA > resultadoB ? "home" :
    resultadoA < resultadoB ? "away" : "draw";

  betsSnapshot.forEach((betDoc) => {
    const bet = betDoc.data();
    const apostaA = Number(bet.golsA);
    const apostaB = Number(bet.golsB);

    totalBets++;
    totalHomeGoals += apostaA;
    totalAwayGoals += apostaB;

    if (apostaA > apostaB) homeWins++;
    else if (apostaA < apostaB) awayWins++;
    else draws++;

    const isExact = apostaA === resultadoA && apostaB === resultadoB;
    if (isExact) exactScoreHits++;

    const distance =
      Math.abs(apostaA - resultadoA) + Math.abs(apostaB - resultadoB);

    const betWinner =
      apostaA > apostaB ? "home" :
      apostaA < apostaB ? "away" : "draw";

    // visionário: acertou o vencedor num jogo de surpresa
    if (betWinner === realWinner) {
      visionaryUsers.push(bet.username ?? bet.userName ?? bet.nome);
    }

    allUserDistances.push({
      username: bet.username ?? bet.userName ?? bet.nome,
      distance,
      exactHit: isExact ? 1 : 0,
      palpite: `${apostaA} x ${apostaB}`,
    });
  });

  if (totalBets === 0) return;

  const correctPredictionCount =
    realWinner === "home" ? homeWins :
    realWinner === "away" ? awayWins : draws;

  const surpriseIndex =
    100 - Math.round((correctPredictionCount / totalBets) * 100);

  const homePercent = Math.round((homeWins / totalBets) * 100);
  const drawPercent = Math.round((draws / totalBets) * 100);
  const awayPercent = Math.round((awayWins / totalBets) * 100);

  // ID único por grupo + jogo
  const docId = `${matchName}___${groupId}`;

  await setDoc(doc(db, "analytics_matches", docId), {
    match: matchName,
    groupId,                          // ← salvar groupId
    totalBets,
    resultadoA,                       // ← salvar resultado real
    resultadoB,
    realWinner,                       // ← salvar vencedor real
    homePercent,
    drawPercent,
    awayPercent,
    avgHomeGoals: totalHomeGoals / totalBets,
    avgAwayGoals: totalAwayGoals / totalBets,
    exactScoreHits,
    surpriseIndex,
    allUserDistances,                 // ← salvar distâncias por usuário
    visionaryUsers,                   // ← salvar visionários
    updatedAt: serverTimestamp(),     // ← updatedAt em vez de createdAt
  });
}