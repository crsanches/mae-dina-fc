"use client";

import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export const TORNEIOS_INFO: Record<string, { nome: string; emoji: string }> = {
  copadobrasil2026: { nome: "Copa do Brasil", emoji: "🇧🇷" },
  libertadores2026: { nome: "Libertadores", emoji: "🌎" },
};

const STORAGE_KEY = "torneioSelecionado";

export function useTorneioSelecionado() {
  const [torneiosDisponiveis, setTorneiosDisponiveis] = useState<string[]>([]);
  const [torneioSelecionado, setTorneioSelecionadoState] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged dispara toda vez que o estado de autenticação
    // muda — inclusive quando a sessão salva termina de restaurar após
    // o app ser reaberto. Diferente de ler auth.currentUser direto num
    // useEffect (que roda uma vez só e pode pegar null antes da sessão
    // estar pronta), isso garante que a busca sempre acontece assim que
    // o usuário realmente está disponível.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        setGroupId(null);
        setTorneiosDisponiveis([]);
        setTorneioSelecionadoState(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const activeGroupId = userSnap.exists() ? userSnap.data().activeGroupId : null;

        if (!activeGroupId) {
          setLoading(false);
          return;
        }

        setGroupId(activeGroupId);

        const groupSnap = await getDoc(doc(db, "groups", activeGroupId));
        if (!groupSnap.exists()) {
          setLoading(false);
          return;
        }

        const torneiosIds: string[] = groupSnap.data().torneiosIds || [];
        setTorneiosDisponiveis(torneiosIds);

        const salvo = localStorage.getItem(STORAGE_KEY);
        const inicial =
          salvo && torneiosIds.includes(salvo) ? salvo : torneiosIds[0] || null;

        setTorneioSelecionadoState(inicial);
      } catch (error) {
        console.error("Erro ao carregar torneio selecionado:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  function selecionarTorneio(torneioId: string) {
    setTorneioSelecionadoState(torneioId);
    localStorage.setItem(STORAGE_KEY, torneioId);
  }

  return { torneioSelecionado, torneiosDisponiveis, selecionarTorneio, groupId, loading };
}