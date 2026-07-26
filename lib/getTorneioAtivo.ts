// lib/getTorneioAtivo.ts
// Lê o torneio ativo (config/appConfig.torneioAtivo) no client.
// Usa um cache simples em memória pra não bater no Firestore toda hora.

import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

let cachedTorneioAtivo: string | null = null;

export async function getTorneioAtivo(): Promise<string> {
  if (cachedTorneioAtivo) return cachedTorneioAtivo;

  const configRef = doc(db, "config", "appConfig");
  const configSnap = await getDoc(configRef);

  if (!configSnap.exists() || !configSnap.data().torneioAtivo) {
    throw new Error(
      "config/appConfig.torneioAtivo não está definido no Firestore."
    );
  }

  cachedTorneioAtivo = configSnap.data().torneioAtivo as string;
  return cachedTorneioAtivo;
}

// Útil se você trocar o torneio ativo em runtime (ex: painel admin)
// e quiser forçar a releitura sem dar reload na página.
export function limparCacheTorneioAtivo() {
  cachedTorneioAtivo = null;
}