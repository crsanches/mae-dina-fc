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
  getDoc,
  updateDoc
} from "firebase/firestore";

import Link from "next/link";

type GroupData = {

  name: string;

};
type LoadedGroup = {

  id: string;

  name: string;

};

export default function GroupCard() {

  const [groupName, setGroupName] =
    useState("");

    type LoadedGroup = {

      id: string;
    
      name: string;
    
    };
    const [groups, setGroups] =
    useState<LoadedGroup[]>([]);

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
                  
                  !userData.activeGroupId
                ) {
                  return;
                }
              console.log(
                "USER DATA:",
                userData
              );
              const userGroups =
                userData.groups || [];

            

              const loadedGroups:
                LoadedGroup[] = [];

              for (const groupId of userGroups) {
                console.log(
                  "LOOP GROUP:",
                  groupId
                );
                const groupRef =
                  doc(
                    db,
                    "groups",
                    groupId
                  );

                const groupSnap =
                  await getDoc(groupRef);
                  console.log(
                    "GROUP EXISTS:",
                    groupId,
                    groupSnap.exists()
                  );
                if (
                  groupSnap.exists()
                ) {

                  const data =
                  groupSnap.data() as GroupData;

                loadedGroups.push({

                  id:
                    groupSnap.id,

                  name:
                    data.name

                });
                }

              }
              console.log(
                "GROUPS:",
                loadedGroups
              );

              setGroups(
                loadedGroups
              );

              const groupRef =
              doc(
                db,
                "groups",
                userData.activeGroupId
                //userData.groupId
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
      
                `${window.location.origin}/invite/${
                  userData.activeGroupId
                  //userData.groupId
                }`
      
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

  async function trocarGrupo(
    groupId: string
  ) {
  
    const currentUser =
      auth.currentUser;
  
    if (!currentUser) {
      return;
    }
  
    try {
  
      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );
  
      await updateDoc(
        userRef,
        {
  
          activeGroupId: groupId
  
        }
      );
  
      window.location.href = "/";
  
    } catch (error) {
  
      console.error(error);
  
      alert(
        "Erro ao trocar grupo 😥"
      );
  
    }
  
  }

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
  
      <div className="flex items-center justify-between mb-4">
  
        <div>
  
          <h2 className="text-xl font-black">
  
            🚀 Sua Liga
  
          </h2>
  
          <p className="text-zinc-400 text-sm mt-1">
  
            Convide amigos para a humilhação pública 😂
  
          </p>
  
        </div>
  
        <div className="bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-full text-xs font-bold text-zinc-300">
  
          👥 Liga Privada
  
        </div>
  
      </div>
  
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-5">
  
        <p className="text-3xl font-black text-green-400 break-words">
  
          {groupName}
  
        </p>

        <div className="mt-4">

  <select

    value={inviteLink.split("/").pop()}

    onChange={(e) =>
      trocarGrupo(
        e.target.value
      )
    }

    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white font-bold outline-none focus:border-green-500"
  >

    {groups.map((group) => (

      <option
        key={group.id}
        value={group.id}
      >

        {group.name}

      </option>

    ))}

  </select>

</div>
  
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  
        <button
          onClick={copiarConvite}
          className="w-full bg-green-500 hover:bg-green-600 transition text-black font-black rounded-2xl px-4 py-3 flex items-center justify-center"
        >
  
          🔗 Copiar Convite
  
        </button>
  
        <Link
          href="/create-group"
          className="w-full bg-zinc-800 hover:bg-zinc-700 transition text-white font-bold rounded-2xl px-4 py-3 flex items-center justify-center border border-zinc-700"
        >
  
          ➕ Criar Liga
  
        </Link>
  
      </div>
  
    </div>
  
  );

}