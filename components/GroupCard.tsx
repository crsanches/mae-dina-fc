"use client";

import {
  useEffect,
  useState
} from "react";

import {
  auth,
  db
} from "../lib/firebase";

import {
    onAuthStateChanged
  } from "firebase/auth";

import {
  doc,
  getDoc
} from "firebase/firestore";

type GroupData = {

  name: string;

};

export default function GroupCard() {

  const [groupName, setGroupName] =
    useState("");

  const [inviteLink, setInviteLink] =
    useState("");

    useEffect(() => {

        const unsubscribe =
          onAuthStateChanged(
            auth,
            async (user) => {
      
              if (!user) {
      
                setGroupName("");
      
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
                !userData.groupId
              ) {
                return;
              }
      
              const groupRef =
                doc(
                  db,
                  "groups",
                  userData.groupId
                );
      
              const groupSnap =
                await getDoc(groupRef);
      
              if (
                !groupSnap.exists()
              ) {
                return;
              }
      
              const groupData =
                groupSnap.data() as GroupData;
      
              setGroupName(
                groupData.name
              );
      
              setInviteLink(
      
                `${window.location.origin}/invite/${userData.groupId}`
      
              );
      
            }
          );
      
        return () => unsubscribe();
      
      }, []);

  async function copiarConvite() {

    try {

      await navigator.clipboard.writeText(
        inviteLink
      );

      alert(
        "Convite copiado 😄"
      );

    } catch {

      alert(
        "Erro ao copiar 😥"
      );

    }

  }

  if (!groupName) {
    return null;
  }

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

      <h2 className="text-xl font-black mb-2">

        🚀 Sua Liga

      </h2>

      <p className="text-2xl font-black text-green-400 mb-4">

        {groupName}

      </p>

      <button
        onClick={copiarConvite}
        className="bg-green-500 hover:bg-green-600 transition text-black font-black rounded-xl px-4 py-3"
      >

        🔗 Copiar Convite

      </button>

    </div>

  );

}