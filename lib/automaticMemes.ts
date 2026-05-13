type MemeData = {

  text: string;

  image?: string;

};

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

}): MemeData | null {

  if (isLeader) {

    const memes: MemeData[] = [

      {

        text:
          "👑 Fontes indicam que você já negocia com a CBF."

      },

      {

        text:
          "😳 Suspeita de viagem no tempo detectada."

      },

      {

        text:
          "⚽ Especialistas analisam como você sabe tanto."

      }

    ];

    return memes[
      Math.floor(
        Math.random() * memes.length
      )
    ];

  }

  if (isLastPlace) {

    const memes: MemeData[] = [

      {

        text:
          "🚨 Estatísticos confirmam: você entende menos de futebol que um cone."

      },

      {

        text:
          "🤣 Sua estratégia parece baseada em horóscopo."

      },

      {

        text:
          "📉 Seu desempenho preocupa até a Mãe Diná."

      }

    ];

    return memes[
      Math.floor(
        Math.random() * memes.length
      )
    ];

  }

  if (exactScore) {

    const memes: MemeData[] = [

      {

        text:
          "🔥 Acerto criminosamente preciso."

      },

      {

        text:
          "😳 Claramente alguém viu o jogo antes."

      },

      {

        text:
          "🏆 Apostas ilegais talvez expliquem isso."

      },

     

    ];

    return memes[
      Math.floor(
        Math.random() * memes.length
      )
    ];

  }

  if (crazyBet) {

    const memes: MemeData[] = [

      {

        text:
          "🚨 FIFA abriu investigação após esse placar."

      },

      {

        text:
          "🤣 Nem no videogame isso aconteceria."

      },

      {

        text:
          "⚽ Seu palpite foi encaminhado ao VAR por insanidade."

      },

      {

        text:
          "Suas apostas nos levam à pergunta mais importante da humanidade: A QUE PONTO CHEGAMOS???",

        image:
          "/a-que-ponto-chegamos.png"

      },

      {

        text:
          "Chamem o VAR, o PMSP e um exorcista!!!",

        image:
          "/aquepontochegamos.png"

      }

    ];

    return memes[
      Math.floor(
        Math.random() * memes.length
      )
    ];

  }

  return null;

}