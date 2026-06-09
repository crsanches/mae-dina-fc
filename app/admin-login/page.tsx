"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function AdminLoginPage() {

  async function login() {

    try {

      await signInWithPopup(
        auth,
        googleProvider
      );

      window.location.href =
        "/admin";

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao fazer login"
      );

    }

  }

  return (

    <main className="
      min-h-screen
      bg-zinc-950
      text-white
      flex
      items-center
      justify-center
    ">

      <div className="
        bg-zinc-900
        p-8
        rounded-3xl
        border
        border-zinc-800
        text-center
      ">

        <h1 className="
          text-3xl
          font-black
          mb-6
        ">
          🔐 Login Administrativo
        </h1>

        <button
          onClick={login}
          className="
            bg-blue-500
            hover:bg-blue-600
            px-6
            py-3
            rounded-xl
            font-bold
          "
        >
          Entrar com Google
        </button>

      </div>

    </main>

  );

}