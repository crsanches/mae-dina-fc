import type {
    RankingUser
  } from "./buildRanking";

export function gerarAnaliseIA(
  ranking: RankingUser[]
): string[] {

  const analises: string[] = [];

  if (!ranking.length) {
    return [
      "🤖 Dados insuficientes para análise fundamentalista."
    ];
  }

  const lider = ranking[0];

  const vice =
    ranking.length > 1
      ? ranking[1]
      : null;

  const lanterna =
    ranking[ranking.length - 1];

// =========================
// DESTAQUES
// =========================

const reiDosExatos =
  [...ranking].sort(
    (a, b) => b.exatos - a.exatos
  )[0];

const mestreVencedores =
  [...ranking].sort(
    (a, b) =>
      b.acertosVencedor -
      a.acertosVencedor
  )[0];

const reiEmpates =
  [...ranking].sort(
    (a, b) =>
      b.acertosEmpate -
      a.acertosEmpate
  )[0];

const maisPreciso =
  [...ranking]
    .filter(
      (u) =>
        u.aproximacaoVencedor > 0
    )
    .sort(
      (a, b) =>
        a.aproximacaoVencedor -
        b.aproximacaoVencedor
    )[0];

    const piorDosExatos =
  [...ranking]
    .sort(
      (a, b) =>
        a.exatos - b.exatos
    )[0];

  // =========================
  // PIORES EXATOS
  // =========================



    analises.push(
        `🎯 ${reiDosExatos.nome} lidera os placares exatos com ${reiDosExatos.exatos} acertos.`
      );
      
      analises.push(
        `😬 ${piorDosExatos.nome} ainda busca seu relacionamento definitivo com os placares exatos.`
      );

  // =========================
  // LÍDER ISOLADO
  // =========================

  if (
    lider &&
    vice &&
    lider.points - vice.points >= 15
  ) {

    analises.push(
        `👑 ${lider.nome} abriu vantagem e já consulta fornecedores para a moldura da taça.`
      );;

  }

  // =========================
  // DISPUTA APERTADA
  // =========================

  if (
    lider &&
    vice &&
    lider.points - vice.points <= 3
  ) {

    analises.push(
        `⚔️ Apenas ${lider.points - vice.points} ponto(s) separam ${lider.nome} e ${vice.nome}. O mercado opera em forte tensão competitiva.`
      );

  }

  // =========================
  // LANTERNA DISTANTE
  // =========================

  if (
    lider &&
    lanterna &&
    lider.points - lanterna.points >= 40
  ) {

    analises.push(
        `🎯  ${lanterna.nome} permanece comprometido com seu projeto estratégico de ocupação da última colocação.`
      );
    
  }

  // =========================
  // MUITOS EXATOS
  // =========================

  if (
    lider &&
    lider.exatos >= 5
  ) {

    analises.push(
        `🎯 ${reiDosExatos.nome} acumula ${reiDosExatos.exatos} placares exatos e já desperta suspeitas no mercado.`
      );

  }

  // =========================
  // MUITOS EXATOS MESMO
  // =========================

  if (
    lider &&
    lider.exatos >= 8
  ) {

    analises.push(
        `☎️ A FIFA solicitou acesso aos modelos preditivos utilizados por ${lider.nome}. A auditoria segue em andamento.`
      );

  }

  // =========================
  // SORTE ABSURDA
  // =========================

  if (
    lider &&
    lider.exatos === 0 &&
    lider.points > 30
  ) {

    
    analises.push(
        `🍀 Detectada forte correlação entre a posição atual e a sorte absurda. ${lider.nome} lidera sem placares exatos. Os estatísticos estão intrigados.`
      );
  }

  // =========================
  // LANTERNA CRÔNICO
  // =========================

  if (
    lanterna &&
    lanterna.points < 20
  ) {

    analises.push(
        `🚑 ${lanterna.nome} segue firme em seu projeto de longo prazo.`
    );

  }

  // =========================
  // CORNETA FIXA
  // =========================

  const alvoCorneta =
  lanterna?.nome ||
  lider?.nome ||
  "alguns participantes";

analises.push(
  `📣 O departamento de risco estima 93% de chance de corneta pesada envolvendo ${alvoCorneta} ainda hoje.`
);
  // =========================
  // FALLBACK
  // =========================

  if (analises.length === 1) {

    analises.push(
      "🎯 O mercado de palpites segue operando sob forte volatilidade emocional."
    );

    analises.push(
      "🤖 A IA continua monitorando sinais de soberba e desespero."
    );

  }

  // =========================
  // mestre dos vencedores
  // =========================
  if (
    mestreVencedores &&
    mestreVencedores.acertosVencedor >= 5
  ) {
  
    analises.push(
        `🔮 ${mestreVencedores.nome} acertou ${mestreVencedores.acertosVencedor} vencedores e agora é considerado patrimônio estatístico da liga.`
    );
  
  }
  

   // =========================
  // ESPECIALISTA EM EMPATES
  // =========================
  if (
    reiEmpates &&
    reiEmpates.acertosEmpate >= 2
  ) {
  
    analises.push(
      `🤝 ${reiEmpates.nome} demonstra conhecimento incomum sobre empates.`
    );
  
  }

   // =========================
  //MAIS PRECISO
  // =========================
  if (maisPreciso) {

    analises.push(
        `🎯 ${maisPreciso.nome} apresenta a melhor precisão média da competição, causando desconforto nos adversários.`
    );
  
  }

  analises.push(
    `🏆 ${lider.nome} lidera atualmente a competição com ${lider.points} pontos.`
  );
  
  analises.push(
    `🎯  A diferença entre líder e lanterna já alcançou ${lider.points - lanterna.points} pontos.`
  );
  
  analises.push(
    `⚽ ${ranking.length} participantes seguem sonhando com o título.`
  );
  
  analises.push(
    `🔥 O mercado de palpites permanece extremamente volátil.`
  );
  
  analises.push(
    `🍿 Especialistas projetam cenas lamentáveis na próxima rodada.`
  );
  
  analises.push(
    `🤖 A IA continua monitorando sinais de soberba e desespero.`
  );
  
  analises.push(
    `🎯  O departamento estatístico segue trabalhando em regime integral.`
  );
  
  analises.push(
    `🏟️ A pressão psicológica aumenta à medida que a competição avança.`
  );



// ================================================
// COLE ESTE BLOCO DENTRO DE gerarAnaliseIA()
// logo antes do `return analises;`
// ================================================
// Requer: ranking já calculado, com user.jogos[]
// ================================================

// =========================
// HELPER: últimos N jogos ordenados por data
// =========================

function ultimosJogos(user: RankingUser, n: number) {
  return [...user.jogos]
    .filter((j) => j.createdAt != null)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, n);
}

function pontosEm(jogos: ReturnType<typeof ultimosJogos>) {
  return jogos.reduce((acc, j) => acc + j.total, 0);
}

// =========================
// ÚLTIMOS 5 JOGOS — pontos por usuário
// =========================

const stats5 = ranking.map((u) => ({
  user: u,
  jogos5: ultimosJogos(u, 5),
  pts5: pontosEm(ultimosJogos(u, 5)),
}));

const stats10 = ranking.map((u) => ({
  user: u,
  pts10: pontosEm(ultimosJogos(u, 10)),
}));

// =========================
// QUEM MAIS PONTUOU NOS ÚLTIMOS 5
// =========================

const maisQuente5 = [...stats5].sort((a, b) => b.pts5 - a.pts5)[0];

if (maisQuente5 && maisQuente5.pts5 > 0) {
  analises.push(
    `🔥 ${maisQuente5.user.username} está em chamas: ${maisQuente5.pts5} pontos nos últimos 5 jogos. O mercado já fala em bolha.`
  );
}

// =========================
// QUEM MAIS PONTUOU NOS ÚLTIMOS 10
// =========================

const maisQuente10 = [...stats10].sort((a, b) => b.pts10 - a.pts10)[0];

if (maisQuente10 && maisQuente10.pts10 > 0 && maisQuente10.user.username !== maisQuente5?.user.username) {
  analises.push(
    `🔥 ${maisQuente10.user.username} lidera o desempenho nos últimos 10 jogos com ${maisQuente10.pts10} pontos. A retomada é real ou apenas especulação?`
  );
}

// =========================
// QUEM MENOS PONTUOU NOS ÚLTIMOS 5
// =========================

const maisFrio5 = [...stats5]
  .filter((s) => s.jogos5.length >= 3) // só quem tem jogos suficientes
  .sort((a, b) => a.pts5 - b.pts5)[0];

if (maisFrio5) {
  analises.push(
    `🧊 ${maisFrio5.user.username} acumulou apenas ${maisFrio5.pts5} pontos nos últimos 5 jogos. Especialistas debatem se é crise estrutural ou apenas má fase.`
  );
}

// =========================
// QUEM ZEROU NOS ÚLTIMOS 5 (0 pontos em todos)
// =========================

const zeradosUltimos5 = stats5.filter(
  (s) => s.jogos5.length >= 3 && s.pts5 === 0
);

if (zeradosUltimos5.length === 1) {
  analises.push(
    `🚨 ${zeradosUltimos5[0].user.username} não pontuou em nenhum dos últimos 5 jogos. A diretoria foi contatada para comentar.`
  );
} else if (zeradosUltimos5.length >= 2) {
  const nomes = zeradosUltimos5.map((s) => s.user.username).join(", ");
  analises.push(
    `💀 Grupo de risco nos últimos 5 jogos — zeraram tudo: ${nomes}. A disputa agora é para ver quem afunda mais rápido.`
  );
}

// =========================
// DISPUTA PELA LANTERNA (últimos colocados próximos)
// =========================

const n = ranking.length;

if (n >= 3) {
  const lanterna1 = ranking[n - 1];
  const lanterna2 = ranking[n - 2];
  const difLanterna = lanterna2.points - lanterna1.points;

  if (difLanterna <= 5) {
    analises.push(
      `🎭  ${lanterna2.username} está ameaçando o trono de ${lanterna1.username} na lanterna. Apenas ${difLanterna} ponto(s) de diferença. A disputa pelo último lugar está acirrada.`
    );
  }

  if (n >= 4) {
    const lanterna3 = ranking[n - 3];
    const difTres = lanterna3.points - lanterna1.points;

    if (difTres <= 10) {
      analises.push(
        `🐢 ${lanterna1.username}, ${lanterna2.username} e ${lanterna3.username} formam um triângulo de incompetência dentro de ${difTres} pontos. Os analistas estão perplexos com o nível técnico da zona de rebaixamento.`
      );
    }
  }
}

// =========================
// TOP 5 EM FORMA (últimos 5 jogos)
// =========================

const top5Forma = [...stats5]
  .sort((a, b) => b.pts5 - a.pts5)
  .slice(0, 5)
  .filter((s) => s.pts5 > 0);

if (top5Forma.length >= 3) {
  const nomes = top5Forma.map((s) => `${s.user.username} (${s.pts5}pts)`).join(", ");
  analises.push(
    `🏎️ Os 5 com melhor forma recente: ${nomes}. O mercado monitora de perto quem vai sustentar o ritmo.`
  );
}

// =========================
// BOTTOM 5 EM FORMA (últimos 5 jogos)
// =========================

const bottom5Forma = [...stats5]
  .filter((s) => s.jogos5.length >= 3)
  .sort((a, b) => a.pts5 - b.pts5)
  .slice(0, 5);

if (bottom5Forma.length >= 3) {
  const nomes = bottom5Forma.map((s) => `${s.user.username} (${s.pts5}pts)`).join(", ");
  analises.push(
    `🪦 Os 5 em pior forma nos últimos jogos: ${nomes}. Uma crise silenciosa que os números não conseguem mais esconder.`
  );
}

// =========================
// VIRADA — alguém frio no geral mas quente nos últimos 5
// =========================

const viradaCandidate = stats5.find(
  (s) =>
    s.pts5 > 0 &&
    ranking.indexOf(s.user) > Math.floor(n / 2) // está na metade de baixo
);

if (viradaCandidate) {
  analises.push(
    `🧨  ${viradaCandidate.user.username} está na parte de baixo do ranking mas foi um dos destaques recentes com ${viradaCandidate.pts5} pontos nos últimos 5 jogos. A virada está precificada?`
  );
}

// =========================
// LÍDER EM FREEFALL (quente no geral, frio nos últimos 5)
// =========================

const liderFrio = stats5.find(
  (s) =>
    ranking.indexOf(s.user) === 0 && // é o líder
    s.pts5 < 5
);

if (liderFrio) {
  analises.push(
    `😰 ${lider.username} lidera no geral mas somou apenas ${liderFrio.pts5} pontos nos últimos 5 jogos. Os concorrentes farejam sangue.`
  );
}

// ================================================
// FIM DO BLOCO — o `return analises;` continua depois
// ================================================


  return analises;

}