export function getAutomaticMeme({
    isLeader,
    isLastPlace,
    exactScore,
    crazyBet
  }: {
    isLeader: boolean;
    isLastPlace: boolean;
    exactScore: boolean;
    crazyBet: boolean;
  }) {
  
    if (isLeader) {
  
      const memes = [
  
        "👑 Fontes indicam que você já negocia com a CBF.",
  
        "😳 Suspeita de viagem no tempo detectada.",
  
        "⚽ Especialistas analisam como você sabe tanto."
  
      ];
  
      return memes[
        Math.floor(
          Math.random() * memes.length
        )
      ];
  
    }
  
    if (isLastPlace) {
  
      const memes = [
  
        "🚨 Estatísticos confirmam: você entende menos de futebol que um cone.",
  
        "🤣 Sua estratégia parece baseada em horóscopo.",
  
        "📉 Seu desempenho preocupa até a Mãe Diná."
  
      ];
  
      return memes[
        Math.floor(
          Math.random() * memes.length
        )
      ];
  
    }
  
    if (exactScore) {
  
      const memes = [
  
        "🔥 Acerto criminosamente preciso.",
  
        "😳 Claramente alguém viu o jogo antes.",
  
        "🏆 Apostas ilegais talvez expliquem isso."
  
      ];
  
      return memes[
        Math.floor(
          Math.random() * memes.length
        )
      ];
  
    }
  
    if (crazyBet) {
  
      const memes = [
  
        "🚨 FIFA abriu investigação após esse placar.",
  
        "🤣 Nem no videogame isso aconteceria.",
  
        "⚽ Seu palpite foi encaminhado ao VAR por insanidade."
  
      ];
  
      return memes[
        Math.floor(
          Math.random() * memes.length
        )
      ];
  
    }
  
    return null;
  
  }