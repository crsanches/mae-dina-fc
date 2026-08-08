import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { buildMatchAnalyticsAdmin } from "@/lib/buildMatchAnalyticsAdmin";
import { buildLeagueHistory } from "@/lib/buildLeagueHistory";
import { getTorneiosAtivosAdmin } from "@/lib/getTorneiosAtivosAdmin";
import { SYNC_CONFIG } from "@/lib/syncConfig";

type ApiGame = {
  strStatus: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: number | string | null;
  intAwayScore: number | string | null;
  strTimestamp?: string;
  strEvent?: string;
};

// Status que indicam jogo encerrado de vez:
// FT = tempo normal | AET = após prorrogação | AP = após pênaltis
// "Match Finished" = formato por extenso do endpoint gratuito
const STATUS_FINAIS = ["FT", "AET", "AP", "Match Finished"];

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

async function sincronizarTorneio(
  torneioId: string,
  groupsSnapshot: FirebaseFirestore.QuerySnapshot
) {
  const syncConfig = SYNC_CONFIG[torneioId];

  if (!syncConfig) {
    console.error(`Sem SYNC_CONFIG para o torneio "${torneioId}" — adicione uma entrada em lib/syncConfig.ts`);
    return { torneioId, skipped: "sem SYNC_CONFIG" };
  }

  const { leagueId, season } = syncConfig;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const agora = Date.now();
  const limite48h = 48 * 60 * 60 * 1000;
  const limite24h = 24 * 60 * 60 * 1000;

  // =========================================================
  // GUARDA: sem jogo em aberto nas últimas 24h pra ESTE torneio?
  // Continua pro próximo torneio do loop, não aborta a função inteira.
  // =========================================================
  const gamesSnapshot = await adminDb
    .collection("games")
    .where("torneioId", "==", torneioId)
    .get();

  const temJogoEmAberto = gamesSnapshot.docs.some((g) => {
    const data = g.data();
    const ts = new Date(data.matchDate).getTime();
    return agora > ts && agora - ts < limite24h && data.finished !== true;
  });

  if (!temJogoEmAberto) {
    return { torneioId, skipped: "nenhum jogo em aberto nas últimas 24h" };
  }

  // =========================================================
  // BUSCA EVENTOS NA API (liga/temporada deste torneio)
  // =========================================================
  const [res1, res2, res3, resSeason] = await Promise.all([
    fetch(`https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${today}&l=${leagueId}`),
    fetch(`https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${yesterday}&l=${leagueId}`),
    fetch(`https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${tomorrow}&l=${leagueId}`),
    fetch(`https://www.thesportsdb.com/api/v1/json/123/eventsseason.php?id=${leagueId}&s=${season}`),
  ]);

  const [data1, data2, data3, dataSeason] = await Promise.all([
    res1.json(),
    res2.json(),
    res3.json(),
    resSeason.json(),
  ]);

  // Filtra jogos da temporada com placar e recentes (últimas 48h)
  const seasonGames = (dataSeason.events || []).filter((g: ApiGame) => {
    const timestamp = g.strTimestamp ? new Date(g.strTimestamp).getTime() : 0;
    const temPlacar = g.intHomeScore !== null && g.intAwayScore !== null;
    const recente = agora - timestamp < limite48h;
    return temPlacar && recente;
  });

  // Junta eventos do dia + season
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

  // Identifica jogos com idEventSportsDB e jogos sem resultado recentes
  const jogosComId = gamesSnapshot.docs.filter((g) => g.data().idEventSportsDB);
  const jogosSemCobertura = gamesSnapshot.docs.filter((g) => {
    const data = g.data();
    const timestamp = new Date(data.matchDate).getTime();
    const recente = agora - timestamp < limite48h && agora > timestamp;
    const semResultado = data.finished !== true;
    const semId = !data.idEventSportsDB;

    const coberto = allEvents.some((e: ApiGame) => {
      const firebaseA = normalize(data.teamA);
      const firebaseB = normalize(data.teamB);
      const apiHome = normalize(e.strHomeTeam);
      const apiAway = normalize(e.strAwayTeam);
      // mandante/visitante na mesma ordem — separa ida de volta
      return firebaseA === apiHome && firebaseB === apiAway;
    });

    return recente && semResultado && semId && !coberto;
  });

  // Busca via lookupevent para jogos com idEventSportsDB
  const resComId = await Promise.all(
    jogosComId.map((g) =>
      fetch(`https://www.thesportsdb.com/api/v1/json/123/lookupevent.php?id=${g.data().idEventSportsDB}`)
        .then((r) => r.json())
        .then((data) => ({ firebaseId: g.id, event: (data.events || [])[0] || null }))
        .catch(() => ({ firebaseId: g.id, event: null }))
    )
  );

  let algumJogoFinalizou = false;

  // =========================================================
  // 1. Jogos encontrados via allEvents (método por nome/ordem)
  // =========================================================
  for (const apiGame of allEvents) {
    if (apiGame.intHomeScore === null || apiGame.intAwayScore === null) continue;

    const localGame = gamesSnapshot.docs.find((g) => {
      const game = g.data();
      if (game.idEventSportsDB) return false; // já tratado abaixo

      const firebaseA = normalize(game.teamA);
      const firebaseB = normalize(game.teamB);
      const apiHome = normalize(apiGame.strHomeTeam);
      const apiAway = normalize(apiGame.strAwayTeam);

      // mandante/visitante na mesma ordem — separa ida de volta
      return firebaseA === apiHome && firebaseB === apiAway;
    });

    if (!localGame) continue;

    const dbGame = localGame.data();
    const jogoEncerrado = STATUS_FINAIS.includes(apiGame.strStatus);

    const placarMudou =
      dbGame.resultadoA !== Number(apiGame.intHomeScore) ||
      dbGame.resultadoB !== Number(apiGame.intAwayScore);

    if (dbGame.finished === true && jogoEncerrado && !placarMudou) continue;

    await adminDb.collection("games").doc(localGame.id).update({
      resultadoA: Number(apiGame.intHomeScore),
      resultadoB: Number(apiGame.intAwayScore),
      finished: jogoEncerrado,
      status: apiGame.strStatus,
    });

    if (jogoEncerrado) {
      algumJogoFinalizou = true;

      for (const groupDoc of groupsSnapshot.docs) {
        const torneiosDoGrupo: string[] = groupDoc.data().torneiosIds || [];
        if (!torneiosDoGrupo.includes(torneioId)) continue;

        await buildMatchAnalyticsAdmin(
          `${dbGame.teamA} x ${dbGame.teamB}`,
          Number(apiGame.intHomeScore),
          Number(apiGame.intAwayScore),
          groupDoc.id,
          torneioId,
          dbGame.matchDate,
          dbGame.fase,
          dbGame.grupo
        );
      }
    }
  }

  // =========================================================
  // 2. Jogos com idEventSportsDB — lookup direto
  // =========================================================
  for (const { firebaseId, event } of resComId) {
    if (!event || event.intHomeScore === null || event.intAwayScore === null) continue;

    const localGame = gamesSnapshot.docs.find((g) => g.id === firebaseId);
    if (!localGame) continue;

    const dbGame = localGame.data();
    const jogoEncerrado = STATUS_FINAIS.includes(event.strStatus);

    const placarMudou =
      dbGame.resultadoA !== Number(event.intHomeScore) ||
      dbGame.resultadoB !== Number(event.intAwayScore);

    if (dbGame.finished === true && jogoEncerrado && !placarMudou) continue;

    await adminDb.collection("games").doc(firebaseId).update({
      resultadoA: Number(event.intHomeScore),
      resultadoB: Number(event.intAwayScore),
      finished: jogoEncerrado,
      status: event.strStatus,
    });

    if (jogoEncerrado) {
      algumJogoFinalizou = true;

      for (const groupDoc of groupsSnapshot.docs) {
        const torneiosDoGrupo: string[] = groupDoc.data().torneiosIds || [];
        if (!torneiosDoGrupo.includes(torneioId)) continue;

        await buildMatchAnalyticsAdmin(
          `${dbGame.teamA} x ${dbGame.teamB}`,
          Number(event.intHomeScore),
          Number(event.intAwayScore),
          groupDoc.id,
          torneioId,
          dbGame.matchDate,
          dbGame.fase,
          dbGame.grupo
        );
      }
    }
  }

  // =========================================================
  // HISTÓRICO DA LIGA — só quando algum jogo finalizou,
  // e só pros grupos que participam DESTE torneio.
  // =========================================================
  if (algumJogoFinalizou) {
    for (const groupDoc of groupsSnapshot.docs) {
      const torneiosDoGrupo: string[] = groupDoc.data().torneiosIds || [];
      if (!torneiosDoGrupo.includes(torneioId)) continue;

      await buildLeagueHistory(groupDoc.id, torneioId);
    }
  }

  return {
    torneioId,
    historyAtualizado: algumJogoFinalizou,
    semCobertura: jogosSemCobertura.map((g) => g.data().match),
  };
}

export async function GET() {
  try {
    const torneiosAtivos = await getTorneiosAtivosAdmin();

    if (!torneiosAtivos.length) {
      return NextResponse.json({
        success: false,
        error: "Nenhum torneio ativo configurado em config/appConfig.torneiosAtivos",
      });
    }

    // grupos não mudam por torneio — busca uma vez só
    const groupsSnapshot = await adminDb.collection("groups").get();

    const resultados = [];
    for (const torneioId of torneiosAtivos) {
      const resultado = await sincronizarTorneio(torneioId, groupsSnapshot);
      resultados.push(resultado);
    }

    return NextResponse.json({
      success: true,
      resultados,
    });

  } catch (error) {
    console.error("ERRO UPDATE RESULTS:", error);
    return NextResponse.json({ success: false });
  }
}