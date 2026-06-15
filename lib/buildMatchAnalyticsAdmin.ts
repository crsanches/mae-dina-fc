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

  const distances: {
    username: string;
    distance: number;
    palpite: string;
  }[] = [];

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

    const distance =

      Math.abs(
        apostaA - resultadoA
      ) +

      Math.abs(
        apostaB - resultadoB
      );

    distances.push({

      username:

        bet.username ||

        bet.userName ||

        bet.nome ||

        "Anônimo",

      distance,

      palpite:
        `${apostaA}x${apostaB}`

    });

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

  const homePercent =
    Math.round(
      (homeWins / totalBets) * 100
    );

  const drawPercent =
    Math.round(
      (draws / totalBets) * 100
    );

  const awayPercent =
    Math.round(
      (awayWins / totalBets) * 100
    );

  let realWinner = "draw";

  if (resultadoA > resultadoB) {
    realWinner = "home";
  }

  if (resultadoA < resultadoB) {
    realWinner = "away";
  }

  const closestUsers =

    distances

      .sort(
        (a, b) =>
          a.distance -
          b.distance
      )

      .slice(0, 5);

  const visionaryUsers: string[] =
    [];

  const lowConsensus =
    correctPredictionCount /
    totalBets <
    0.20;

  if (lowConsensus) {

    betsSnapshot.forEach((doc) => {

      const bet = doc.data();

      const apostaA =
        Number(bet.golsA);

      const apostaB =
        Number(bet.golsB);

      const acertou =

        (
          resultadoA >
            resultadoB &&
          apostaA >
            apostaB
        ) ||

        (
          resultadoA <
            resultadoB &&
          apostaA <
            apostaB
        ) ||

        (
          resultadoA ===
            resultadoB &&
          apostaA ===
            apostaB
        );

      if (acertou) {

        visionaryUsers.push(

          bet.username ||

          bet.userName ||

          bet.nome ||

          "Anônimo"

        );

      }

    });

  }

  await adminDb
    .collection(
      "analytics_matches"
    )
    .doc(matchName)
    .set({

      match: matchName,

      totalBets,

      resultadoA,

      resultadoB,

      realWinner,

      homePercent,

      drawPercent,

      awayPercent,

      winnerPredictions: {

        home: homeWins,

        draw: draws,

        away: awayWins

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

      closestUsers,

      visionaryUsers,

      updatedAt:
        new Date()

    });

}