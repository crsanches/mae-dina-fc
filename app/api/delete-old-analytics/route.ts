import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("analytics_matches")
      .get();

    let removidos = 0;
    const idsRemovidos: string[] = [];

    for (const doc of snapshot.docs) {
      // Mantém apenas os analytics novos
      if (!doc.id.includes("___")) {
        await doc.ref.delete();

        removidos++;
        idsRemovidos.push(doc.id);

        console.log("REMOVIDO:", doc.id);
      }
    }

    return NextResponse.json({
      success: true,
      removidos,
      idsRemovidos,
    });

  } catch (error) {
    console.error("ERRO DELETE ANALYTICS:", error);

    return NextResponse.json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
    });
  }
}