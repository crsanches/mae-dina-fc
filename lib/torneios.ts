// lib/torneios.ts
// Fonte única de verdade sobre a estrutura de fases de cada torneio.
// Copa do Brasil não tem fase de grupos, "Segunda Fase" nem "3º Lugar" —
// entra direto nas oitavas. Se a Copa 2026 voltar a ficar ativa um dia,
// ela usa a entrada correspondente abaixo.

import { FaseCopa } from "./copas";

export type FaseOption = { id: FaseCopa; label: string };

export type ConfigTorneio = {
  temGrupos: boolean;
  fasesMataMata: FaseOption[];
};

export const FASES_POR_TORNEIO: Record<string, ConfigTorneio> = {
  copa2026: {
    temGrupos: true,
    fasesMataMata: [
      { id: "Fase32", label: "🚪 Segunda Fase" },
      { id: "Oitavas", label: "⚔️ Oitavas" },
      { id: "Quartas", label: "🏟️ Quartas" },
      { id: "Semi", label: "🔥 Semi" },
      { id: "Terceiro", label: "🥉 3º Lugar" },
      { id: "Final", label: "🏆 Final" },
    ],
  },
  copadobrasil2026: {
    temGrupos: false,
    fasesMataMata: [
      { id: "Oitavas", label: "⚔️ Oitavas" },
      { id: "Quartas", label: "🏟️ Quartas" },
      { id: "Semi", label: "🔥 Semi" },
      { id: "Final", label: "🏆 Final" },
    ],
  },
  libertadores2026: {
    temGrupos: false,
    fasesMataMata: [
      { id: "Oitavas", label: "⚔️ Oitavas" },
      { id: "Quartas", label: "🏟️ Quartas" },
      { id: "Semi", label: "🔥 Semi" },
      { id: "Final", label: "🏆 Final" },
    ],
  },
};

// Fallback pra um torneio novo sem entrada mapeada aqui — mostra tudo,
// pra nunca esconder jogo por falta de configuração.
export const CONFIG_PADRAO: ConfigTorneio = FASES_POR_TORNEIO.copa2026;

export function getConfigTorneio(torneioId: string | null): ConfigTorneio {
  if (!torneioId) return CONFIG_PADRAO;
  return FASES_POR_TORNEIO[torneioId] || CONFIG_PADRAO;
}