"use client";

import {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useRouter
} from "next/navigation";

import {
  auth,
  db
} from "../../../lib/firebase";

import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

type GroupData = {

  name: string;

  ownerId: string;

};

export default function InvitePage() {

  const params =
    useParams();

  const router =
    useRouter();

  const groupId =
    params.groupId as string;

  const [group, setGroup] =
    useState<GroupData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [joining, setJoining] =
    useState(false);

  useEffect(() => {

    async function carregarGrupo() {

      try {

        const groupRef =
          doc(
            db,
            "groups",
            groupId
          );

        const groupSnap =
          await getDoc(groupRef);

        if (
          !groupSnap.exists()
        ) {

          setGroup(null);

          setLoading(false);

          return;

        }
        setGroup(
            groupSnap.data() as GroupData
          );

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    }

    if (groupId) {

      carregarGrupo();

    }

  }, [groupId]);

  async function entrarNoGrupo() {

    const user =
      auth.currentUser;

    if (!user) {

      alert(
        "Faça login primeiro 😄"
      );

      return;

    }

    try {

      setJoining(true);

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );

      await updateDoc(
        userRef,
        {

          groupId

        }
      );

      router.push("/");

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao entrar no grupo 😥"
      );

    } finally {

      setJoining(false);

    }

  }

  if (loading) {

    return (

      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">

        <p className="text-zinc-400">
          Carregando grupo...
        </p>

      </main>

    );

  }

  if (!group) {

    return (

      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center max-w-md">

          <h1 className="text-2xl font-black mb-3">

            😥 Grupo não encontrado

          </h1>

          <p className="text-zinc-400">

            Esse convite pode estar inválido.

          </p>

        </div>

      </main>

    );

  }

  return (

    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full text-center">

        <div className="text-6xl mb-4">

          🚀

        </div>

        <h1 className="text-3xl font-black mb-2">

          Convite para Liga

        </h1>

        <p className="text-zinc-400 mb-6">

          Você foi convidado para entrar em:

        </p>

        <div className="bg-zinc-800 rounded-2xl p-4 mb-6">

          <p className="text-2xl font-black text-green-400">

            {group.name}

          </p>

        </div>

        <button
          onClick={entrarNoGrupo}
          disabled={joining}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 transition rounded-2xl p-4 font-black text-black"
        >

          {joining
            ? "Entrando..."
            : "🔥 Entrar na Liga"}

        </button>

      </div>

    </main>

  );

}