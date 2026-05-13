"use client";

import {

  useState

} from "react";

import {

  auth,

  db

} from "../../lib/firebase";

import {

  doc,

  setDoc,

  getDoc

} from "firebase/firestore";

import {

  useRouter

} from "next/navigation";

export default function ChooseUsernamePage() {

  const [username, setUsername] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const router =
    useRouter();

  async function salvarUsername() {

    const user =
      auth.currentUser;

    if (!user) {

      alert(
        "Usuário não autenticado"
      );

      return;

    }

    if (!username.trim()) {

      alert(
        "Digite um apelido 😄"
      );

      return;

    }

    try {

      setLoading(true);

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );

      const userSnap =
        await getDoc(userRef);

      const oldData =
        userSnap.exists()
          ? userSnap.data()
          : {};

      await setDoc(

        userRef,

        {

          ...oldData,

          uid:
            user.uid,

          email:
            user.email || "",

          username:
            username.trim()

        },

        {

          merge: true

        }

      );

      router.push("/");

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao salvar username 😥"
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md">

        <h1 className="text-3xl font-black mb-2">

          😎 Escolha seu apelido

        </h1>

        <p className="text-zinc-400 mb-6">

          Esse nome aparecerá no ranking mundial da vergonha 😂

        </p>

        <input
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          placeholder="Ex: Nostradamus FC"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 outline-none mb-4"
        />

        <button
          onClick={salvarUsername}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 transition rounded-2xl p-4 font-black text-black"
        >

          {loading
            ? "Salvando..."
            : "🔥 Continuar"}

        </button>

      </div>

    </main>

  );

}