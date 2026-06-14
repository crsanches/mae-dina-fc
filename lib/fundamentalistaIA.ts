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

  return analises;

}