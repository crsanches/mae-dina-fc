"use client";

import { useEffect, useState } from "react";

import {
  useParams,
  useRouter
} from "next/navigation";

import {
  auth,
  db
} from "../../../lib/firebase";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup
} from "firebase/auth";

import {
  arrayUnion,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

type GroupData = {
  name: string;
};

export default function InvitePage() {

  const params =
    useParams();

  const router =
    useRouter();

  const groupId =
    params.groupId as string;

  const [groupName, setGroupName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

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

        setMessage(
          "❌ Liga não encontrada"
        );

        setLoading(false);

        return;

      }

      const groupData =
        groupSnap.data() as GroupData;

      setGroupName(
        groupData.name
      );

      setLoading(false);

    } catch (error) {

      console.error(error);

      setMessage(
        "Erro ao carregar convite 😥"
      );

      setLoading(false);

    }

  }

  async function entrarNaLiga() {

    try {

      setLoading(true);

      let currentUser =
        auth.currentUser;

      if (!currentUser) {

        const provider =
          new GoogleAuthProvider();

        const result =
          await signInWithPopup(
            auth,
            provider
          );

        currentUser =
          result.user;

      }

      if (!currentUser) {

        setMessage(
          "Erro ao autenticar 😥"
        );

        setLoading(false);

        return;

      }

      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );

      const userSnap =
        await getDoc(userRef);

      if (!userSnap.exists()) {

        setMessage(
          "⚠️ Finalize seu cadastro primeiro."
        );

        router.push(
          "/choose-username"
        );

        return;

      }

      const userData =
        userSnap.data();

      const currentGroups =
        userData.groups || [];

      if (
        currentGroups.includes(
          groupId
        )
      ) {

        await updateDoc(
          userRef,
          {

            activeGroupId:
              groupId,

            groupId:
              groupId

          }
        );

        setMessage(
          "😄 Você já participa desta liga!"
        );

        setTimeout(() => {

          router.push("/");

        }, 1500);

        return;

      }

      await updateDoc(
        userRef,
        {

          groups:
            arrayUnion(
              groupId
            ),

          activeGroupId:
            groupId,

          groupId:
            groupId

        }
      );

      setMessage(
        "🎉 Você entrou na liga!"
      );

      setTimeout(() => {

        router.push("/");

      }, 1500);

    } catch (error) {

      console.error(error);

      setMessage(
        "Erro ao entrar na liga 😥"
      );

      setLoading(false);

    }

  }

  useEffect(() => {

    async function init() {
  
      await carregarGrupo();
  
    }
  
    init();
  
  }, [groupId]);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {

          if (!user) {
            return;
          }

          const userRef =
            doc(
              db,
              "users",
              user.uid
            );

          const userSnap =
            await getDoc(userRef);

          if (
            !userSnap.exists()
          ) {
            return;
          }

          const userData =
            userSnap.data();

          if (
            userData.groups?.includes(
              groupId
            )
          ) {

            setMessage(
              "😄 Você já participa desta liga!"
            );

          }

        }
      );

    return () => unsubscribe();

  }, [groupId]);

  if (loading) {

    return (

      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center max-w-md w-full">

          <p className="text-xl font-black animate-pulse">

            🚀 Carregando convite...

          </p>

        </div>

      </main>

    );

  }

  return (

    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

        <div className="text-center mb-6">

          <div className="text-6xl mb-4">
            🏆
          </div>

          <h1 className="text-3xl font-black mb-3">

            Convite para Liga

          </h1>

          <p className="text-zinc-400">

            Você foi convidado para participar da liga:

          </p>

        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 mb-6 text-center">

          <p className="text-2xl font-black text-green-400 break-words">

            {groupName}

          </p>

        </div>

        {message && (

          <div className="mb-5 bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-center">

            <p className="font-bold">

              {message}

            </p>

          </div>

        )}

        <button
          onClick={entrarNaLiga}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 transition rounded-2xl p-4 font-black text-black text-lg"
        >

          🚀 Entrar na Liga

        </button>

      </div>

    </main>

  );

}