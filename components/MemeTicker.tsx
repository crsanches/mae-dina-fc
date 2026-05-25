"use client";

type Props = {
  memes: {
    text: string;
    image?: string;
  }[];
};

export default function MemeTicker({
  memes
}: Props) {

  if (!memes.length) {
    return null;
  }

  const loopMemes = [
    ...memes,
    ...memes
  ];

  return (

    <div className="
      sticky
      top-0
      z-50
      w-full
      overflow-hidden
      bg-black/90
      border-b
      border-zinc-800
      backdrop-blur-md
    ">

      <div className="
        flex
        w-max
        animate-marquee
        gap-4
        py-2
        px-4
      ">

        {loopMemes.map((meme, index) => (

          <div
            key={index}
            className="
              flex
              items-center
              gap-3
              min-w-max
              bg-zinc-900
              border
              border-zinc-700
              rounded-full
              px-4
              py-2
              shadow-lg
            "
          >

            {meme.image && (

              <img
                src={meme.image}
                alt="meme"
                className="
                  w-10
                  h-10
                  rounded-full
                  object-cover
                "
              />

            )}

            <p className="
              text-sm
              font-bold
              whitespace-nowrap
              text-yellow-300
            ">

              😂 {meme.text}

            </p>

          </div>

        ))}

      </div>

    </div>

  );

}