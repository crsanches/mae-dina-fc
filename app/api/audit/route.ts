import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

export async function GET() {
  const snapshot = await adminDb.collection("bets").get();
  const total = snapshot.size;

  type BetDoc = {
    id: string;
    uid?: string;
    userName?: string;
    username?: string;
    nome?: string;
    match?: string;
    groupId?: string;
  };

  const semUid: BetDoc[] = [];
  const semMatch: BetDoc[] = [];
  const porUid: Record<string, { usernames: Set<string>; count: number }> = {};

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
        porUid[bet.uid] = { usernames: new Set(), count: 0 };
      }
      const nome = bet.username || bet.userName || bet.nome || "Anônimo";
      porUid[bet.uid].usernames.add(nome);
      porUid[bet.uid].count++;
    }
  });

  const inconsistentes = Object.entries(porUid)
    .filter(([, val]) => val.usernames.size > 1)
    .map(([uid, val]) => ({
      uid,
      usernames: [...val.usernames],
      totalApostas: val.count,
    }));

  return NextResponse.json({
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
    detalhesInconsistentes: inconsistentes,
  });
}