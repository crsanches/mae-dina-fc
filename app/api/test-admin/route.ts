import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {

  const collections =
    await adminDb.listCollections();

  return NextResponse.json({
    success: true,
    total: collections.length,
  });

}