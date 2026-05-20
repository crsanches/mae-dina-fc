import { NextResponse } from "next/server";
//import { db } from "@/lib/firebase";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

function normalize(text: string) {

    return text
  
      .normalize("NFD")
  
      .replace(/[\u0300-\u036f]/g, "")
  
      .toLowerCase()
  
      .trim();
  
  }

export async function GET() {

  try {

    const response = await fetch(
      "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4351&s=2026"
     
    );

    const data = await response.json();
    console.log(data);

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

    for (const apiGame of data.events || []) {

    

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
          
            return (
          
              normalize(game.teamA) ===
              normalize(apiGame.strHomeTeam)
          
              &&
          
              normalize(game.teamB) ===
              normalize(apiGame.strAwayTeam)
          
            );
          
          });

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

      }

    }

    return NextResponse.json({

      success: true

    });

  } catch (error) {

    console.error(error);

    return NextResponse.json({

      success: false

    });

  }

}