"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";

export default function CentralCorneta({
  ligaId,
  usuarios,
}) {

  const [mensagens, setMensagens] = useState([]);

  const [texto, setTexto] = useState("");

  const [destinoId, setDestinoId] = useState("");

  useEffect(() => {

    if (!ligaId) return;

    const q = query(
      collection(db, "ligas", ligaId, "mensagens"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMensagens(lista);

    });

    return () => unsubscribe();

  }, [ligaId]);

  async function enviarMensagem() {

    if (!texto.trim()) return;

    if (!destinoId) {
      alert("Escolha um destinatário");
      return;
    }

    try {

      const usuarioAtual = auth.currentUser;

      const destino = usuarios.find(
        (u) => u.id === destinoId
      );

      await addDoc(
        collection(db, "ligas", ligaId, "mensagens"),
        {
          autorId: usuarioAtual.uid,
          autorNome:
          usuarioAtual.displayName ||
          usuarioAtual.email ||
          "Jogador",

          destinoId,
          destinoNome:
            destino?.nome || "Jogador",

          texto: texto.trim(),

          createdAt: serverTimestamp(),
        }
      );

      setTexto("");
      setDestinoId("");

    } catch (error) {

      console.error(error);

      alert("Erro ao enviar mensagem");
    }
  }

  return (

    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700 mt-4">

            <div className="flex items-center gap-3 mb-4">

            <div className="text-5xl">
            📢
            </div>

            <div>

            <h2 className="text-2xl font-black text-yellow-400">
                Central da Corneta
            </h2>

            <p className="text-zinc-400 text-sm">
                A zoeira é pública e permanente 😈
            </p>

            </div>

            </div>
      <div className="flex flex-col gap-2 mb-4">

        <select
          value={destinoId}
          onChange={(e) =>
            setDestinoId(e.target.value)
          }
          className="bg-zinc-800 border border-zinc-700 rounded-lg p-2"
        >

          <option value="">
            Escolha o alvo da zoeira
          </option>

          {usuarios.map((usuario) => {


                return (

                <option
                    key={usuario.id}
                    value={usuario.id}
                >
                    {usuario.nome}
                </option>

                );

                })}

        </select>

        <textarea
          value={texto}
          onChange={(e) =>
            setTexto(e.target.value)
          }
          maxLength={120}
          rows={2}
          placeholder="Mande sua provocação..."
          className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 resize-none"
        />

        <div className="flex justify-between items-center text-sm text-zinc-400">

          <span>
            {texto.length}/120
          </span>

          <button
            onClick={enviarMensagem}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg"
          >
            Enviar
          </button>

        </div>

      </div>

      <div className="flex flex-col gap-3">

        {mensagens.map((mensagem) => (

          <div
            key={mensagem.id}
            className="bg-zinc-800 rounded-2xl p-4 border border-zinc-700"
          >

            <div className="text-sm text-yellow-400 font-semibold mb-1">

              {"De:"}{mensagem.autorNome}
              {" →→→"}
              {"Para:"} {mensagem.destinoNome}

            </div>

            <div className="text-white break-words">
              {mensagem.texto}
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}