"use client";

import Link from "next/link";

import {
  useEffect,
  useState
} from "react";

import {
  db
} from "../../../lib/firebase";

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp
  } from "firebase/firestore";

type Meme = {
  id: string;
  text: string;
  targetUser: string;
};

export default function AdminMemesPage() {

  const [text, setText] =
    useState("");

  const [targetUser, setTargetUser] =
    useState("");

  const [memes, setMemes] =
    useState<Meme[]>([]);

  useEffect(() => {

    const q = query(

      collection(db, "memes"),

      orderBy("createdAt", "desc")

    );

    const unsubscribe =
      onSnapshot(q, (snapshot) => {

        const loadedMemes: Meme[] = [];

        snapshot.forEach((doc) => {

          const data = doc.data();

          loadedMemes.push({

            id: doc.id,

            text:
              data.text,

            targetUser:
              data.targetUser || ""

          });

        });

        setMemes(loadedMemes);

      });

    return () => unsubscribe();

  }, []);

  async function criarMeme() {

    if (!text) {

      alert(
        "Digite um meme 😄"
      );

      return;

    }

    await addDoc(
      collection(db, "memes"),
      {

        text,

        targetUser,

        active: true,

        createdAt:
          serverTimestamp()

      }
    );

    setText("");
    setTargetUser("");

  }

  async function excluirMeme(
    id: string
  ) {

    const confirmDelete =
      confirm(
        "Excluir meme?"
      );

    if (!confirmDelete) {
      return;
    }

    await deleteDoc(
      doc(db, "memes", id)
    );

  }

  return (

    <main className="min-h-screen bg-zinc-950 text-white p-4">

      <div className="max-w-4xl mx-auto">
      <div className="mb-6">

            <Link
              href="/admin/dashboard"
              className="
                inline-flex
                items-center
                gap-2
                bg-zinc-800
                hover:bg-zinc-700
                transition
                px-5
                py-3
                rounded-2xl
                font-bold
              "
            >
              ← Dashboard
            </Link>

            </div>

        <div className="flex items-center justify-between mb-6">

          <h1 className="text-2xl font-black">
            🤣 Central de Memes
          </h1>


        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 mb-6">

          <div>

            <label className="block text-sm text-zinc-400 mb-2">

              Meme

            </label>

            <textarea
              value={text}
              onChange={(e) =>
                setText(
                  e.target.value
                )
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              rows={4}
            />

          </div>

          <div>

            <label className="block text-sm text-zinc-400 mb-2">

              Usuário alvo (opcional)

            </label>

            <input
              value={targetUser}
              onChange={(e) =>
                setTargetUser(
                  e.target.value
                )
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              placeholder="Ex: Claudio"
            />

          </div>

          <button
            onClick={criarMeme}
            className="w-full bg-green-500 hover:bg-green-600 transition text-black font-black rounded-xl p-3"
          >
            🚀 Criar Meme
          </button>

        </div>

        <div className="space-y-3">

          {memes.map((meme) => (

            <div
              key={meme.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between items-start gap-4"
            >

              <div>

                <p className="font-bold">
                  🤣 {meme.text}
                </p>

                {meme.targetUser && (

                  <p className="text-purple-400 text-sm mt-2">

                    🎯 Alvo:
                    {" "}
                    {meme.targetUser}

                  </p>

                )}

              </div>

              <button
                onClick={() =>
                  excluirMeme(meme.id)
                }
                className="bg-red-500 hover:bg-red-600 transition px-3 py-2 rounded-xl text-black font-bold text-sm"
              >
                Excluir
              </button>

            </div>

          ))}

        </div>

      </div>

    </main>

  );

}