import { NextResponse }
from "next/server";

import { adminDb }
from "@/lib/firebaseAdmin";

import {
  buildMatchAnalyticsAdmin
}
from "@/lib/buildMatchAnalyticsAdmin";

export async function GET() {

  try {

    const gamesSnapshot =
      await adminDb
        .collection("games")
        .get();

    let totalProcessados = 0;

    for (
      const gameDoc
      of gamesSnapshot.docs
    ) {

      const game =
        gameDoc.data();

      if (
        game.resultadoA == null ||
        game.resultadoB == null
      ) {
        continue;
      }

      const matchName =
        `${game.teamA} x ${game.teamB}`;

      await buildMatchAnalyticsAdmin(
        matchName,
        Number(game.resultadoA),
        Number(game.resultadoB)
      );

      totalProcessados++;

    }

    return NextResponse.json({

      success: true,

      totalProcessados

    });

  } catch (error) {

    console.error(
      "ERRO REBUILD ANALYTICS:",
      error
    );

    return NextResponse.json({

      success: false,

      error:
        error instanceof Error
          ? error.message
          : "erro"

    });

  }

}