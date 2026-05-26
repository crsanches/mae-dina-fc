type Props = {
    apostaA: number;
    apostaB: number;
    resultadoA: number;
    resultadoB: number;
  };
  
  export function calculateAuditPoints({
    apostaA,
    apostaB,
    resultadoA,
    resultadoB
  }: Props) {
  
    let pontosPlacar = 0;
  
    let pontosVencedor = 0;
  
    let pontosEmpate = 0;
  
    if (
      resultadoA == null ||
      resultadoB == null
    ) {
  
      return {
  
        pontosPlacar: 0,
  
        pontosVencedor: 0,
  
        pontosEmpate: 0,
  
        total: 0,
  
        exato: false
  
      };
  
    }
  
    // placar exato
  
    if (
      apostaA === resultadoA &&
      apostaB === resultadoB
    ) {
  
      pontosPlacar = 5;
  
      return {
  
        pontosPlacar,
  
        pontosVencedor,
  
        pontosEmpate,
  
        total: 5,
  
        exato: true
  
      };
  
    }
  
    const apostaEmpate =
      apostaA === apostaB;
  
    const resultadoEmpate =
      resultadoA === resultadoB;
  
    // empate correto
  
    if (
      apostaEmpate &&
      resultadoEmpate
    ) {
  
      pontosEmpate = 2;
  
      return {
  
        pontosPlacar,
  
        pontosVencedor,
  
        pontosEmpate,
  
        total: 2,
  
        exato: false
  
      };
  
    }
  
    // vencedor correto
  
    const acertouVencedor =
  
      (
        apostaA > apostaB &&
        resultadoA > resultadoB
      ) ||
  
      (
        apostaA < apostaB &&
        resultadoA < resultadoB
      );
  
    if (acertouVencedor) {
  
      pontosVencedor = 3;
  
    }
  
    return {
  
      pontosPlacar,
  
      pontosVencedor,
  
      pontosEmpate,
  
      total: pontosVencedor,
  
      exato: false
  
    };
  
  }