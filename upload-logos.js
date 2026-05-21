const admin = require("firebase-admin");
const { execSync } = require("child_process");
const fs = require("fs");
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "mae-dina-fc.firebasestorage.app"
});

const bucket = admin.storage().bucket();

const teams = [
  { name: "Cruzeiro",      id: 1954   },
  { name: "Santos",        id: 1968   },
  { name: "Internacional", id: 1966   },
  { name: "Athletico-PR",  id: 1967   },
  { name: "São Paulo",     id: 312545 },
  { name: "Vasco",         id: 1974   },
  { name: "Palmeiras",     id: 1963   },
  { name: "Vitória",       id: 1972   },
  { name: "Grêmio",        id: 5926   },
  { name: "Flamengo",      id: 5981   },
];

async function uploadLogo(team) {
  console.log(`⬇️  Baixando ${team.name}...`);

  const tmpFile = `/tmp/logo-${team.id}.png`;

  execSync(
    `curl -s -o ${tmpFile} ` +
    `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" ` +
    `-H "Referer: https://www.sofascore.com/" ` +
    `-H "Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" ` +
    `"https://api.sofascore.app/api/v1/team/${team.id}/image"`
  );

  const buffer = fs.readFileSync(tmpFile);

  if (buffer.length < 100) {
    throw new Error(`Arquivo muito pequeno, provável erro de download`);
  }

  const slug = team.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s/g, "-");

  const file = bucket.file(`logos/${slug}.png`);

  await file.save(buffer, { contentType: "image/png" });

  await file.makePublic();

  const url = `https://storage.googleapis.com/mae-dina-fc.firebasestorage.app/logos/${slug}.png`;

  fs.unlinkSync(tmpFile);

  console.log(`✅ ${team.name}`);

  return { name: team.name, url };
}

async function main() {
  console.log("🚀 Iniciando upload dos escudos...\n");

  const results = [];

  for (const team of teams) {
    try {
      const result = await uploadLogo(team);
      results.push(result);
    } catch (err) {
      console.error(`❌ Erro em ${team.name}:`, err.message);
    }
  }

  console.log("\n📋 URLs finais:\n");
  for (const r of results) {
    console.log(`${r.name}: "${r.url}"`);
  }

  process.exit(0);
}

main();