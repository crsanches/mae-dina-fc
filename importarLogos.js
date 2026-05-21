const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const times = [
    { nome: "vitoria", id: 1962 },
    { nome: "internacional", id: 1966 },
    { nome: "sao-paulo", id: 312545 },
    { nome: "botafogo", id: 1958 },
    { nome: "gremio", id: 5926 },
    { nome: "santos", id: 1968 },
    { nome: "mirassol", id: 21982 },
    { nome: "fluminense", id: 1961 },
    { nome: "flamengo", id: 5981 },
    { nome: "palmeiras", id: 1963 },
    { nome: "remo", id: 2012 },
    { nome: "athletico-pr", id: 1967 },
    { nome: "cruzeiro", id: 1954 },
    { nome: "chapecoense", id: 21845 },
    { nome: "corinthians", id: 1957 },
    { nome: "atletico-mg", id: 1977 },
    { nome: "vasco", id: 1974 },
    { nome: "bragantino", id: 1999 },
    { nome: "coritiba", id: 1982 },
    { nome: "bahia", id: 1955 },
  ];

const pasta = path.join(__dirname, "public", "logos");

if (!fs.existsSync(pasta)) {
  fs.mkdirSync(pasta, { recursive: true });
}

for (const time of times) {
  const url = `https://api.sofascore.app/api/v1/team/${time.id}/image`;

  const destino = path.join(pasta, `${time.nome}.png`);

  const comando = `curl -L -s -o "${destino}" \
  -H "Referer: https://www.sofascore.com/" \
  -H "User-Agent: Mozilla/5.0" \
  "${url}"`;

  try {
    execSync(comando);

    console.log(`✅ ${time.nome}.png salvo`);
  } catch (erro) {
    console.log(`❌ Erro ao baixar ${time.nome}`);
  }
}

console.log("\n🏁 Importação finalizada");