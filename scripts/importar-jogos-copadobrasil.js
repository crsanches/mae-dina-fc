/**
 * importar-jogos-copadobrasil.js
 *
 * Cria os 16 jogos das oitavas de final da Copa do Brasil 2026
 * (8 confrontos, ida e volta) na coleção `games`, já com
 * torneioId: "copadobrasil2026".
 *
 * Não depende do config/appConfig.torneioAtivo — o torneioId é
 * fixo neste script, então você pode rodar isso a qualquer momento,
 * independente de já ter trocado a chave ou não.
 *
 * Uso:
 *   node importar-jogos-copadobrasil.js --dry-run   (só mostra o que criaria)
 *   node importar-jogos-copadobrasil.js --apply     (cria de verdade)
 */

const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const TORNEIO_ID = "copadobrasil2026";
const FASE = "Oitavas";

const DRY_RUN = !process.argv.includes("--apply");

// =========================
// ESCUDOS
// Já existentes em public/logos/ — faltam "Juventude" e "Fortaleza"
// (ainda sem arquivo; vão cair no fallback ⚽ até você adicionar
// public/logos/juventude.png e public/logos/fortaleza.png).
// =========================

const ESCUDOS = {
  "Vasco da Gama": "/logos/vasco.png",
  "Fluminense": "/logos/fluminense.png",
  "Atlético-MG": "/logos/atletico-mg.png",
  "Santos": "/logos/santos.png",
  "Remo": "/logos/remo.png",
  "Palmeiras": "/logos/palmeiras.png",
  "Mirassol": "/logos/mirassol.png",
  "Grêmio": "/logos/gremio.png",
  "Chapecoense": "/logos/chapecoense.png",
  "Cruzeiro": "/logos/cruzeiro.png",
  "Internacional": "/logos/internacional.png",
  "Corinthians": "/logos/corinthians.png",
  "Athletico-PR": "/logos/athletico-pr.png",
  "EC Vitória": "/logos/vitoria.png",
  "Juventude": "/logos/juventude.png",
  "Fortaleza": "/logos/fortaleza.png",
};

// =========================
// JOGOS (ida e volta)
// =========================

const jogos = [
  // ── Jogo 1 (ida) ──
  /*
  { teamA: "Vasco da Gama", teamB: "Fluminense", matchDate: "2026-08-01T17:30" },
  { teamA: "Atlético-MG", teamB: "Juventude", matchDate: "2026-08-01T19:30" },
  { teamA: "Santos", teamB: "Remo", matchDate: "2026-08-01T21:00" },
  { teamA: "Palmeiras", teamB: "Fortaleza", matchDate: "2026-08-02T16:00" },
  { teamA: "Mirassol", teamB: "Grêmio", matchDate: "2026-08-02T18:00" },
  { teamA: "Chapecoense", teamB: "Cruzeiro", matchDate: "2026-08-02T18:30" },
  { teamA: "Internacional", teamB: "Corinthians", matchDate: "2026-08-02T19:30" },
  { teamA: "Athletico-PR", teamB: "EC Vitória", matchDate: "2026-08-03T21:00" },

  // ── Jogo 2 (volta) ──
  { teamA: "Juventude", teamB: "Atlético-MG", matchDate: "2026-08-04T19:30" },
  { teamA: "Remo", teamB: "Santos", matchDate: "2026-08-04T21:30" },
  { teamA: "Cruzeiro", teamB: "Chapecoense", matchDate: "2026-08-05T19:00" },
  { teamA: "Grêmio", teamB: "Mirassol", matchDate: "2026-08-05T19:30" },
  { teamA: "Fluminense", teamB: "Vasco da Gama", matchDate: "2026-08-05T21:30" },
  */
  { teamA: "Cruzeiro", teamB: "Atlético-MG", matchDate: "2026-08-26T21:30" },
  { teamA: "Internacional", teamB: "Grêmio", matchDate: "2026-08-26T21:30" },
  { teamA: "Palmeiras", teamB: "Santos", matchDate: "2026-08-26T21:30" },
  { teamA: "Vasco da Gama", teamB: "EC Vitória", matchDate: "2026-08-26T21:30" },
  { teamA: "Atlético-MG", teamB: "Cruzeiro", matchDate: "2026-09-02T21:30" },
  { teamA: "Grêmio", teamB: "Internacional", matchDate: "2026-09-02T21:30" },
  { teamA: "Santos", teamB: "Palmeiras", matchDate: "2026-09-02T21:30" },
  { teamA: "EC VItória", teamB: "Vasco da Gama", matchDate: "2026-09-02T21:30" },
  /*
  { teamA: "EC Vitória", teamB: "Athletico-PR", matchDate: "2026-08-06T20:00" },
  { teamA: "Corinthians", teamB: "Internacional", matchDate: "2026-08-06T20:00" },
  */
];

async function main() {

  console.log(
    DRY_RUN
      ? "=== MODO DRY-RUN (nada será criado) ==="
      : "=== MODO APPLY (criando jogos de verdade) ==="
  );

  console.log(`Torneio: ${TORNEIO_ID} | Fase: ${FASE} | Total de jogos: ${jogos.length}\n`);

  const timesSemEscudo = new Set();
  jogos.forEach((jogo) => {
    if (!ESCUDOS[jogo.teamA]) timesSemEscudo.add(jogo.teamA);
    if (!ESCUDOS[jogo.teamB]) timesSemEscudo.add(jogo.teamB);
  });
  if (timesSemEscudo.size > 0) {
    console.log(
      `⚠ Sem escudo mapeado (vai usar ⚽): ${Array.from(timesSemEscudo).join(", ")}\n`
    );
  }

  let criados = 0;

  for (const jogo of jogos) {

    const match = `${jogo.teamA} x ${jogo.teamB}`;

    console.log(`  ${jogo.matchDate}  —  ${match}`);

    if (DRY_RUN) {
      criados++;
      continue;
    }

    await db.collection("games").add({
      match,
      teamA: jogo.teamA,
      teamB: jogo.teamB,
      emojiA: ESCUDOS[jogo.teamA] || "⚽",
      emojiB: ESCUDOS[jogo.teamB] || "⚽",
      fase: FASE,
      matchDate: jogo.matchDate,
      torneioId: TORNEIO_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    criados++;
  }

  console.log(
    `\n${DRY_RUN ? "Seriam criados" : "Criados"}: ${criados} jogo(s).`
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao importar jogos:", err);
  process.exit(1);
});