"use client";

import { useState } from "react";
import { exportBarRace } from "@/lib/exportBarRace";

export default function Page() {
  const [csv, setCsv] = useState("");

  async function gerar() {
    const data = await exportBarRace(
      "S45ZeKwxkKSeYTqq2p45"
    );

    setCsv(data);
  }

  function baixarCsv() {
    if (!csv) return;

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "sinergia-copa-2026-bar-race.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8 space-y-4">

      <button
        onClick={gerar}
        className="
          bg-blue-600
          text-white
          px-4
          py-2
          rounded
        "
      >
        Gerar CSV
      </button>

      {csv && (
        <button
          onClick={baixarCsv}
          className="
            bg-green-600
            text-white
            px-4
            py-2
            rounded
            ml-4
          "
        >
          Baixar CSV
        </button>
      )}

      <textarea
        value={csv}
        readOnly
        className="
          w-full
          h-[500px]
          border
          p-2
        "
      />
    </div>
  );
}