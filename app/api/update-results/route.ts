import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebaseAdmin";


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

  // Brasileirão

  if (value === "athletico paranaense")
    value = "athletico pr";

  if (value === "atletico mineiro")
    value = "atletico mg";

  if (value === "vasco da gama")
    value = "vasco";

  if (value === "ec vitoria")
    value = "vitoria";

  // Copa 2026

  const aliases: Record<string, string> = {

    "mexico": "mexico",
    "south africa": "africa do sul",
    "south korea": "coreia do sul",
    "czech republic": "tchequia",

    "canada": "canada",
    "bosnia herzegovina": "bosnia e herzegovina",
    "qatar": "catar",
    "switzerland": "suica",

    "brazil": "brasil",
    "morocco": "marrocos",
    "haiti": "haiti",
    "scotland": "escocia",

    "usa": "estados unidos",
    "united states": "estados unidos",
    "paraguay": "paraguai",
    "australia": "australia",
    "turkey": "turquia",

    "germany": "alemanha",
    "curacao": "curacao",
    "ivory coast": "costa do marfim",
    "ecuador": "equador",

    "netherlands": "holanda",
    "japan": "japao",
    "sweden": "suecia",
    "tunisia": "tunisia",

    "belgium": "belgica",
    "egypt": "egito",
    "iran": "ira",
    "new zealand": "nova zelandia",

    "spain": "espanha",
    "cape verde": "cabo verde",
    "saudi arabia": "arabia saudita",
    "uruguay": "uruguai",

    "france": "franca",
    "senegal": "senegal",
    "iraq": "iraque",
    "norway": "noruega",

    "argentina": "argentina",
    "algeria": "argelia",
    "austria": "austria",
    "jordan": "jordania",

    "portugal": "portugal",
    "dr congo": "rd congo",
    "uzbekistan": "uzbequistao",
    "colombia": "colombia",

    "england": "inglaterra",
    "croatia": "croacia",
    "ghana": "gana",
    "panama": "panama"
  };

  return aliases[value] || value;
}

export async function GET() {
 
  try {

    const response = await fetch(
      "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026" );
    

    const data = await response.json();
    type ApiGame = {
      strStatus: string;
      strHomeTeam: string;
      strAwayTeam: string;
      intHomeScore: number | string | null;
      intAwayScore: number | string | null;
    };

    const recentGames = (data.events || []).filter(
      (game: ApiGame) =>
        game.intHomeScore !== null &&
        game.intAwayScore !== null
    );
  
    const gamesSnapshot =
    await adminDb
      .collection("games")
      .get();


      for (const apiGame of recentGames) {
    
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

          // Já foi processado anteriormente?
          if (
            localGame.data().finished === true &&
            apiGame.strStatus === "FT"
          ) {
            continue;
          }
          
          
          } else {
     
          }

          if (localGame === undefined) continue;
   
          await adminDb
          .collection("games")
          .doc(localGame.id)
          .update({

            resultadoA:
              Number(apiGame.intHomeScore),

            resultadoB:
              Number(apiGame.intAwayScore),

            finished:
              apiGame.strStatus === "FT"

          });

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