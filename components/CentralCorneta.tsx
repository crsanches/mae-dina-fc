"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";

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

import {
  auth,
  db,
} from "../lib/firebase";

/*
========================================
TIPOS
========================================
*/

type Usuario = {
  uid?: string;
  id?: string;
  username?: string;
  displayName?: string;
  nome?: string;
  email?: string;
  activeGroupId?: string;
};

type Props = {
  ligaId: string;
  usuarios?: Usuario[];
};

type ReactionUser = {
  uid: string;
  nome: string;
};

type Reactions = {
  [emoji: string]: ReactionUser[];
};

type Mensagem = {
  id: string;
  autorId?: string;
  autorNome: string;
  destinoId?: string;
  destinoNome: string;
  texto: string;
  reactions?: Reactions;
};

/*
========================================
REACTIONS
========================================
*/

const reactionEmojis = [
  "👍",
  "❤️",
  "😂",
  "🤣",
  "🔥",
  "👏",
  "🤡",
  "😡",
  "😭",
  "👎",
  "🐐",
  "🧠",
  "💩",
  "🍿",
  "⚽",
  "🏆",
  "🍼",
  "💸",
  "🫏",
  "🚨",
];

/*
========================================
COMPONENTE
========================================
*/

export default function CentralCorneta({
  ligaId,
  usuarios = [],
}: Props) {

  const usuariosTipados: Usuario[] =
    Array.isArray(usuarios)
      ? usuarios
      : [];

  /*
  ========================================
  STATES
  ========================================
  */

  const [menuAbertoId, setMenuAbertoId] =
    useState<string | null>(null);

  const [mensagens, setMensagens] =
    useState<Mensagem[]>([]);

  const [texto, setTexto] =
    useState("");

  const [destinoId, setDestinoId] =
    useState("");

  const [menuUsuariosAberto, setMenuUsuariosAberto] =
    useState(false);

  const menuUsuariosRef =
    useRef<HTMLDivElement | null>(null);

  /*
  ========================================
  CARREGAR MENSAGENS
  ========================================
  */

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

        const lista: Mensagem[] =

          snapshot.docs.map((docItem) => ({

            id: docItem.id,

            ...(docItem.data() as Omit<
              Mensagem,
              "id"
            >),

          }));

        setMensagens(lista);

      });

    return () => unsubscribe();

  }, [ligaId]);

  /*
  ========================================
  FILTRAR USUÁRIOS
  ========================================
  */

  const usuariosFiltrados = [

    ...new Map(

      usuariosTipados.map((u) => [

        u.uid || u.id,
        u,

      ])

    ).values(),

  ]

    .filter(

      (u) =>

        (
          u.uid ||
          u.id
        ) &&

        (
          u.uid ||
          u.id
        ) !== auth.currentUser?.uid

    )

    .sort((a, b) =>

      (

        a.username ||

        a.displayName ||

        a.nome ||

        a.email ||

        ""

      ).localeCompare(

        b.username ||

        b.displayName ||

        b.nome ||

        b.email ||

        ""

      )

    );

  /*
  ========================================
  ENVIAR MENSAGEM
  ========================================
  */

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

      if (!usuarioAtual) return;

      const destino =
        usuariosTipados.find(

          (u) =>

            (
              u.uid ||
              u.id
            ) === destinoId

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

            destino?.username ||

            destino?.displayName ||

            destino?.nome ||

            destino?.email ||

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

  /*
  ========================================
  REAGIR
  ========================================
  */

  async function reagirMensagem(
    mensagem: Mensagem,
    emoji: string
  ) {

    try {

      const usuarioAtual =
        auth.currentUser;

      if (!usuarioAtual) return;

      const reactions =
        mensagem.reactions || {};

      const novoObjeto: Reactions = {};

      Object.keys(reactions)
        .forEach((key) => {

          novoObjeto[key] =
            reactions[key].filter(

              (user: ReactionUser) =>

                user.uid !==
                usuarioAtual.uid

            );

        });

      const jaReagiu =

        reactions[emoji]?.some(

          (user: ReactionUser) =>

            user.uid ===
            usuarioAtual.uid

        );

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

            "Jogador",

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
            novoObjeto,

        }

      );

      setMenuAbertoId(null);

    } catch (error) {

      console.error(error);

    }

  }

  /*
  ========================================
  FECHAR MENU AO CLICAR FORA
  ========================================
  */

  useEffect(() => {

    function handleClickOutside(
      event: MouseEvent
    ) {

      if (

        menuUsuariosRef.current &&

        !menuUsuariosRef.current.contains(
          event.target as Node
        )

      ) {

        setMenuUsuariosAberto(false);

      }

    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);

  /*
  ========================================
  RENDER
  ========================================
  */

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

      {/* restante do JSX original permanece igual */}
      <div className="flex flex-col gap-3 mb-4">

  <div
    className="relative"
    ref={menuUsuariosRef}
  >

    <div
      className="
        bg-zinc-950
        border border-zinc-800
        rounded-2xl
        p-3
        flex items-center
        justify-between
        gap-3
      "
    >

      <div className="flex flex-col">

        <span className="text-xs text-zinc-500">

          🎯 Alvo da zoeira

        </span>

        <span className="font-bold text-white">

          {

            usuariosFiltrados.find(
              (u) =>

                (
                  u.uid ||
                  u.id
                ) === destinoId

            )?.username ||

            usuariosFiltrados.find(
              (u) =>

                (
                  u.uid ||
                  u.id
                ) === destinoId

            )?.displayName ||

            usuariosFiltrados.find(
              (u) =>

                (
                  u.uid ||
                  u.id
                ) === destinoId

            )?.nome ||

            "Mire no seu alvo 😈"

          }

        </span>

      </div>

      <button

        onClick={() =>

          setMenuUsuariosAberto(
            !menuUsuariosAberto
          )

        }

        className="
          bg-zinc-800
          hover:bg-zinc-700
          px-3 py-2
          rounded-xl
          text-sm
          transition-all
        "
      >

        🔄

      </button>

    </div>

    {menuUsuariosAberto && (

      <div
        className="
          absolute z-50 mt-2
          w-full
          max-h-64
          overflow-y-auto
          bg-zinc-900
          border border-zinc-700
          rounded-2xl
          p-2
          shadow-2xl
          flex flex-col gap-1
        "
      >

        {usuariosFiltrados.map(
          (usuario) => {

            const usuarioId =

              usuario.uid ||
              usuario.id;

            const usuarioNome =

              usuario.username ||

              usuario.displayName ||

              usuario.nome ||

              usuario.email ||

              "Jogador";

            return (

              <button

                key={usuarioId}

                onClick={() => {

                  setDestinoId(
                    usuarioId || ""
                  );

                  setMenuUsuariosAberto(
                    false
                  );

                }}

                className="
                  w-full
                  text-left
                  px-4 py-3
                  rounded-xl
                  hover:bg-zinc-800
                  transition-all
                  text-white
                "
              >

                {usuarioNome}

              </button>

            );

          }
        )}

      </div>

    )}

  </div>

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
    className="
      bg-zinc-800
      border border-zinc-700
      rounded-lg
      p-3
      resize-none
      text-white
    "
  />

  <div className="flex justify-between items-center text-sm text-zinc-400">

    <span>
      {texto.length}/120
    </span>

    <button
      onClick={enviarMensagem}
      className="
        bg-yellow-500
        hover:bg-yellow-400
        text-black
        font-bold
        px-4 py-2
        rounded-lg
        transition
      "
    >

      Enviar

    </button>

  </div>

</div>

<div className="flex flex-col gap-3">

  {mensagens.map((mensagem) => (

    <div
      key={mensagem.id}
      className="
        bg-zinc-800
        rounded-2xl
        p-4
        border border-zinc-700
      "
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
              bg-zinc-700
              hover:bg-zinc-600
              px-3 py-1
              rounded-full
              border border-zinc-600
              text-sm
              flex items-center gap-2
              transition-all
              whitespace-nowrap
            "
          >

            😈 Reagir

          </button>

          {menuAbertoId === mensagem.id && (

            <div
              className="
                absolute right-0
                z-50 mt-2
                bg-zinc-900
                border border-zinc-700
                rounded-2xl
                p-2
                flex flex-wrap
                gap-2
                w-64
                shadow-2xl
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
                      text-2xl
                      hover:scale-125
                      transition-transform
                    "
                  >

                    {emoji}

                  </button>

                )
              )}

            </div>

          )}

        </div>

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