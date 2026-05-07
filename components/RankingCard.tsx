type Props = {
    nome: string;
    pontos: number;
    emoji: string;
    destaque?: boolean;
  };
  
  export default function RankingCard({
    nome,
    pontos,
    emoji,
    destaque
  }: Props) {
  
    return (
      <div
        className={`
          flex justify-between items-center rounded-2xl p-4
          ${destaque
            ? "bg-red-950 border border-red-500"
            : "bg-zinc-800"
          }
        `}
      >
  
        <span>
          {emoji} {nome}
        </span>
  
        <span
          className={`font-bold ${
            destaque
              ? "text-red-400"
              : "text-green-400"
          }`}
        >
          {pontos} pts
        </span>
  
      </div>
    );
  }