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
  updateDoc,
  doc,
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";

const reactionEmojis = [

    "👍", // curti
    "❤️", // amei
    "😂", // ri muito
    "🤣", // gargalhei
    "🔥", // brabo
    "👏", // aplausos
    "🤡", // pipocou
    "😡", // revoltado
    "😭", // chorou
    "👎", // discordo
    "🐐", // goat / craque
    "🧠", // gênio
    "💩", // fala merda
    "🍿", // treta
    "⚽", // futebol raiz
    "🏆", // campeão
    "🍼", // freguês
    "💸", // comprou o juiz
    "🫏", // bagre
    "🚨", // polêmica
  
  ];

export default function CentralCorneta({
  ligaId,
  usuarios,
}) {



    const [menuAbertoId, setMenuAbertoId] =
    useState(null);

  const [mensagens, setMensagens] =
    useState([]);

  const [texto, setTexto] =
    useState("");

  const [destinoId, setDestinoId] =
    useState("");

  useEffect(() => {

    if (!ligaId) return;

    const q = query(

      collection(
        db,
        "ligas",
        ligaId,
        "mensagens"
      ),

      orderBy(
        "createdAt",
        "desc"
      ),

      limit(50)

    );

    const unsubscribe =
      onSnapshot(q, (snapshot) => {

        const lista =
          snapshot.docs.map((doc) => ({

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

      alert(
        "Escolha um destinatário"
      );

      return;

    }

    try {

      const usuarioAtual =
        auth.currentUser;

      const destino =
        usuarios.find(
          (u) =>
            u.id === destinoId
        );

      await addDoc(

        collection(
          db,
          "ligas",
          ligaId,
          "mensagens"
        ),

        {

          autorId:
            usuarioAtual.uid,

          autorNome:

            usuarioAtual.displayName ||

            usuarioAtual.email ||

            "Jogador",

          destinoId,

          destinoNome:
            destino?.nome ||
            "Jogador",

          texto:
            texto.trim(),

          reactions: {},

          createdAt:
            serverTimestamp(),

        }

      );

      setTexto("");

      setDestinoId("");

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao enviar mensagem"
      );

    }

  }

 async function reagirMensagem(
  mensagem,
  emoji
) {

  try {

    const usuarioAtual =
      auth.currentUser;

    if (!usuarioAtual) return;

    const reactions =
      mensagem.reactions || {};

    const novoObjeto = {};

    // remove reação antiga
    Object.keys(reactions)
      .forEach((key) => {

      novoObjeto[key] =
        reactions[key].filter(
          (user) =>
            user.uid !==
            usuarioAtual.uid
        );

    });

    // verifica se já reagiu
    const jaReagiu =
      reactions[emoji]?.some(
        (user) =>
          user.uid ===
          usuarioAtual.uid
      );

    // adiciona nova reação
    if (!jaReagiu) {

      if (!novoObjeto[emoji]) {
        novoObjeto[emoji] = [];
      }

      novoObjeto[emoji].push({

        uid:
          usuarioAtual.uid,

        nome:
          usuarioAtual.displayName ||

          usuarioAtual.email ||

          "Jogador"

      });

    }

    await updateDoc(

      doc(
        db,
        "ligas",
        ligaId,
        "mensagens",
        mensagem.id
      ),

      {
        reactions:
          novoObjeto
      }

    );

    // FECHA MENU
    setMenuAbertoId(null);

  } catch (error) {

    console.error(error);

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
            setDestinoId(
              e.target.value
            )
          }
          className="bg-zinc-800 border border-zinc-700 rounded-lg p-2"
        >

          <option value="">
            Escolha o alvo da zoeira
          </option>

          {usuarios.map((usuario) => (

            <option
              key={usuario.id}
              value={usuario.id}
            >

              {usuario.nome}

            </option>

          ))}

        </select>

        <textarea
          value={texto}
          onChange={(e) =>
            setTexto(
              e.target.value
            )
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
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg transition"
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

<div className="flex justify-between items-start gap-3 mb-2">

<div className="text-sm text-yellow-400 font-semibold">

  {"De: "}
  {mensagem.autorNome}

  {" →→→ "}

  {"Para: "}
  {mensagem.destinoNome}

</div>

<div className="relative shrink-0">

  <button
    onClick={() =>

      setMenuAbertoId(

        menuAbertoId === mensagem.id
          ? null
          : mensagem.id

      )

    }
    className="
      bg-zinc-700 hover:bg-zinc-600
      px-3 py-1 rounded-full
      border border-zinc-600
      text-sm flex items-center gap-2
      transition-all whitespace-nowrap
    "
  >

    😈 Reagir

  </button>

  {menuAbertoId === mensagem.id && (

    <div
      className="
        absolute right-0 z-50 mt-2
        bg-zinc-900 border
        border-zinc-700
        rounded-2xl p-2
        flex flex-wrap gap-2
        w-64 shadow-2xl
      "
    >

      {reactionEmojis.map(
        (emoji) => (

        <button
          key={emoji}
          onClick={() =>
            reagirMensagem(
              mensagem,
              emoji
            )
          }
          className="
            text-2xl hover:scale-125
            transition-transform
          "
        >

          {emoji}

        </button>

      ))}

    </div>

  )}

</div>

</div>

            <div className="text-white break-words">

              {mensagem.texto}

            </div>

            {/* REAÇÕES */}

{/* REAÇÕES EXISTENTES */}

<div className="flex flex-wrap items-center gap-2 mt-4">

  {Object.entries(
    mensagem.reactions || {}
  ).map(([emoji, users]) => {

    if (!users.length) return null;

    const usuarioAtual =
      auth.currentUser;

    const reagiu =
      users.some(
        (user) =>
          user.uid ===
          usuarioAtual?.uid
      );

    return (

      <div
        key={emoji}
        className="relative group"
      >

        <button
          onClick={() =>
            reagirMensagem(
              mensagem,
              emoji
            )
          }
          className={`
            px-3 py-1 rounded-full
            text-sm border
            transition-all duration-200

            ${
              reagiu

              ? `
              bg-zinc-600
              border-zinc-500
              `

              : `
                bg-zinc-700
                border-zinc-600
                hover:bg-zinc-600
              `
            }
          `}
        >

          {emoji}
          {" "}
          {users.length}

        </button>

        {/* TOOLTIP */}

        <div
          className="
            absolute bottom-full left-1/2
            -translate-x-1/2 mb-2
            hidden group-hover:flex
            flex-col
            bg-black text-white
            text-xs rounded-lg
            px-3 py-2
            whitespace-nowrap
            z-50
            border border-zinc-700
          "
        >

          {users.map((user) => (

            <span key={user.uid}>

              {user.nome}

            </span>

          ))}

        </div>

      </div>

    );

  })}

</div>

          </div>

        ))}

      </div>

    </div>

  );

}