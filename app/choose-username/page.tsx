"use client";

import { useState } from "react";

import { auth, db } from "../../lib/firebase";

import { doc, setDoc, getDoc } from "firebase/firestore";

import { useRouter } from "next/navigation";

export default function ChooseUsernamePage() {

  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const invitedGroupId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("groupId")
      : null;

  async function salvarUsername() {

    const user = auth.currentUser;

    if (!user) {
      alert("Usuário não autenticado");
      return;
    }

    if (!nome.trim()) {
      alert("Digite seu nome completo 😄");
      return;
    }

    if (!username.trim()) {
      alert("Digite um apelido 😄");
      return;
    }

    try {

      setLoading(true);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const oldData = userSnap.exists() ? userSnap.data() : {};

      await setDoc(
        userRef,
        {
          ...oldData,

          uid: user.uid,

          email: user.email || "",

          nome: nome.trim(),

          username: username.trim(),

          ...(invitedGroupId && {
            activeGroupId: invitedGroupId,
            groups: [invitedGroupId]
          })
        },
        { merge: true }
      );

      router.push("/");

    } catch (error) {
      console.error(error);
      alert("Erro ao salvar cadastro 😥");
    } finally {
      setLoading(false);
    }

  }

  return (

    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md">

        <h1 className="text-3xl font-black mb-2">
          😎 Crie seu perfil
        </h1>

        <p className="text-zinc-400 mb-6">
          Seu nome aparecerá nos resultados e seu apelido no ranking da vergonha 😂
        </p>

        {/* NOME */}
        <label className="block text-sm font-semibold mb-1 text-zinc-300">
          Nome completo
        </label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: João Silva"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 outline-none mb-4"
        />

        {/* APELIDO */}
        <label className="block text-sm font-semibold mb-1 text-zinc-300">
          Apelido no bolão
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ex: Nostradamus FC"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 outline-none mb-6"
        />

        <button
          onClick={salvarUsername}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 transition rounded-2xl p-4 font-black text-black"
        >
          {loading ? "Salvando..." : "🔥 Continuar"}
        </button>

      </div>

    </main>

  );

}