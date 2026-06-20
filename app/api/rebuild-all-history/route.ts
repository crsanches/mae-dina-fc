import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebaseAdmin";

import {
  buildLeagueHistory,
} from "@/lib/buildLeagueHistory";

export async function GET() {

  const groupsSnapshot =
    await adminDb
      .collection("groups")
      .get();

  let total = 0;

  for (const groupDoc of groupsSnapshot.docs) {

    await buildLeagueHistory(
      groupDoc.id
    );

    total++;

  }

  return NextResponse.json({
    success: true,
    groups: total,
  });

}