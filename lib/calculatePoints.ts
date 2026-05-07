type Props = {
    apostaA: number;
    apostaB: number;
    resultadoA: number;
    resultadoB: number;
  };
  
  export function calculatePoints({
    apostaA,
    apostaB,
    resultadoA,
    resultadoB
  }: Props) {
  
    // placar exato
    if (
      apostaA === resultadoA &&
      apostaB === resultadoB
    ) {
      return 5;
    }
  
    // empate
    if (
      apostaA === apostaB &&
      resultadoA === resultadoB
    ) {
      return 3;
    }
  
    // vencedor correto
    if (
      (apostaA > apostaB &&
        resultadoA > resultadoB) ||
  
      (apostaB > apostaA &&
        resultadoB > resultadoA)
    ) {
      return 3;
    }
  
    return 0;
  
  }