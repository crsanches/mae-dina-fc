import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

type BetDoc = {
  id: string;
  uid?: string;
  userName?: string;
  username?: string;
  nome?: string;
  match?: string;
  groupId?: string;
};

export async function auditarBets() {
  const snapshot = await getDocs(collection(db, "bets"));
  const total = snapshot.size;

  const semUid: BetDoc[] = [];
  const semMatch: BetDoc[] = [];

  const porUid: Record<string, { usernames: Set<string>; docs: BetDoc[] }> = {};

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const bet: BetDoc = {
      id: docSnap.id,
      uid: data.uid,
      userName: data.userName,
      username: data.username,
      nome: data.nome,
      match: data.match,
      groupId: data.groupId,
    };

    if (!bet.uid) semUid.push(bet);
    if (!bet.match) semMatch.push(bet);

    if (bet.uid) {
      if (!porUid[bet.uid]) {
        porUid[bet.uid] = { usernames: new Set(), docs: [] };
      }
      const resolvedUsername =
        bet.username || bet.userName || bet.nome || "Anônimo";
      porUid[bet.uid].usernames.add(resolvedUsername);
      porUid[bet.uid].docs.push(bet);
    }
  });

  const inconsistentes = Object.entries(porUid).filter(
    ([, val]) => val.usernames.size > 1
  );

  return {
    total,
    semUid: semUid.length,
    semMatch: semMatch.length,
    inconsistentes: inconsistentes.length,
    detalhesSemUid: semUid.map((b) => ({
      id: b.id,
      nome: b.username || b.userName || b.nome || "???",
      match: b.match || "???",
      groupId: b.groupId || "???",
    })),
    detalhesInconsistentes: inconsistentes.map(([uid, val]) => ({
      uid,
      usernames: [...val.usernames],
      totalApostas: val.docs.length,
    })),
  };
}