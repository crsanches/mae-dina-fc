import Image from "next/image";


export default function Header() {

  return (

    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">

    <div className="max-w-4xl mx-auto px-4 py-4 text-center">

        {/* TÍTULO */}

        <div className="flex items-center justify-center gap-3">

          <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">

            <span>⚽</span>

            <span>
              Mãe Diná FC
            </span>

            <span>⚽</span>

          </h1>

          <Image
            src="/icon.png"
            alt="Mãe Diná FC"
            width={52}
            height={52}
            className="rounded-xl"
          />

        </div>

        {/* SUBTÍTULO */}

        <p className="text-zinc-400 text-sm md:text-base mt-2">

          O único bolão onde errar feio também vira troféu.

        </p>

      </div>
      <div className="mt-3">

  

</div>

    </header>

  );

}