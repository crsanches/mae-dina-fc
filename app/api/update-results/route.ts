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

  const aliases: Record<string, string> = {

    "athletico paranaense": "athletico pr",

    "atletico mineiro": "atletico mg",

    "vasco da gama": "vasco",

    "ec vitoria": "vitoria"

  };

  return aliases[value] || value;

}

export async function GET() {
  console.log("🔥 NOVA VERSAO DA API 🔥");
  try {

    const response = await fetch(
      "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4351&s=2026"
     
    );

    const data = await response.json();
    console.log(data);

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
    
        return diffDays <= 200;
    
      }
    );

console.log(
  "JOGOS RECENTES:",
  recentGames.length
);

    const gamesSnapshot =
    await adminDb
      .collection("games")
      .get();

    console.log(
        "TOTAL JOGOS FIREBASE:",
        gamesSnapshot.docs.length
      );
      
      gamesSnapshot.docs.forEach((doc) => {
      
        console.log("DOC:", doc.data());
      
      });

      for (const apiGame of recentGames) {

    

      if (
        apiGame.strLeague !==
        "Brazilian Serie A"
      ) continue;
    
        console.log(
            apiGame.strHomeTeam,
            "x",
            apiGame.strAwayTeam
          );


          
          const localGame = gamesSnapshot.docs.find((g) => {

            const game = g.data();
          
            console.log(
              "FIREBASE:",
              normalize(game.teamA),
              "x",
              normalize(game.teamB)
            );
          
            console.log(
              "API:",
              normalize(apiGame.strHomeTeam),
              "x",
              normalize(apiGame.strAwayTeam)
            );
          
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

  console.log(
    "COMPARE:",
    firebaseA,
    "vs",
    apiHome,
    "|",
    firebaseB,
    "vs",
    apiAway
  );

return directMatch || invertedMatch;
          
          });


          if (localGame) {

            console.log(
              "✅ MATCH:",
              apiGame.strHomeTeam,
              "x",
              apiGame.strAwayTeam
            );
          
          } else {
          
            console.log(
              "❌ SEM MATCH:",
              apiGame.strHomeTeam,
              "x",
              apiGame.strAwayTeam
            );
          
          }

      if (!localGame) continue;
      console.log(

        apiGame.strHomeTeam,
      
        apiGame.intHomeScore,
      
        "x",
      
        apiGame.intAwayScore,
      
        apiGame.strAwayTeam
      
      );
      if (
        apiGame.intHomeScore !== null &&
        apiGame.intAwayScore !== null
      ) {

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