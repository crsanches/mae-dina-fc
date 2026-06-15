import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { buildMatchAnalyticsAdmin } from "@/lib/buildMatchAnalyticsAdmin";

export async function GET() {
  try {
    const [gamesSnapshot, groupsSnapshot] = await Promise.all([
      adminDb.collection("games").get(),
      adminDb.collection("groups").get(),
    ]);

    const jogosEncerrados = gamesSnapshot.docs
      .map((doc) => doc.data())
      .filter((game) => game.resultadoA != null && game.resultadoB != null);

    const grupos = groupsSnapshot.docs.map((doc) => ({
      id: doc.id as string,
      nome: doc.data().nome || doc.id,
    }));

    let totalProcessados = 0;

    for (const grupo of grupos) {
      for (const game of jogosEncerrados) {
        await buildMatchAnalyticsAdmin(
          game.match,
          Number(game.resultadoA),
          Number(game.resultadoB),
          grupo.id
        );
        totalProcessados++;
      }
    }

    return NextResponse.json({
      success: true,
      totalGrupos: grupos.length,
      totalJogos: jogosEncerrados.length,
      totalProcessados,
    });

  } catch (error) {
    console.error("ERRO REBUILD ANALYTICS:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "erro",
    });
  }
}