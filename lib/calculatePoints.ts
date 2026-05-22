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
  
  if (
    resultadoA == null ||
    resultadoB == null
  ) {
    return 0;
  }

  // placar exato
  if (
    apostaA === resultadoA &&
    apostaB === resultadoB
  ) {
    return 5;
  }

  const apostaEmpate =
    apostaA === apostaB;

  const resultadoEmpate =
    resultadoA === resultadoB;

  // acertou empate mas não o placar exato
  if (
    apostaEmpate &&
    resultadoEmpate
  ) {
    return 2;
  }

  // acertou vencedor
  if (
    (apostaA > apostaB &&
      resultadoA > resultadoB) ||

    (apostaA < apostaB &&
      resultadoA < resultadoB)
  ) {
    return 3;
  }

  // errou tudo
  return 0;
}