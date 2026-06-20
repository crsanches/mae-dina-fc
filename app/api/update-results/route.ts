import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  buildMatchAnalyticsAdmin
}
from "@/lib/buildMatchAnalyticsAdmin";

import {
  buildLeagueHistory
} from "@/lib/buildLeagueHistory";

type ApiGame = {
  strStatus: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: number | string | null;
  intAwayScore: number | string | null;
  strTimestamp?: string;
  strEvent?: string;
};

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

  if (value === "athletico paranaense") value = "athletico pr";
  if (value === "atletico mineiro") value = "atletico mg";
  if (value === "vasco da gama") value = "vasco";
  if (value === "ec vitoria") value = "vitoria";

  const aliases: Record<string, string> = {
    "mexico": "mexico",
    "south africa": "africa do sul",
    "south korea": "coreia do sul",
    "czech republic": "tchequia",
    "canada": "canada",
    "bosnia herzegovina": "bosnia e herzegovina",
    "bosnia herzegovinaborg": "bosnia e herzegovina",
    "bosnia-herzegovina": "bosnia e herzegovina",
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
    "curaçao": "curacao",
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
    "panama": "panama",
  };

  return aliases[value] || value;
}

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const [res1, res2, res3, resSeason] = await Promise.all([
      fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&l=4429`),
      fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${yesterday}&l=4429`),
      fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${tomorrow}&l=4429`),
      fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026`),
    ]);

    const [data1, data2, data3, dataSeason] = await Promise.all([
      res1.json(),
      res2.json(),
      res3.json(),
      resSeason.json(),
    ]);

    // Filtra jogos da temporada com placar e recentes (últimas 48h)
    const agora = Date.now();
    const limite48h = 48 * 60 * 60 * 1000;

    const seasonGames = (dataSeason.events || []).filter((g: ApiGame) => {
      const timestamp = g.strTimestamp ? new Date(g.strTimestamp).getTime() : 0;
      const temPlacar = g.intHomeScore !== null && g.intAwayScore !== null;
      const recente = agora - timestamp < limite48h;
      return temPlacar && recente;
    });

    // Junta eventos do dia + season (sem extras ainda)
    const allRaw = [
      ...(data1.events || []),
      ...(data2.events || []),
      ...(data3.events || []),
      ...seasonGames,
    ];

    const seen = new Set();
    const allEvents = allRaw.filter((g: ApiGame) => {
      const key = `${g.strHomeTeam}-${g.strAwayTeam}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Busca todos os jogos do Firebase
    const gamesSnapshot = await adminDb.collection("games").get();

    // Identifica jogos com idEventSportsDB e jogos sem resultado recentes
    const jogosComId = gamesSnapshot.docs.filter((g) => g.data().idEventSportsDB);
    const jogosSemCobertura = gamesSnapshot.docs.filter((g) => {
      const data = g.data();
      const timestamp = new Date(data.matchDate).getTime();
      const recente = agora - timestamp < limite48h && agora > timestamp;
      const semResultado = data.finished !== true;
      const semId = !data.idEventSportsDB;

      // Verifica se já está coberto pelo allEvents
      const coberto = allEvents.some((e: ApiGame) => {
        const firebaseA = normalize(data.teamA);
        const firebaseB = normalize(data.teamB);
        const apiHome = normalize(e.strHomeTeam);
        const apiAway = normalize(e.strAwayTeam);
        return (firebaseA === apiHome && firebaseB === apiAway) ||
               (firebaseA === apiAway && firebaseB === apiHome);
      });

      return recente && semResultado && semId && !coberto;
    });

    // Busca via lookupevent para jogos com idEventSportsDB
    const resComId = await Promise.all(
      jogosComId.map((g) =>
        fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id=${g.data().idEventSportsDB}`)
          .then((r) => r.json())
          .then((data) => ({ firebaseId: g.id, event: (data.events || [])[0] || null }))
          .catch(() => ({ firebaseId: g.id, event: null }))
      )
    );

    // Busca via lookupevent para jogos sem cobertura (tenta pelo nome do time)
    console.log("Jogos sem cobertura:", jogosSemCobertura.map((g) => g.data().match));

    // Monta lista final de atualizações
    // 1. Jogos encontrados via allEvents (método antigo)
    for (const apiGame of allEvents) {
      if (apiGame.intHomeScore === null || apiGame.intAwayScore === null) continue;

      const localGame = gamesSnapshot.docs.find((g) => {
        const game = g.data();
        if (game.idEventSportsDB) return false; // já será tratado abaixo

        const firebaseA = normalize(game.teamA);
        const firebaseB = normalize(game.teamB);
        const apiHome = normalize(apiGame.strHomeTeam);
        const apiAway = normalize(apiGame.strAwayTeam);

        return (firebaseA === apiHome && firebaseB === apiAway) ||
               (firebaseA === apiAway && firebaseB === apiHome);
      });

      if (!localGame) continue;
      if (localGame.data().finished === true && apiGame.strStatus === "FT") continue;

      await adminDb.collection("games").doc(localGame.id).update({
        resultadoA: Number(apiGame.intHomeScore),
        resultadoB: Number(apiGame.intAwayScore),
        finished: apiGame.strStatus === "FT",
        status: apiGame.strStatus,
      });
      if (
        apiGame.strStatus === "FT"
      ) {
      
        await buildMatchAnalyticsAdmin(
          `${localGame.data().teamA} x ${localGame.data().teamB}`,
          Number(apiGame.intHomeScore),
          Number(apiGame.intAwayScore),
          localGame.data().groupId
        );
      
      }

    }

    // 2. Jogos com idEventSportsDB — lookup direto
    for (const { firebaseId, event } of resComId) {
      if (!event || event.intHomeScore === null || event.intAwayScore === null) continue;

      const localGame = gamesSnapshot.docs.find((g) => g.id === firebaseId);
      if (!localGame) continue;
      if (localGame.data().finished === true && event.strStatus === "FT") continue;

      await adminDb.collection("games").doc(firebaseId).update({
        resultadoA: Number(event.intHomeScore),
        resultadoB: Number(event.intAwayScore),
        finished: event.strStatus === "FT",
        status: event.strStatus,
      });
      if (
        event.strStatus === "FT"
      ) {
      
        await buildMatchAnalyticsAdmin(
          `${localGame.data().teamA} x ${localGame.data().teamB}`,
          Number(event.intHomeScore),
          Number(event.intAwayScore),
          localGame.data().groupId 
        );
      
      }

    }
      const groupsSnapshot =
      await adminDb
        .collection("groups")
        .get();
    
    for (const groupDoc of groupsSnapshot.docs) {
    
      await buildLeagueHistory(
        groupDoc.id
      );
    
    }
    return NextResponse.json({
      success: true,
      semCobertura: jogosSemCobertura.map((g) => g.data().match),
    });

  } catch (error) {
    console.error("ERRO UPDATE RESULTS:", error);
    return NextResponse.json({ success: false });
  }
}