/**
 * migrar-torneio-id.js
 *
 * Objetivo: adicionar o campo `torneioId: "copa2026"` retroativamente
 * em todos os documentos existentes das coleções do Mãe Diná FC,
 * para que a Copa do Brasil possa conviver com a Copa 2026 sem
 * apagar nada.
 *
 * Coleções tratadas:
 *   - games              -> ganha campo torneioId (sem mudar ID do doc)
 *   - bets               -> ganha campo torneioId (sem mudar ID do doc)
 *   - analytics_matches  -> ganha campo torneioId (sem mudar ID do doc)
 *   - leagueHistory      -> ganha campo torneioId E o ID do documento muda
 *                           de "{groupId}" para "{groupId}_{torneioId}"
 *                           (copia pro novo ID, apaga o antigo)
 *
 * Coleções que NÃO mudam: groups, users, memes, ligas.
 *
 * Uso:
 *   node migrar-torneio-id.js --dry-run   (só mostra o que faria, não escreve nada)
 *   node migrar-torneio-id.js --apply     (executa de verdade)
 */

const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ID que vamos atribuir a TUDO que já existe hoje (a Copa 2026 encerrada)
const TORNEIO_LEGADO = "copa2026";

const DRY_RUN = !process.argv.includes("--apply");

// --- Coleções simples: só adicionam o campo torneioId, mantendo o ID do doc ---
const COLECOES_SIMPLES = ["games", "bets", "analytics_matches"];

async function migrarColecaoSimples(nomeColecao) {
  const snapshot = await db.collection(nomeColecao).get();

  if (snapshot.empty) {
    console.log(`[${nomeColecao}] nenhum documento encontrado.`);
    return;
  }

  console.log(`[${nomeColecao}] ${snapshot.size} documento(s) encontrado(s).`);

  let batch = db.batch();
  let contadorNoBatch = 0;
  let totalAtualizados = 0;
  let totalJaTinham = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Protege contra rodar o script duas vezes por engano
    if (data.torneioId) {
      totalJaTinham++;
      continue;
    }

    totalAtualizados++;

    if (DRY_RUN) continue;

    batch.update(doc.ref, { torneioId: TORNEIO_LEGADO });
    contadorNoBatch++;

    if (contadorNoBatch === 450) {
      await batch.commit();
      batch = db.batch();
      contadorNoBatch = 0;
    }
  }

  if (!DRY_RUN && contadorNoBatch > 0) {
    await batch.commit();
  }

  console.log(
    `[${nomeColecao}] ${DRY_RUN ? "seriam atualizados" : "atualizados"}: ${totalAtualizados} | já tinham torneioId: ${totalJaTinham}`
  );
}

// --- leagueHistory: precisa trocar o ID do documento (groupId -> groupId_torneioId) ---
async function migrarLeagueHistory() {
  const nomeColecao = "leagueHistory";
  const snapshot = await db.collection(nomeColecao).get();

  if (snapshot.empty) {
    console.log(`[${nomeColecao}] nenhum documento encontrado.`);
    return;
  }

  console.log(`[${nomeColecao}] ${snapshot.size} documento(s) encontrado(s).`);

  let totalMigrados = 0;
  let totalJaMigrados = 0;
  let totalIgnorados = 0;

  for (const doc of snapshot.docs) {
    const idAntigo = doc.id; // hoje: o próprio groupId
    const data = doc.data();

    // Se o ID já estiver no novo formato "groupId_torneioId", pula
    if (idAntigo.includes("_") && data.torneioId) {
      totalJaMigrados++;
      continue;
    }

    if (!data.groupId) {
      console.log(
        `  ⚠ doc "${idAntigo}" não tem campo groupId — pulando (verifique manualmente).`
      );
      totalIgnorados++;
      continue;
    }

    const idNovo = `${data.groupId}_${TORNEIO_LEGADO}`;

    console.log(`  ${idAntigo}  ->  ${idNovo}`);

    if (DRY_RUN) {
      totalMigrados++;
      continue;
    }

    // Copia pro novo ID com torneioId, depois apaga o antigo
    await db
      .collection(nomeColecao)
      .doc(idNovo)
      .set({ ...data, torneioId: TORNEIO_LEGADO });

    await doc.ref.delete();

    totalMigrados++;
  }

  console.log(
    `[${nomeColecao}] ${DRY_RUN ? "seriam migrados" : "migrados"}: ${totalMigrados} | já migrados: ${totalJaMigrados} | ignorados: ${totalIgnorados}`
  );
}

// --- Cria/atualiza o doc de config com o torneio ativo ---
async function garantirConfigTorneioAtivo() {
  const ref = db.collection("config").doc("appConfig");
  const doc = await ref.get();

  if (doc.exists && doc.data().torneioAtivo) {
    console.log(
      `[config/appConfig] já existe, torneioAtivo = "${doc.data().torneioAtivo}" (não alterado por este script).`
    );
    return;
  }

  console.log(
    `[config/appConfig] ${DRY_RUN ? "seria criado" : "criando"} com torneioAtivo = "${TORNEIO_LEGADO}".`
  );

  if (!DRY_RUN) {
    await ref.set({ torneioAtivo: TORNEIO_LEGADO }, { merge: true });
  }
}

async function main() {
  console.log(
    DRY_RUN
      ? "=== MODO DRY-RUN (nada será escrito) ==="
      : "=== MODO APPLY (escrevendo no Firestore de verdade) ==="
  );

  for (const colecao of COLECOES_SIMPLES) {
    await migrarColecaoSimples(colecao);
  }

  await migrarLeagueHistory();
  await garantirConfigTorneioAtivo();

  console.log("\nMigração concluída.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});