// lib/getTorneiosAtivosAdmin.ts
import { adminDb } from "@/lib/firebaseAdmin";

export async function getTorneiosAtivosAdmin(): Promise<string[]> {
  const snap = await adminDb.collection("config").doc("appConfig").get();
  const data = snap.data();
  return data?.torneiosAtivos || [];
}