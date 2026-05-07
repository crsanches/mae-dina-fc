"use client";

import { useEffect, useState } from "react";

export default function LoginCard() {

  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");

  function salvarNome() {

    if (!name.trim()) {
      return;
    }

    localStorage.setItem(
      "mae-dina-user",
      name
    );

    setSavedName(name);

  }

  useEffect(() => {

    const storedName =
      localStorage.getItem("mae-dina-user");

    if (storedName) {
      setSavedName(storedName);
    }

  }, []);

  if (savedName) {

    return (

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

        <p className="text-zinc-400 text-sm mb-2">
          Apostador conectado
        </p>

        <h2 className="text-3xl font-black">
          😎 {savedName}
        </h2>

      </div>

    );

  }

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

      <h2 className="text-2xl font-black mb-4">
        👤 Quem é você?
      </h2>

      <div className="flex gap-3">

        <input
          type="text"
          placeholder="Digite seu nome"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 outline-none"
        />

        <button
          onClick={salvarNome}
          className="bg-green-500 hover:bg-green-600 px-4 rounded-xl font-bold text-black"
        >
          Entrar
        </button>

      </div>

    </div>

  );
}