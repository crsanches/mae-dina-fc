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

    </div>

  );

}