"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  User
} from "firebase/auth";

import {
  useEffect,
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  doc,
  getDoc
} from "firebase/firestore";

import {
  auth,
  db
} from "../lib/firebase";

export default function LoginCard() {

  const LOGIN_EMAIL_ATIVO = false;
  const [user, setUser] =
    useState<User | null>(null);
  const [email, setEmail] =
    useState("");
  const router =
    useRouter();

  useEffect(() => {
    async function finalizarLogin() {
      if (
        isSignInWithEmailLink(
          auth,
          window.location.href
        )
      ) {

        let savedEmail =
          localStorage.getItem(
            "emailForSignIn"
          );
        if (!savedEmail) {
          savedEmail =
            window.prompt(
              "Digite seu email"
            ) || "";
        }
        try {
          await signInWithEmailLink(
            auth,
            savedEmail,
            window.location.href
          );

          localStorage.removeItem(
            "emailForSignIn"
          );

          window.location.href = "/";

        } catch (error) {
          console.error(error);
          alert(
            "Erro ao finalizar login 😥"
          );

        }

      }

    }

    finalizarLogin();

  }, []);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            setUser(null);
            return;
          }
  
          setUser(currentUser);
  
          const userRef =
  
            doc(
              db,
              "users",
              currentUser.uid
            );
  
          const userSnap =
            await getDoc(userRef);
  
          if (
            !userSnap.exists()
          ) {
  
            router.push(
              "/choose-username"
            );
  
            return;
  
          }
  
          const userData =
            userSnap.data();
  
          if (
            !userData.username
          ) {
  
            router.push(
              "/choose-username"
            );
  
            return;
  
          }
  
        }
  
      );
  
    return () => unsubscribe();
  
  }, [router]);

  async function loginGoogle() {

    const provider =
      new GoogleAuthProvider();

    await signInWithPopup(

      auth,

      provider

    );

    const currentUser =
      auth.currentUser;

    if (!currentUser) {
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

      if (
        !userSnap.exists()
      ) {
      
        router.push(
          "/choose-username"
        );
      
        return;
      
      }
      
      const userData =
        userSnap.data();
      
      if (
        !userData.username
      ) {
      
        router.push(
          "/choose-username"
        );
      
        return;
      
      }
      
      if (
        !userData.groupId
      ) {
      
        router.push(
          "/create-group"
        );
      
        return;
      
      }

  }

  async function entrarComEmail() {

    if (!email) {

      alert(
        "Digite um email 😄"
      );

      return;

    }

    try {

      const actionCodeSettings = {

        url:
          window.location.origin,

        handleCodeInApp:
          true

      };

      await sendSignInLinkToEmail(

        auth,

        email,

        actionCodeSettings

      );

      localStorage.setItem(

        "emailForSignIn",

        email

      );

      alert(
        "📧 Link enviado para seu email!"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao enviar email 😥"
      );

    }

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

          <div className="space-y-3">

            <button
              onClick={loginGoogle}
              className="w-full bg-white hover:bg-zinc-200 transition text-black font-bold rounded-xl p-3"
            >

              Entrar com Google

            </button>
            {LOGIN_EMAIL_ATIVO && (
  <>
    <input
      type="email"
      placeholder="Digite seu email"
      value={email}
      onChange={(e) =>
        setEmail(
          e.target.value
        )
      }
      className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 outline-none"
    />

    <button
      onClick={entrarComEmail}
      className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-2xl p-4 font-black"
    >

      ✉️ Entrar por Email

    </button>
  </>
)}
          </div>

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

                {user.displayName || "Usuário"}

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