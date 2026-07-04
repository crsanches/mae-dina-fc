// app/api/find-missing-ids/route.ts

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

type SportsDbEvent = {
  idEvent: string;
  idLeague: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strTimestamp: string;
};

function normalize(text?: string) {
  if (!text) return "";

  const value = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\bec\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const aliases: Record<string, string> = {
    "south africa": "africa do sul",
    "south korea": "coreia do sul",
    "czech republic": "tchequia",
    "bosnia herzegovina": "bosnia e herzegovina",
    "bosnia-herzegovina": "bosnia e herzegovina",
    "qatar": "catar",
    "switzerland": "suica",
    "brazil": "brasil",
    "morocco": "marrocos",
    "scotland": "escocia",
    "usa": "estados unidos",
    "united states": "estados unidos",
    "paraguay": "paraguai",
    "turkey": "turquia",
    "germany": "alemanha",
    "ivory coast": "costa do marfim",
    "ecuador": "equador",
    "netherlands": "holanda",
    "japan": "japao",
    "sweden": "suecia",
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
    "algeria": "argelia",
    "jordan": "jordania",
    "dr congo": "rd congo",
    "uzbekistan": "uzbequistao",
    "england": "inglaterra",
    "croatia": "croacia",
    "ghana": "gana",
  };

  return aliases[value] || value;
}

function datasProximas(date1: string, date2: string) {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();

  return Math.abs(d1 - d2) < 6 * 60 * 60 * 1000;
}

export async function GET() {
  try {

    const response = await fetch(
      "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026"
    );

    const season = await response.json();

    const eventos: SportsDbEvent[] = season.events || [];

    //console.log(`Eventos da temporada: ${eventos.length}`);
    console.log(
      eventos.map(e => ({
        id: e.idEvent,
        home: e.strHomeTeam,
        away: e.strAwayTeam,
        date: e.strTimestamp,
      }))
    );

    const gamesSnapshot = await adminDb.collection("games").get();

    const jogosSemId = gamesSnapshot.docs.filter(
      doc => !doc.data().idEventSportsDB
    );

    console.log(`Jogos sem id: ${jogosSemId.length}`);

    const encontrados: string[] = [];
    const naoEncontrados: string[] = [];

    for (const doc of jogosSemId) {

      const game = doc.data();

      const firebaseA = normalize(game.teamA);
      const firebaseB = normalize(game.teamB);

      const encontrado = eventos.find(event => {

        const apiHome = normalize(event.strHomeTeam);
        const apiAway = normalize(event.strAwayTeam);

        const mesmosTimes =
          (firebaseA === apiHome && firebaseB === apiAway) ||
          (firebaseA === apiAway && firebaseB === apiHome);

        return (
          mesmosTimes &&
          event.idLeague === "4429" &&
          datasProximas(game.matchDate, event.strTimestamp)
        );
      });

      if (encontrado) {

        await adminDb.collection("games").doc(doc.id).update({
          idEventSportsDB: encontrado.idEvent,
        });

        encontrados.push(
          `✅ ${game.match} -> ${encontrado.idEvent}`
        );

        console.log(
          `✅ ${game.match} -> ${encontrado.idEvent}`
        );

      } else {

        naoEncontrados.push(`❌ ${game.match}`);
      
        console.log("\n========================================");
        console.log(`❌ NÃO ENCONTRADO: ${game.match}`);
        console.log(`Firebase: ${game.teamA} x ${game.teamB}`);
        console.log(`Data Firebase: ${game.matchDate}`);
      
        const relacionados = eventos.filter(event => {
      
          const home = normalize(event.strHomeTeam);
          const away = normalize(event.strAwayTeam);
      
          return (
            home === firebaseA ||
            away === firebaseA ||
            home === firebaseB ||
            away === firebaseB
          );
      
        });
      
        if (relacionados.length === 0) {
      
          console.log("Nenhum evento da temporada contém esses times.");
      
        } else {
      
          console.log("Eventos semelhantes encontrados:");
      
          relacionados.forEach(event => {
      
            console.log({
              idEvent: event.idEvent,
              home: event.strHomeTeam,
              away: event.strAwayTeam,
              timestamp: event.strTimestamp,
            });
      
          });
      
        }
      
        console.log("========================================\n");
      
      }
    }

    return NextResponse.json({
      success: true,
      encontrados,
      naoEncontrados,
      totalEventos: eventos.length,
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json({
      success: false,
      error: String(err),
    });

  }
}