"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";

import {
  useEffect,
  useState
} from "react";

import {
  auth
} from "../lib/firebase";

export default function LoginCard() {

  const [user, setUser] =
    useState<User | null>(null);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(currentUser);

        }
      );

    return () => unsubscribe();

  }, []);

  async function loginGoogle() {

    const provider =
      new GoogleAuthProvider();

    await signInWithPopup(
      auth,
      provider
    );

  }

  async function logout() {

    localStorage.clear();
  
    await signOut(auth);
  
    window.location.reload();
  
  }

  return (

    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">

      {!user && (

        <div>

          <h2 className="text-xl font-black mb-4">
            🔐 Entrar
          </h2>

          <button
            onClick={loginGoogle}
            className="w-full bg-white hover:bg-zinc-200 transition text-black font-bold rounded-xl p-3"
          >
            Entrar com Google
          </button>

        </div>

      )}

      {user && (

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            {user.photoURL && (

              <img
                src={user.photoURL}
                alt="User"
                className="w-12 h-12 rounded-full"
              />

            )}

            <div>

              <p className="font-black">
                {user.displayName}
              </p>

              <p className="text-zinc-400 text-sm">
                {user.email}
              </p>

            </div>

          </div>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 transition text-black font-bold rounded-xl px-4 py-2 text-sm"
          >
            Sair
          </button>

        </div>

      )}

    </div>

  );

}