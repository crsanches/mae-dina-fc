"use client";

type Props = {
  ranking: {
    nome: string;
    pontos: number;
  }[];
};

export default function ShareRanking({
  ranking
}: Props) {

  function compartilhar() {

    const texto = `
🏆 Ranking Mãe Diná FC

${ranking
  .map((user, index) => {

    const medalha =
      index === 0
        ? "🥇"
        : index === 1
        ? "🥈"
        : index === 2
        ? "🥉"
        : "⚽";

    return `${medalha} ${user.nome} — ${user.pontos} pts`;

  })
  .join("\n")}

🤡 Pé frio oficial:
${ranking[ranking.length - 1]?.nome}

⚽🔥
`;

    navigator.clipboard.writeText(texto);

    alert(
      "Ranking copiado 😎\nCole no WhatsApp."
    );

  }

  return (

    <button
      onClick={compartilhar}
      className="w-full bg-green-500 hover:bg-green-600 transition rounded-2xl p-4 font-black text-black"
    >
      📤 Compartilhar Ranking
    </button>

  );
}