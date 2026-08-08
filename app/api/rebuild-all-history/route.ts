import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { buildLeagueHistory } from "@/lib/buildLeagueHistory";
import { getTorneiosAtivosAdmin } from "@/lib/getTorneiosAtivosAdmin";

export async function GET() {

  const groupsSnapshot =
    await adminDb.collection("groups").get();

  const torneios =
    await getTorneiosAtivosAdmin();

  let total = 0;

  for (const torneioId of torneios) {

    for (const groupDoc of groupsSnapshot.docs) {

      const torneiosDoGrupo =
        groupDoc.data().torneiosIds || [];

      if (!torneiosDoGrupo.includes(torneioId))
        continue;

      await buildLeagueHistory(
        groupDoc.id,
        torneioId
      );

      total++;
    }
  }

  return NextResponse.json({
    success: true,
    total
  });
}