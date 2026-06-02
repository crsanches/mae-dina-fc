import { NextResponse } from "next/server";
//import { db } from "@/lib/firebase";
import { adminDb } from "@/lib/firebaseAdmin";


import { calculatePoints }
from "@/lib/calculatePoints";

function normalize(text?: string) {

  if (!text) return "";

  let value = text

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .toLowerCase()

    .replace(/-/g, " ")

    .replace(/\bec\b/g, "")

    .replace(/\s+/g, " ")

    .trim();

  if (value === "athletico paranaense") {
    value = "athletico pr";
  }

  if (value === "atletico mineiro") {
    value = "atletico mg";
  }

  if (value === "vasco da gama") {
    value = "vasco";
  }

  if (value === "ec vitoria") {
    value = "vitoria";
  }

  return value;

}

export async function GET() {
 
  try {

    const response = await fetch(
      "https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4351"
     
    );
    

    const data = await response.json();
   

    const hoje = new Date();

    const recentGames = (data.events || []).filter(
      (game: { dateEvent: string }) => {
    
        const gameDate =
          new Date(game.dateEvent);
    
        const diffDays =
          Math.abs(
            hoje.getTime() -
            gameDate.getTime()
          ) / (1000 * 60 * 60 * 24);
    
        return diffDays <= 7;
    
      }
    );



    const gamesSnapshot =
    await adminDb
      .collection("games")
      .get();

  
      
      gamesSnapshot.docs.forEach((doc) => {
      
      
      
      });

      for (const apiGame of recentGames) {

    

      if (
        apiGame.strLeague !==
        "Brazilian Serie A"
      ) continue;
    
      


          
          const localGame = gamesSnapshot.docs.find((g) => {

            const game = g.data();
          
            const firebaseA =
              normalize(game.teamA);
          
            const firebaseB =
              normalize(game.teamB);
          
            const apiHome =
              normalize(apiGame.strHomeTeam);
          
            const apiAway =
              normalize(apiGame.strAwayTeam);
          
          
            const directMatch =
              firebaseA === apiHome &&
              firebaseB === apiAway;
          
            const invertedMatch =
              firebaseA === apiAway &&
              firebaseB === apiHome;
          
            return directMatch || invertedMatch;
          
          });

          if (localGame !== undefined) {

          
          
          } else {
          
          
          
          }

          if (localGame === undefined) continue;
   
      if (apiGame.strStatus === "FT") {

        await adminDb
  .collection("games")
  .doc(localGame.id)
  .update({

    
            resultadoA:
              Number(apiGame.intHomeScore),

            resultadoB:
              Number(apiGame.intAwayScore),

            finished: true

          }

        );

      // 🔥 RECALCULAR APOSTAS

const betsSnapshot =
await adminDb
  .collection("bets")
  .where(
    "match",
    "==",
    `${localGame.data().teamA} x ${localGame.data().teamB}`
  )
  .get();

for (const betDoc of betsSnapshot.docs) {

const bet = betDoc.data();

const points =
  calculatePoints({

    apostaA:
      Number(bet.golsA),

    apostaB:
      Number(bet.golsB),

    resultadoA:
      Number(apiGame.intHomeScore),

    resultadoB:
      Number(apiGame.intAwayScore)

  });

await adminDb
  .collection("bets")
  .doc(betDoc.id)
  .update({
    points
  });

console.log(
  `✅ ${bet.userName}: ${points} pontos`
);

}

      }

    }

    return NextResponse.json({

      success: true

    });

  } catch (error) {

    console.error("ERRO UPDATE RESULTS:", error);

    return NextResponse.json({

      success: false

    });

  }

}