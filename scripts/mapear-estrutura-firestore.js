/**
 * mapear-estrutura-firestore.js
 *
 * Varre TODAS as coleções (top-level) do seu projeto Firestore e gera
 * um resumo de cada uma: quantos documentos tem, quais campos aparecem,
 * que tipo de dado cada campo tem, e um exemplo de valor.
 *
 * Não modifica nada — é só leitura.
 *
 * Uso:
 *   npm install firebase-admin
 *   node mapear-estrutura-firestore.js
 *
 * O resultado é impresso no console E salvo em estrutura-firestore.json
 * na mesma pasta, pra você poder me mandar o arquivo depois.
 */

const admin = require("firebase-admin");
const fs = require("fs");

// Ajuste o caminho da sua service account key
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Quantos documentos amostrar por coleção (não precisa ler tudo,
// só o suficiente pra descobrir os campos que existem)
const AMOSTRA_POR_COLECAO = 15;

function tipoDe(valor) {
  if (valor === null) return "null";
  if (Array.isArray(valor)) return `array(${valor.length})`;
  if (valor && typeof valor.toDate === "function") return "timestamp";
  if (valor && typeof valor === "object" && valor.constructor?.name === "DocumentReference")
    return "reference";
  return typeof valor;
}

async function mapearColecao(colecaoRef, caminho) {
  const snapshot = await colecaoRef.limit(AMOSTRA_POR_COLECAO).get();
  const totalSnapshot = await colecaoRef.count().get();
  const total = totalSnapshot.data().count;

  const campos = {}; // nomeCampo -> { tipos: Set, exemplo }
  let temSubcolecoes = false;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    for (const [campo, valor] of Object.entries(data)) {
      if (!campos[campo]) {
        campos[campo] = { tipos: new Set(), exemplo: valor };
      }
      campos[campo].tipos.add(tipoDe(valor));
    }

    const subcolecoes = await doc.ref.listCollections();
    if (subcolecoes.length > 0) temSubcolecoes = true;
  }

  const resumoCampos = {};
  for (const [campo, info] of Object.entries(campos)) {
    resumoCampos[campo] = {
      tipos: Array.from(info.tipos),
      exemplo:
        typeof info.exemplo === "object" && info.exemplo !== null
          ? JSON.stringify(info.exemplo).slice(0, 200)
          : info.exemplo,
    };
  }

  return {
    caminho,
    totalDocumentos: total,
    documentosAmostrados: snapshot.size,
    temSubcolecoes,
    campos: resumoCampos,
  };
}

async function main() {
  console.log("Listando coleções top-level...\n");

  const colecoesTopLevel = await db.listCollections();
  const resultado = [];

  for (const colecaoRef of colecoesTopLevel) {
    console.log(`Mapeando: ${colecaoRef.id}...`);
    const resumo = await mapearColecao(colecaoRef, colecaoRef.id);
    resultado.push(resumo);

    if (resumo.temSubcolecoes) {
      console.log(
        `  ⚠ documentos em "${colecaoRef.id}" têm subcoleções — rode o script apontando pra elas também se forem relevantes.`
      );
    }
  }

  fs.writeFileSync(
    "estrutura-firestore.json",
    JSON.stringify(resultado, null, 2)
  );

  console.log("\n=== RESUMO ===\n");
  for (const colecao of resultado) {
    console.log(`📁 ${colecao.caminho} (${colecao.totalDocumentos} documentos)`);
    for (const [campo, info] of Object.entries(colecao.campos)) {
      console.log(`   - ${campo}: ${info.tipos.join(" | ")} (ex: ${info.exemplo})`);
    }
    console.log("");
  }

  console.log("Estrutura completa salva em estrutura-firestore.json");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao mapear estrutura:", err);
  process.exit(1);
});