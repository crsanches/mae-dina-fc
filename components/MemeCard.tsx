type Props = {
    mensagem: string;
  };
  
  export default function MemeCard({
    mensagem
  }: Props) {
  
    return (
      <div className="bg-gradient-to-r from-blue-500 to-yellow-500 rounded-3xl p-5 shadow-lg text-black">
  
        <h2 className="text-2xl font-black mb-3">
          🤡 Zoeira da Rodada
        </h2>
  
        <p className="text-lg font-bold">
          {mensagem}
        </p>
  
      </div>
    );
  }