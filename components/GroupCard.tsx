"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  auth,
  db,
} from "../lib/firebase";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc,
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

  const [groups, setGroups] =
    useState<LoadedGroup[]>([]);

  const [inviteLink, setInviteLink] =
    useState("");

  const [activeGroupId, setActiveGroupId] =
    useState("");

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(

        auth,

        async (user) => {

          if (!user) {

            setGroupName("");
            setGroups([]);
            setInviteLink("");
            setActiveGroupId("");

            return;

          }

          try {

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

            console.log(
              "USER DATA:",
              userData
            );

            const userGroups =
              userData.groups || [];

            const loadedGroups:
              LoadedGroup[] = [];

            const validGroupIds:
              string[] = [];

            for (
              const groupId of userGroups
            ) {

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
                    data.name,

                });

                validGroupIds.push(
                  groupId
                );

              }

            }

            console.log(
              "GROUPS:",
              loadedGroups
            );

            // limpa grupos mortos
            if (

              JSON.stringify(
                validGroupIds
              ) !==

              JSON.stringify(
                userGroups
              )

            ) {

              await updateDoc(
                userRef,
                {

                  groups:
                    validGroupIds,

                }
              );

            }

            setGroups(
              loadedGroups
            );

            let currentActiveGroupId =
              userData.activeGroupId;

            // se grupo ativo morreu,
            // troca para o primeiro válido
            if (

              !validGroupIds.includes(
                currentActiveGroupId
              )

            ) {

              currentActiveGroupId =
                validGroupIds[0] || "";

              if (
                currentActiveGroupId
              ) {

                await updateDoc(
                  userRef,
                  {

                    activeGroupId:
                      currentActiveGroupId,

                  }
                );

              }

            }

            setActiveGroupId(
              currentActiveGroupId
            );

            if (
              !currentActiveGroupId
            ) {
              return;
            }

            const activeGroupRef =
              doc(
                db,
                "groups",
                currentActiveGroupId
              );

            const activeGroupSnap =
              await getDoc(
                activeGroupRef
              );

            if (
              !activeGroupSnap.exists()
            ) {
              return;
            }

            const activeGroupData =
              activeGroupSnap.data() as GroupData;

            setGroupName(
              activeGroupData.name
            );

            setInviteLink(

              `${window.location.origin}/invite/${currentActiveGroupId}`

            );

          } catch (error) {

            console.error(error);

          }

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

          activeGroupId:
            groupId,

        }
      );

      setActiveGroupId(
        groupId
      );

      const group =
        groups.find(
          (g) =>
            g.id === groupId
        );

      if (group) {

        setGroupName(
          group.name
        );

      }

      setInviteLink(

        `${window.location.origin}/invite/${groupId}`

      );

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao trocar grupo 😥"
      );

    }

  }

  if (!groupName) {
    return null;
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

            value={activeGroupId}

            onChange={(e) =>
              trocarGrupo(
                e.target.value
              )
            }

            className="
              w-full
              bg-zinc-800
              border border-zinc-700
              rounded-2xl
              px-4 py-3
              text-white
              font-bold
              outline-none
              focus:border-green-500
            "
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
          className="
            w-full
            bg-green-500
            hover:bg-green-600
            transition
            text-black
            font-black
            rounded-2xl
            px-4 py-3
            flex items-center justify-center
          "
        >

          🔗 Copiar Convite

        </button>

        <Link
          href="/create-group"
          className="
            w-full
            bg-zinc-800
            hover:bg-zinc-700
            transition
            text-white
            font-bold
            rounded-2xl
            px-4 py-3
            flex items-center justify-center
            border border-zinc-700
          "
        >

          ➕ Criar Liga

        </Link>

      </div>

    </div>

  );

}