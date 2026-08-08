import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export async function getTorneiosAtivos(): Promise<string[]> {
  const snap = await getDoc(doc(db, "config", "appConfig"));
  const data = snap.data();
  return data?.torneiosAtivos || [];
}