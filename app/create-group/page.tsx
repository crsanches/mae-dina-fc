"use client";

import {
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import Link from "next/link";

import {
  auth,
  db
} from "../../lib/firebase";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

export default function CreateGroupPage() {

  const router =
    useRouter();

  const [groupName, setGroupName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function criarGrupo() {

    if (!groupName.trim()) {

      alert(
        "Digite um nome para o grupo 😄"
      );

      return;

    }

    const user =
      auth.currentUser;

    if (!user) {

      alert(
        "Usuário não autenticado"
      );

      return;

    }

    try {

      setLoading(true);

      // 🚀 cria grupo
      const groupRef =
        await addDoc(
          collection(db, "groups"),
          {

            name:
              groupName,

            ownerId:
              user.uid,

            createdAt:
              serverTimestamp()

          }
        );

      // 🚀 cria usuário
      await setDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {
      
          uid:
            user.uid,
      
          displayName:
            user.displayName || "Anônimo",
      
            groupId:
            groupRef.id,
          
          activeGroupId:
            groupRef.id,
          
          groups:
            arrayUnion(
              groupRef.id
            )
      
        },
        {
      
          merge: true
      
        }
      );

      // 🚀 redirect
      router.push("/");

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao criar grupo 😥"
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        
        <div className="mb-6">

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 transition px-5 py-3 rounded-2xl font-bold"
        >

          ← Voltar

        </Link>

        </div>


        <h1 className="text-3xl font-black mb-2">

          🚀 Criar Grupo

        </h1>

        <p className="text-zinc-400 mb-6">

          Crie sua liga 😄

        </p>

        <div className="space-y-4">

          <input
            value={groupName}
            onChange={(e) =>
              setGroupName(
                e.target.value
              )
            }
            placeholder="Ex: Liga dos Programadores"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 outline-none focus:border-green-500"
          />

          <button
            onClick={criarGrupo}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 transition rounded-2xl p-4 font-black text-black"
          >

            {loading
              ? "Criando..."
              : "🔥 Criar Grupo"}

          </button>

        </div>

      </div>

    </main>

  );

}