export default function Header() {
  return (
    <header className="bg-zinc-900 border-b border-zinc-800 p-5 sticky top-0 z-50">

      <div className="max-w-5xl mx-auto flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-black text-green-400">
            ⚽ Mãe Diná FC
          </h1>

          <p className="text-zinc-400 text-sm">
            O único bolão onde errar feio também vira troféu.
          </p>
        </div>

        <div className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full">
          🔥 Rodada 3
        </div>

      </div>

    </header>
  );
}