import { NextResponse } from "next/server";
import { buildLeagueHistory } from "@/lib/buildLeagueHistory";
import { getTorneioAtivoAdmin } from "@/lib/getTorneioAtivoAdmin";

export async function GET() {

  const torneioId = await getTorneioAtivoAdmin();

  await buildLeagueHistory(
    "S45ZeKwxkKSeYTqq2p45",
    torneioId
  );

  return NextResponse.json({
    success: true
  });

}