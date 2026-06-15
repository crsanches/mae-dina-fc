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
    resultadoB: number
  ) {
  
    const betsQuery = query(
      collection(db, "bets"),
      where("match", "==", matchName)
    );
  
    const betsSnapshot =
      await getDocs(betsQuery);
  
    let totalBets = 0;
  
    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
  
    let totalHomeGoals = 0;
    let totalAwayGoals = 0;
  
    let exactScoreHits = 0;
  
    betsSnapshot.forEach((betDoc) => {
  
      const bet = betDoc.data();
  
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
  
    const resultadoHome =
      resultadoA > resultadoB;
  
    const resultadoAway =
      resultadoA < resultadoB;
  
    const resultadoDraw =
      resultadoA === resultadoB;
  
    if (resultadoHome) {
      correctPredictionCount =
        homeWins;
    }
  
    if (resultadoAway) {
      correctPredictionCount =
        awayWins;
    }
  
    if (resultadoDraw) {
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
  
    await setDoc(
      doc(
        db,
        "analytics_matches",
        matchName
      ),
      {
        match: matchName,
  
        totalBets,
  
        winnerPredictions: {
          home: homeWins,
          draw: draws,
          away: awayWins,
        },
  
        avgHomeGoals:
          totalHomeGoals /
          totalBets,
  
        avgAwayGoals:
          totalAwayGoals /
          totalBets,
  
        exactScoreHits,
  
        surpriseIndex,
  
        createdAt:
          serverTimestamp(),
      }
    );
  }