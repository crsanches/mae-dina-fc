import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center justify-center py-8 text-center opacity-70">
      
      <Image
        src="/logo bazagliasanches.png"
        alt="Bazaglia Sanches Software"
        width={56}
        height={56}
        className="mb-3"
      />

      <span className="text-[12px] text-zinc-300">
        Powered by Bazaglia Sanches Software
      </span>

      <span className="text-[12px] text-zinc-500">
        Chegamos onde a IA não alcança.
      </span>
      <a
        href="mailto:crsanches@kinesis.com.br"
        className="mt-2 text-[12px] text-zinc-400 hover:text-white transition"
      >
        ✉️ Suporte: crsanches@kinesis.com.br
      </a>

    </footer>
  )
}