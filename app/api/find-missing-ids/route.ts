// app/api/find-missing-ids/route.ts

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

  const aliases: Record<string, string> = {
    "mexico": "mexico",
    "south africa": "africa do sul",
    "south korea": "coreia do sul",
    "czech republic": "tchequia",
    "canada": "canada",
    "bosnia herzegovina": "bosnia e herzegovina",
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

// Converte nome em português para inglês para buscar na API
const ptToEn: Record<string, string> = {
  "australia": "Australia",
  "turquia": "Turkey",
  "holanda": "Netherlands",
  "japao": "Japan",
  "suecia": "Sweden",
  "tunisia": "Tunisia",
  "portugal": "Portugal",
  "rd congo": "DR Congo",
  "gana": "Ghana",
  "panama": "Panama",
  "colombia": "Colombia",
  "uzbequistao": "Uzbekistan",
  "croacia": "Croatia",
  "bosnia e herzegovina": "Bosnia-Herzegovina",
  "catar": "Qatar",
  "uruguai": "Uruguay",
  "espanha": "Spain",
  "arabia saudita": "Saudi Arabia",
  "cabo verde": "Cape Verde",
  "suica": "Switzerland",
  "tchequia": "Czech Republic",
  "mexico": "Mexico",
  "inglaterra": "England",
  "senegal": "Senegal",
  "iraque": "Iraq",
};

function toEnglish(name: string): string {
  const norm = normalize(name);
  return ptToEn[norm] || name;
}

async function fetchJson(url: string): Promise<any> {
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (!text.startsWith("{") && !text.startsWith("[")) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function datasProximas(date1: string, date2: string): boolean {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  const diff = Math.abs(d1 - d2);
  return diff < 6 * 60 * 60 * 1000; // 6h de tolerância
}

export async function GET() {
  try {
    // Busca jogos sem idEventSportsDB
    const gamesSnapshot = await adminDb.collection("games").get();
    const jogosSemId = gamesSnapshot.docs.filter((g) => !g.data().idEventSportsDB);

    console.log(`Jogos sem ID: ${jogosSemId.length}`);

    const encontrados: string[] = [];
    const naoEncontrados: string[] = [];

    for (const gameDoc of jogosSemId) {
      const game = gameDoc.data();

      const teamAEn = toEnglish(game.teamA);
      const teamBEn = toEnglish(game.teamB);

      // Tenta buscar pelo nome do time A
      const query = `${teamAEn} vs ${teamBEn}`.replace(/ /g, "+");
      const url = `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${query}&s=2026`;

      console.log(`Buscando: ${query}`);

      const data = await fetchJson(url);
      await new Promise((r) => setTimeout(r, 400));

      const eventos = data?.event || data?.events || [];

      // Tenta achar o evento pela data
      const encontrado = eventos.find((e: any) => {
        return (
          e.idLeague === "4429" &&
          datasProximas(game.matchDate, e.strTimestamp)
        );
      });

      if (encontrado) {
        await adminDb.collection("games").doc(gameDoc.id).update({
          idEventSportsDB: encontrado.idEvent,
        });
        encontrados.push(`✅ ${game.match} → idEvent: ${encontrado.idEvent}`);
        console.log(`✅ ${game.match} → ${encontrado.idEvent}`);
      } else {
        // Tenta invertido (teamB vs teamA)
        const queryInv = `${teamBEn} vs ${teamAEn}`.replace(/ /g, "+");
        const urlInv = `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${queryInv}&s=2026`;

        const dataInv = await fetchJson(urlInv);
        await new Promise((r) => setTimeout(r, 400));

        const eventosInv = dataInv?.event || dataInv?.events || [];

        const encontradoInv = eventosInv.find((e: any) => {
          return (
            e.idLeague === "4429" &&
            datasProximas(game.matchDate, e.strTimestamp)
          );
        });

        if (encontradoInv) {
          await adminDb.collection("games").doc(gameDoc.id).update({
            idEventSportsDB: encontradoInv.idEvent,
          });
          encontrados.push(`✅ ${game.match} → idEvent: ${encontradoInv.idEvent} (invertido)`);
          console.log(`✅ ${game.match} → ${encontradoInv.idEvent} (invertido)`);
        } else {
          naoEncontrados.push(`❌ ${game.match} (${game.matchDate})`);
          console.log(`❌ ${game.match} — não encontrado`);
        }
      }
    }

    console.log("\n=== RELATÓRIO FINAL ===");
    console.log("Encontrados:", encontrados);
    console.log("Não encontrados:", naoEncontrados);

    return NextResponse.json({
      success: true,
      encontrados,
      naoEncontrados,
    });

  } catch (error) {
    console.error("ERRO:", error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}