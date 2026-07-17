/**
 * Exporta a evolução de pontos do mãe-dina-fc (liga Sinergia Copa 2026)
 * no formato do Flourish (TSV), lendo a coleção `leagueHistory`.
 *
 * Uso:
 *   npm install firebase-admin   (se ainda não tiver)
 *   node exportar-flourish.js caminho/para/serviceAccountKey.json [docId]
 *
 *   - Se a coleção tiver só um documento, o docId é opcional.
 *   - Saída: flourish-pontos.tsv (abrir/colar direto no Flourish)
 */

const admin = require("firebase-admin");
const fs = require("fs");

const COLECAO = "leagueHistory";
const LIGA = "Sinergia";
const ARQUIVO_SAIDA = "flourish-pontos.tsv";

// Obs.: o leagueHistory já grava os pontos PONDERADOS pelos pesos
// de cada fase (verificado: frame 97 bate com o ranking oficial).
// Portanto o script lê os pontos direto, sem aplicar peso nenhum.

// Ordem EXATA das colunas na base atual do Flourish (26 participantes).
// Obs.: no leagueHistory existem também Vozinha, Jovino Ferrari, Osmir e
// NEY o RP — se quiser incluí-los no gráfico, basta adicioná-los aqui.
const ORDEM_COLUNAS = [
  "Arvid",
  "AvalloNini",
  "Cláudio Sanches",
  "Depay e Demãe",
  "Edinho",
  "Emerson Armellei",
  "Fartura FC",
  "Glaucio",
  "Hiroshi o Vidente",
  "Levi Machado",
  "Líder da porra toda!!!",
  "Mandarini",
  "MauMau",
  "Memphis da Fiel",
  "Menino Ney (Ianello)",
  "Niltão",
  "Octopus Edu Flores",
  "Passaro FC",
  "Pedro FC",
  "Rodrigo Q",
  "Rubinho",
  "SANTOS MEU AMOR",
  "Wilson",
  "Yuri Alberto",
  "Zé Bê",
  "🍙🍱 Saquê com Guaraná",
  "Vozinha",
  "Jovino Ferrari",
  "Osmir",
  "NEY o RP",
];

// Bandeiras para montar o rótulo "J01 🇲🇽 México x 🇿🇦 África do Sul"
const BANDEIRAS = {
  "México": "🇲🇽", "África do Sul": "🇿🇦", "Coreia do Sul": "🇰🇷", "Tchéquia": "🇨🇿",
  "Canadá": "🇨🇦", "Bósnia e Herzegovina": "🇧🇦", "Estados Unidos": "🇺🇸", "Paraguai": "🇵🇾",
  "Catar": "🇶🇦", "Suíça": "🇨🇭", "Brasil": "🇧🇷", "Marrocos": "🇲🇦", "Haiti": "🇭🇹",
  "Escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Austrália": "🇦🇺", "Turquia": "🇹🇷", "Alemanha": "🇩🇪", "Curaçao": "🇨🇼",
  "Holanda": "🇳🇱", "Japão": "🇯🇵", "Costa do Marfim": "🇨🇮", "Equador": "🇪🇨",
  "Suécia": "🇸🇪", "Tunísia": "🇹🇳", "Espanha": "🇪🇸", "Cabo Verde": "🇨🇻",
  "Bélgica": "🇧🇪", "Egito": "🇪🇬", "Arábia Saudita": "🇸🇦", "Uruguai": "🇺🇾",
  "Irã": "🇮🇷", "Nova Zelândia": "🇳🇿", "França": "🇫🇷", "Senegal": "🇸🇳",
  "Iraque": "🇮🇶", "Noruega": "🇳🇴", "Argentina": "🇦🇷", "Argélia": "🇩🇿",
  "Áustria": "🇦🇹", "Jordânia": "🇯🇴", "Portugal": "🇵🇹", "RD Congo": "🇨🇩",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croácia": "🇭🇷", "Gana": "🇬🇭", "Panamá": "🇵🇦",
  "Uzbequistão": "🇺🇿", "Colômbia": "🇨🇴", "Itália": "🇮🇹", "Nigéria": "🇳🇬",
  "Alemanha Oriental": "🇩🇪", "Costa Rica": "🇨🇷", "Honduras": "🇭🇳", "Polônia": "🇵🇱",
  "Ucrânia": "🇺🇦", "Gales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Camarões": "🇨🇲", "Mali": "🇲🇱",
};
const flag = (time) => BANDEIRAS[time.trim()] || "";

function rotuloDoJogo(step, match) {
  const num = String(step).padStart(2, "0");
  const partes = match.split(" x ");
  if (partes.length === 2) {
    const [a, b] = partes.map((s) => s.trim());
    const fa = flag(a), fb = flag(b);
    return `J${num} ${fa ? fa + " " : ""}${a} x ${fb ? fb + " " : ""}${b}`;
  }
  return `J${num} ${match}`;
}

async function main() {
  const keyPath = process.argv[2];
  const docIdArg = process.argv[3];
  if (!keyPath) {
    console.error("Uso: node exportar-flourish.js caminho/para/serviceAccountKey.json [docId]");
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))),
  });
  const db = admin.firestore();

  // Localiza o documento do histórico
  let doc;
  if (docIdArg) {
    doc = await db.collection(COLECAO).doc(docIdArg).get();
    if (!doc.exists) {
      console.error(`❌ Documento "${docIdArg}" não encontrado em ${COLECAO}.`);
      process.exit(1);
    }
  } else {
    const snap = await db.collection(COLECAO).get();
    if (snap.empty) {
      console.error(`❌ Coleção ${COLECAO} está vazia.`);
      process.exit(1);
    }
    if (snap.size > 1) {
      console.error(`⚠️ Há ${snap.size} documentos em ${COLECAO}. Especifique o docId:`);
      snap.docs.forEach((d) => console.error(`   - ${d.id}`));
      process.exit(1);
    }
    doc = snap.docs[0];
  }

  const frames = (doc.data().frames || []).slice().sort((a, b) => a.step - b.step);
  if (!frames.length) {
    console.error("❌ Nenhum frame encontrado no documento.");
    process.exit(1);
  }

  // Monta o TSV
  const out = [];
  out.push(["Nome", ...ORDEM_COLUNAS].join("\t"));
  out.push(["Liga", ...ORDEM_COLUNAS.map(() => LIGA)].join("\t"));

  const semBandeira = new Set();
  const usernamesForaDaBase = new Set();

  for (const frame of frames) {
    const pontos = {}; // username -> pontos acumulados (já ponderados pelo app)
    for (const r of frame.ranking || []) {
      pontos[r.username.trim()] = r.points;
      if (!ORDEM_COLUNAS.some((n) => n.trim() === r.username.trim())) {
        usernamesForaDaBase.add(r.username);
      }
    }
    // Verifica bandeiras faltantes
    frame.match.split(" x ").forEach((t) => {
      if (!flag(t)) semBandeira.add(t.trim());
    });

    const valores = ORDEM_COLUNAS.map((nome) => {
      const p = pontos[nome.trim()];
      if (p == null) {
        console.warn(`⚠️ J${frame.step}: "${nome}" sem pontos no ranking — célula vazia.`);
        return "";
      }
      return p;
    });
    out.push([rotuloDoJogo(frame.step, frame.match), ...valores].join("\t"));
  }

  fs.writeFileSync(ARQUIVO_SAIDA, out.join("\n"), "utf8");
  console.log(`✅ ${frames.length} jogos exportados para ${ARQUIVO_SAIDA}`);

  if (usernamesForaDaBase.size) {
    console.log("\nℹ️ Participantes no leagueHistory que NÃO estão nas colunas do Flourish:");
    usernamesForaDaBase.forEach((u) => console.log(`   - ${u}`));
    console.log("   (adicione em ORDEM_COLUNAS se quiser incluí-los no gráfico)");
  }
  if (semBandeira.size) {
    console.log("\nℹ️ Times sem bandeira no mapa BANDEIRAS (rótulo sai sem emoji):");
    semBandeira.forEach((t) => console.log(`   - ${t}`));
  }
}

main().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});