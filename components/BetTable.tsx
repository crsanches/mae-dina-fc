"use client";

// COMPONENTE DESATIVADO — o bloco "Meus Palpites" foi absorvido pelo UserStats.
// Mantido no projeto caso queira reativar no futuro: restaurar do git
// o useEffect com onSnapshot e a lógica de carregarApostas.
// IMPORTANTE: a versão antiga tinha onSnapshot em TODAS as bets do sistema
// (sem filtro de grupo), o que gerava custo alto de leituras no Firestore.
// Se reativar, filtrar por groupId + uid e trocar onSnapshot por getDocs.

export default function BetTable() {
  return null;
}