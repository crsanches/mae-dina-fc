import { NextResponse } from "next/server";

import {
  buildLeagueHistory
} from "@/lib/buildLeagueHistory";

export async function GET() {

  await buildLeagueHistory(
    "S45ZeKwxkKSeYTqq2p45"
  );

  return NextResponse.json({
    success: true
  });

}