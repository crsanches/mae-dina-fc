import { adminDb }
from "@/lib/firebaseAdmin";

export async function buildMatchAnalyticsAdmin(
  matchName: string,
  resultadoA: number,
  resultadoB: number
) {

  const betsSnapshot =
    await adminDb
      .collection("bets")
      .where("match", "==", matchName)
      .get();

  let totalBets = 0;

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  let totalHomeGoals = 0;
  let totalAwayGoals = 0;

  let exactScoreHits = 0;

  betsSnapshot.forEach((doc) => {

    const bet = doc.data();

    const apostaA =
      Number(bet.golsA);

    const apostaB =
      Number(bet.golsB);

    totalBets++;

    totalHomeGoals += apostaA;
    totalAwayGoals += apostaB;

    if (apostaA > apostaB) {
      homeWins++;
    } else if (apostaA < apostaB) {
      awayWins++;
    } else {
      draws++;
    }

    if (
      apostaA === resultadoA &&
      apostaB === resultadoB
    ) {
      exactScoreHits++;
    }
  });

  if (totalBets === 0) {
    return;
  }

  let correctPredictionCount = 0;

  if (resultadoA > resultadoB) {
    correctPredictionCount =
      homeWins;
  }

  if (resultadoA < resultadoB) {
    correctPredictionCount =
      awayWins;
  }

  if (resultadoA === resultadoB) {
    correctPredictionCount =
      draws;
  }

  const surpriseIndex =
    100 -
    Math.round(
      (correctPredictionCount /
        totalBets) *
        100
    );

  await adminDb
    .collection(
      "analytics_matches"
    )
    .doc(matchName)
    .set({

      match: matchName,

      totalBets,

      winnerPredictions: {
        home: homeWins,
        draw: draws,
        away: awayWins,
      },

      avgHomeGoals:
        Number(
          (
            totalHomeGoals /
            totalBets
          ).toFixed(2)
        ),

      avgAwayGoals:
        Number(
          (
            totalAwayGoals /
            totalBets
          ).toFixed(2)
        ),

      exactScoreHits,

      surpriseIndex,

      resultadoA,
      resultadoB,

      updatedAt:
        new Date()

    });

}