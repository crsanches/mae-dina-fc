export const FASES_COPA = [
    {
      id: "grupos",
      nome: "Fase de Grupos",
      peso: 1,
    },
  
    {
      id: "oitavas",
      nome: "Oitavas de Final",
      peso: 1.5,
    },
  
    {
      id: "quartas",
      nome: "Quartas de Final",
      peso: 2,
    },
  
    {
      id: "semi",
      nome: "Semifinal",
      peso: 3,
    },
  
    {
      id: "final",
      nome: "Final",
      peso: 5,
    },
  ] as const
  
  export type FaseCopa =
    | "grupos"
    | "oitavas"
    | "quartas"
    | "semi"
    | "final"
  
  export function obterPesoDaFase(
    fase?: FaseCopa
  ) {
    return (
      FASES_COPA.find((f) => f.id === fase)
        ?.peso || 1
    )
  }