// app/api/sync-event-ids/route.ts

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

function datasProximas(date1: string, date2: string): boolean {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  const diff = Math.abs(d1 - d2);
  return diff < 4 * 60 * 60 * 1000;
}

async function fetchJson(url: string): Promise<any> {
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (!text.startsWith("{") && !text.startsWith("[")) {
      console.log(`Resposta inválida para ${url} — provavelmente rate limit`);
      return null;
    }
    return JSON.parse(text);
  } catch {
    console.log(`Erro ao buscar ${url}`);
    return null;
  }
}

export async function GET() {
  try {
    const gamesSnapshot = await adminDb.collection("games").get();

    const encontrados: string[] = [];
    const naoEncontrados: string[] = [];
    const jaTemId: string[] = [];

    const datas = gerarDatas("2026-06-11", "2026-07-19");
    console.log(`Buscando eventos para ${datas.length} datas...`);

    const todosEventos: any[] = [];

    // Busca por data em lotes de 3 com pausa de 500ms
    for (let i = 0; i < datas.length; i += 3) {
      const lote = datas.slice(i, i + 3);
      const respostas = await Promise.all(
        lote.map((d) =>
          fetchJson(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${d}&l=4429`)
            .then((data) => data?.events || [])
        )
      );
      respostas.forEach((eventos) => todosEventos.push(...eventos));
      await new Promise((r) => setTimeout(r, 500));
    }

    // Busca pelo eventsseason com proteção
    const dataSeason = await fetchJson(
      `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026`
    );
    if (dataSeason?.events) {
      todosEventos.push(...dataSeason.events);
    } else {
      console.log("eventsseason não retornou dados válidos — pulando");
    }

    // Remove duplicatas pelo idEvent
    const seenIds = new Set();
    const eventosUnicos = todosEventos.filter((e: any) => {
      if (!e?.idEvent) return false;
      if (seenIds.has(e.idEvent)) return false;
      seenIds.add(e.idEvent);
      return true;
    });

    console.log(`Total de eventos encontrados na API: ${eventosUnicos.length}`);

    // Para cada jogo do Firebase, tenta encontrar o idEvent
    for (const gameDoc of gamesSnapshot.docs) {
      const game = gameDoc.data();

      if (game.idEventSportsDB) {
        jaTemId.push(game.match);
        continue;
      }

      const firebaseA = normalize(game.teamA);
      const firebaseB = normalize(game.teamB);

      const encontrado = eventosUnicos.find((e: any) => {
        const apiHome = normalize(e.strHomeTeam);
        const apiAway = normalize(e.strAwayTeam);

        const nomesBatem =
          (firebaseA === apiHome && firebaseB === apiAway) ||
          (firebaseA === apiAway && firebaseB === apiHome);

        const dataBate = datasProximas(game.matchDate, e.strTimestamp);

        return nomesBatem && dataBate;
      });

      if (encontrado) {
        await adminDb.collection("games").doc(gameDoc.id).update({
          idEventSportsDB: encontrado.idEvent,
        });
        encontrados.push(`✅ ${game.match} → idEvent: ${encontrado.idEvent}`);
      } else {
        naoEncontrados.push(`❌ ${game.match} (${game.matchDate})`);
      }
    }

    console.log("\n=== RELATÓRIO ===");
    console.log("Já tinham ID:", jaTemId);
    console.log("Encontrados:", encontrados);
    console.log("Não encontrados:", naoEncontrados);

    return NextResponse.json({
      success: true,
      jaTemId: jaTemId.length,
      encontrados,
      naoEncontrados,
    });

  } catch (error) {
    console.error("ERRO SYNC:", error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}

function gerarDatas(inicio: string, fim: string): string[] {
  const datas: string[] = [];
  const atual = new Date(inicio);
  const final = new Date(fim);

  while (atual <= final) {
    datas.push(atual.toISOString().split("T")[0]);
    atual.setDate(atual.getDate() + 1);
  }

  return datas;
}