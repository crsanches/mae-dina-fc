import { adminDb } from "@/lib/firebaseAdmin";
import { calculatePoints } from "@/lib/calculatePoints";

export async function buildMatchAnalyticsAdmin(
  matchName: string,
  resultadoA: number,
  resultadoB: number,
  groupId: string,
  torneioId: string,        // ← novo parâmetro, obrigatório
  matchDate?: string,
  fase?: string,
  grupo?: string
) {

  const betsSnapshot = await adminDb
    .collection("bets")
    .where("match", "==", matchName)
    .where("groupId", "==", groupId)
    .where("torneioId", "==", torneioId)
    .get();

  let totalBets = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalHomeGoals = 0;
  let totalAwayGoals = 0;
  let exactScoreHits = 0;

  const distances: {
    username: string;
    distance: number;
    palpite: string;
    points: number;
    drawHit: boolean;
    winnerHit: boolean;
  }[] = [];

  betsSnapshot.forEach((doc) => {
    const bet = doc.data();
    const apostaA = Number(bet.golsA);
    const apostaB = Number(bet.golsB);

    totalBets++;
    totalHomeGoals += apostaA;
    totalAwayGoals += apostaB;

    if (apostaA > apostaB) homeWins++;
    else if (apostaA < apostaB) awayWins++;
    else draws++;

    if (apostaA === resultadoA && apostaB === resultadoB) exactScoreHits++;

    const distance =
      Math.abs(apostaA - resultadoA) +
      Math.abs(apostaB - resultadoB);

      const points = calculatePoints({
        apostaA,
        apostaB,
        resultadoA,
        resultadoB,
      });

      const drawHit =
        apostaA === apostaB &&
        resultadoA === resultadoB;

      const winnerHit =
        points === 3;

      distances.push({
        username: bet.username || bet.userName || bet.nome || "Anônimo",
        distance,
        palpite: `${apostaA}x${apostaB}`,
        points,
        drawHit,
        winnerHit,
      });
    });
  if (totalBets === 0) return;

  let correctPredictionCount = 0;
  if (resultadoA > resultadoB) correctPredictionCount = homeWins;
  if (resultadoA < resultadoB) correctPredictionCount = awayWins;
  if (resultadoA === resultadoB) correctPredictionCount = draws;

  const surpriseIndex = 100 - Math.round((correctPredictionCount / totalBets) * 100);
  const homePercent = Math.round((homeWins / totalBets) * 100);
  const drawPercent = Math.round((draws / totalBets) * 100);
  const awayPercent = Math.round((awayWins / totalBets) * 100);

  let realWinner = "draw";
  if (resultadoA > resultadoB) realWinner = "home";
  if (resultadoA < resultadoB) realWinner = "away";

  // Top 5 mais próximos
  const closestUsers = [...distances]
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  // Todos os usuários com flag de acerto exato (para o Profeta)
  const allUserDistances = distances.map((d) => ({
    username: d.username,
    palpite: d.palpite,
    distance: d.distance,

    exactHit: d.distance === 0 ? 1 : 0,

    points: d.points,

    drawHit: d.drawHit ? 1 : 0,

    winnerHit: d.winnerHit ? 1 : 0,
  }));

  // Visionários (acertaram o vencedor quando menos de 20% acertou)
  const visionaryUsers: string[] = [];
  const lowConsensus = correctPredictionCount / totalBets < 0.20;

  if (lowConsensus) {
    betsSnapshot.forEach((doc) => {
      const bet = doc.data();
      const apostaA = Number(bet.golsA);
      const apostaB = Number(bet.golsB);
      const acertou =
        (resultadoA > resultadoB && apostaA > apostaB) ||
        (resultadoA < resultadoB && apostaA < apostaB) ||
        (resultadoA === resultadoB && apostaA === apostaB);
      if (acertou) {
        visionaryUsers.push(bet.username || bet.userName || bet.nome || "Anônimo");
      }
    });
  }

  // Chave única por jogo + grupo + torneio
  const docId = `${matchName}___${groupId}___${torneioId}`;

  await adminDb.collection("analytics_matches").doc(docId).set({
    match: matchName,
    groupId,
    torneioId,
    totalBets,
    resultadoA,
    resultadoB,
    realWinner,
    homePercent,
    drawPercent,
    awayPercent,
    winnerPredictions: { home: homeWins, draw: draws, away: awayWins },
    avgHomeGoals: Number((totalHomeGoals / totalBets).toFixed(2)),
    avgAwayGoals: Number((totalAwayGoals / totalBets).toFixed(2)),
    exactScoreHits,
    surpriseIndex,
    closestUsers,
    allUserDistances,
    visionaryUsers,
    updatedAt: new Date(),
    matchDate: matchDate || null,
    fase: fase || null,
    grupo: grupo || null,
  });
}