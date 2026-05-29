export const FASES_COPA = [
    {
        id: "Grupos",
        nome: "Primeira Fase",
        peso: 1,
      },
    
      {
        id: "Fase32",
        nome: "Segunda Fase",
        peso: 3,
      },
    
      {
        id: "Oitavas",
        nome: "Oitavas de Final",
        peso: 5,
      },
    
      {
        id: "Quartas",
        nome: "Quartas de Final",
        peso: 8,
      },
    
      {
        id: "Semi",
        nome: "Semifinal",
        peso: 12,
      },

      {
        id: "Terceiro",
        nome: "Disputa de 3º Lugar",
        peso: 12,
      },
    
      {
        id: "Final",
        nome: "Final",
        peso: 18,
      },
    
  ] as const
  
  export type FaseCopa =
    | "Grupos"
    | "Fase32"
    | "Oitavas"
    | "Quartas"
    | "Semi"
    | "Terceiro"
    | "Final"
  
  export function obterPesoDaFase(
    fase?: FaseCopa
  ) {
    return (
      FASES_COPA.find((f) => f.id === fase)
        ?.peso || 1
    )
  }