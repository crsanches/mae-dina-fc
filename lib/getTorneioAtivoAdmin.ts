// lib/getTorneioAtivoAdmin.ts
// Versão para código server-side (cron, scripts, API routes) que usa
// o Firebase Admin SDK em vez do client SDK.

import { adminDb } from "@/lib/firebaseAdmin";

export async function getTorneioAtivoAdmin(): Promise<string> {
  const configSnap = await adminDb
    .collection("config")
    .doc("appConfig")
    .get();

  if (!configSnap.exists || !configSnap.data()?.torneioAtivo) {
    throw new Error(
      "config/appConfig.torneioAtivo não está definido no Firestore."
    );
  }

  return configSnap.data()!.torneioAtivo as string;
}