// lib/syncConfig.ts
// Mapeia cada torneio ativo aos parâmetros da API do TheSportsDB
// usados pra buscar jogos/resultados (liga + temporada).

export type SyncConfig = {
    leagueId: string;
    season: string;
  };
  
  export const SYNC_CONFIG: Record<string, SyncConfig> = {
    copa2026: {
      leagueId: "4429", // Copa do Mundo FIFA
      season: "2026",
    },
    copadobrasil2026: {
      leagueId: "4725", // Copa do Brasil
      season: "2026",
    },
  };