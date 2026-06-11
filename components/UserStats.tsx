"use client";

import {
  useEffect,
  useState
} from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

import {
  auth,
  db
} from "../lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  buildRanking
} from "../lib/buildRanking";

type UserData = {

  position: number;

  points: number;

};

type BetHistory = {

  jogo: string;

  aposta: string;

  resultado?: string;

  pontos?: number;

  fase?: string;

  grupo?: string;

  matchDate?: string;

  emojiA?: string;

  emojiB?: string;

};

export default function UserStats() {

  const [expandido, setExpandido] =
    useState(false);

  const [data, setData] =
    useState<UserData>({
      position: 0,
      points: 0
    });

    const [betHistory, setBetHistory] =
    useState<BetHistory[]>([]);

    const [loading, setLoading] =
  useState(true);
  
  const [
    tipoVisualizacao,
    setTipoVisualizacao
  ] = useState<
    "grupos" | "matamata"
  >("grupos");
  
  const [
    grupoSelecionado,
    setGrupoSelecionado
  ] = useState("A");
  
  const [
    faseSelecionada,
    setFaseSelecionada
  ] = useState("Fase32");
    


  // =========================
  // LOAD STATS
  // =========================

  async function carregarPalpites() {

    const firebaseUser =
      auth.currentUser;
  
    if (!firebaseUser) {
      return;
    }
  
    const userRef =
      doc(
        db,
        "users",
        firebaseUser.uid
      );
  
    const userSnap =
      await getDoc(userRef);
  
    if (!userSnap.exists()) {
      return;
    }
  
    const userData =
      userSnap.data();
  
    const currentGroupId =
      userData.activeGroupId;
  
    const possibleNames = [
  
      userData.nome,
  
      userData.username,
  
      userData.apelido,
  
      firebaseUser.displayName
  
    ].filter(Boolean);
  
    const betsSnapshot =
      await getDocs(
  
        query(
          collection(db, "bets"),
          where("groupId","==",currentGroupId),
          where("uid","==",firebaseUser.uid)
        )
  
      );
      

betsSnapshot.forEach((betDoc) => {

});
  
    const gamesSnapshot =
      await getDocs(
        collection(db, "games")
      );
     
      type GameData = {

        teamA: string;
      
        teamB: string;
      
        resultadoA?: number;
      
        resultadoB?: number;
      
        fase?: string;
      
        grupo?: string;
      
        matchDate?: string;
      
        emojiA?: string;
      
        emojiB?: string;
      
      };

   const gamesMap:
  Record<string, GameData> = {};
  
    gamesSnapshot.forEach((gameDoc) => {
  
      const game =
        gameDoc.data() as GameData;
  
      gamesMap[
        `${game.teamA} x ${game.teamB}`
      ] = game;
  
    });
  
    const history: BetHistory[] = [];
  
    betsSnapshot.forEach((betDoc) => {

      const bet =
        betDoc.data();
    
      if (
        bet.uid !==
        firebaseUser.uid
      ) {
    
       
        return;
    
      }
    
      const game =
        gamesMap[bet.match];
   
      if (!game) {
    
        return;
    
      }
    

      history.push({
  
        jogo:
          bet.match,
  
        aposta:
          `${bet.golsA} x ${bet.golsB}`,
  
        resultado:
  
          game.resultadoA != null &&
          game.resultadoB != null
  
            ? `${game.resultadoA} x ${game.resultadoB}`
  
            : undefined,
  
        pontos:
          bet.points,
  
        fase:
          game.fase,
  
        grupo:
          game.grupo,
  
        matchDate:
          game.matchDate,
  
        emojiA:
          game.emojiA,
  
        emojiB:
          game.emojiB
  
      });
  
    });
  
   
  
    history.sort((a, b) =>
        (a.matchDate || "")
          .localeCompare(
            b.matchDate || ""
          )
      );



      
      setBetHistory(history);

      
    
    }
 

    /******** */

  async function carregarStats() {

    setLoading(true);

    try {

      const firebaseUser =
        auth.currentUser;

      if (!firebaseUser) {
        return;
      }

      // =========================
      // USER
      // =========================

      const userRef =
        doc(
          db,
          "users",
          firebaseUser.uid
        );

      const userSnap =
        await getDoc(userRef);

      if (!userSnap.exists()) {
        return;
      }

      const userData =
        userSnap.data();

      const currentGroupId =
        userData.activeGroupId;


        const currentUsername =

          userData.apelido ||

          userData.username ||

          userData.nome ||

          firebaseUser.displayName ||

          "";

      // =========================
      // RANKING OFICIAL
      // =========================

      const ranking =
        await buildRanking(
          currentGroupId
        );


        const possibleNames = [

          userData.nome,
        
          userData.username,
        
          userData.apelido,
        
          firebaseUser.displayName
        
        ].filter(Boolean);
        
      

      // =========================
      // LOCALIZA USUÁRIO
      // =========================

      const currentUserData =
        ranking.find((u) =>

          possibleNames.includes(
            u.username
          ) ||

          possibleNames.includes(
            u.nome
          )
        );

    
      // =========================
      // NÃO ENCONTROU
      // =========================
     
      if (!currentUserData) {

        await carregarPalpites();
        setLoading(false);
        return;
      
      }

      // =========================
      // POSIÇÃO
      // =========================

      const position =

      ranking.findIndex((u) =>

      possibleNames.includes(
        u.username
      ) ||
  
      possibleNames.includes(
        u.nome
      )
  
    ) + 1;

     

      // =========================
      // HISTORY
      // =========================

      

      // =========================
      // SET STATE
      // =========================

      

      setData({

        position,

        points:
          currentUserData.points

      });

      

      await carregarPalpites();
      setLoading(false);
    } catch (error) {

      console.error(
        "Erro ao carregar stats:",
        error
      );
      setLoading(false);

    }

  }

  // =========================
  // EFFECT
  // =========================

  useEffect(() => {

    let unsubscribeBets:
      (() => void) | undefined;

      const unsubscribeAuth =
      onAuthStateChanged(
    
        auth,
    
        async (user) => {
    
          if (!user) {
    
            setData({
    
              position: 0,
    
              points: 0
    
            });
    
            setBetHistory([]);
    
            return;
    
          }
    
          const userRef =
            doc(
              db,
              "users",
              user.uid
            );
    
          const userSnap =
            await getDoc(userRef);
    
          if (!userSnap.exists()) {
            return;
          }
    
          const currentGroupId =
            userSnap.data().activeGroupId;
    
          if (!currentGroupId) {
            return;
          }
    
          // carrega imediatamente
    
          carregarStats();
    
          // escuta somente apostas da liga atual
    
          unsubscribeBets =
            onSnapshot(
    
              query(
    
                collection(
                  db,
                  "bets"
                ),
    
                where(
                  "groupId",
                  "==",
                  currentGroupId
                )
    
              ),
              (snapshot) => {

                
    
                carregarStats();
    
              }
    
            );
    
        }
    
      );

    return () => {

      unsubscribeAuth();

      if (
        unsubscribeBets
      ) {

        unsubscribeBets();

      }

    };

  }, []);


  const grupos = [
    "A","B","C","D","E","F",
    "G","H","I","J","K","L"
  ];
  
  const fasesMataMata = [
    "Fase32",
    "Oitavas",
    "Quartas",
    "Semi",
    "Final"
  ];

  const resumoGrupos = grupos.reduce(
    (acc, grupo) => {
  
      const feitos =
        betHistory.filter(
          (bet) => bet.grupo === grupo
        ).length;
  
      acc[grupo] = {
        feitos,
        total: 6
      };
  
      return acc;
  
    },
    {} as Record<
      string,
      {
        feitos: number;
        total: number;
      }
    >
  );

  const apostasFiltradas =
  betHistory.filter((bet) => {

    if (tipoVisualizacao === "grupos") {

      return (
        String(bet.grupo || "")
          .toUpperCase() ===
        grupoSelecionado.toUpperCase()
      );

    }

    return (
      [
        "Fase32",
        "Oitavas",
        "Quartas",
        "Semi",
        "Final"
      ].includes(
        bet.fase || ""
      ) &&
      bet.fase === faseSelecionada
    );

  });

 
  const groupedBets =
  apostasFiltradas.reduce(

    (acc, bet) => {

      const key =
        bet.grupo
          ? `Grupo ${bet.grupo}`
          : (
              bet.fase ||
              "Outros"
            );

      if (!acc[key]) {

        acc[key] = [];

      }

      acc[key].push(bet);

      return acc;

    },

    {} as Record<
      string,
      BetHistory[]
    >

  );
  
  // =========================
  // RENDER
  // =========================

  return (

    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">

      <h2 className="text-xl font-black mb-4">
        💀 Sua Situação
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-zinc-800 rounded-2xl p-4 text-center">

          <p className="text-zinc-400 text-sm">
            Posição
          </p>

          <p className="text-3xl font-black text-yellow-400">
            #{data.position || "-"}
          </p>

        </div>

        <div className="bg-zinc-800 rounded-2xl p-4 text-center">

          <p className="text-zinc-400 text-sm">
            Pontos
          </p>

          <p className="text-3xl font-black text-green-400">
            {data.points}
          </p>

        </div>

      </div>
    

      <div className="mt-6">

      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 transition rounded-2xl p-4 mb-3"
      >
        <div className="text-left">

          <h3 className="text-lg font-black">
            🎯 Seus Palpites
          </h3>

          <p className="text-zinc-400 text-sm">
            {betHistory.length} apostas registradas
          </p>

        </div>

        <div className="text-2xl">

          {expandido
            ? "🔮 Fechar previsões"
            : "🔮 Abrir meus palpites"}

        </div>

       </button>

        {expandido && (

        <div className="mt-4">

          {/* TIPO DE VISUALIZAÇÃO */}

          <div className="flex gap-2 mb-4">

            <button
              onClick={() =>
                setTipoVisualizacao("grupos")
              }
              className={
                tipoVisualizacao === "grupos"
                  ? "bg-yellow-500 text-black px-3 py-2 rounded-xl font-black"
                  : "bg-zinc-700 px-3 py-2 rounded-xl"
              }
            >
              🌎 Grupos
            </button>

            <button
              onClick={() =>
                setTipoVisualizacao("matamata")
              }
              className={
                tipoVisualizacao === "matamata"
                  ? "bg-yellow-500 text-black px-3 py-2 rounded-xl font-black"
                  : "bg-zinc-700 px-3 py-2 rounded-xl"
              }
            >
              ⚔️ Mata-mata
            </button>

          </div>

          {/* BOTÕES DOS GRUPOS */}

          {tipoVisualizacao === "grupos" && (

            <div className="flex flex-wrap gap-2 mb-4">

                {grupos.map((grupo) => {

                const info =
                  resumoGrupos[grupo];

                const faltam =
                  info.total - info.feitos;

                return (

                  <button
                    key={grupo}
                    onClick={() =>
                      setGrupoSelecionado(grupo)
                    }
                    className={
                      grupoSelecionado === grupo
                        ? "bg-green-500 text-black px-3 py-2 rounded-xl font-black"
                        : "bg-zinc-700 px-3 py-2 rounded-xl"
                    }
                  >

                    <div className="flex items-center gap-1">

                      <span>
                        {grupo}
                      </span>

                      {faltam === 0 ? (

                        <span className="text-xs">
                          ✅
                        </span>

                      ) : (

                        <span className="text-xs text-red-300">
                          ({faltam})
                        </span>

                      )}

                    </div>

                  </button>

                );

                })}

            </div>

          )}

          {/* BOTÕES DAS FASES */}

          {tipoVisualizacao === "matamata" && (

            <div className="flex flex-wrap gap-2 mb-4">

              {fasesMataMata.map((fase) => (

                <button
                  key={fase}
                  onClick={() =>
                    setFaseSelecionada(fase)
                  }
                  className={
                    faseSelecionada === fase
                      ? "bg-red-500 text-black px-3 py-2 rounded-xl font-black"
                      : "bg-zinc-700 px-3 py-2 rounded-xl"
                  }
                >
                  {fase}
                </button>

              ))}

            </div>

            )}

           {/* LISTA DE PALPITES */}

           <div className="space-y-3">

            {apostasFiltradas.length === 0 && (

              <p className="text-zinc-400 text-sm">
                Nenhum palpite registrado.
              </p>

            )}

{Object.entries(groupedBets).map(
  ([grupo, bets]) => (

    <div
      key={grupo}
      className="mb-5"
    >

      <h3 className="font-black text-yellow-400 mb-3">

        {grupo.startsWith("Grupo")
          ? `🌎 ${grupo}`
          : `⚔️ ${grupo}`}

      </h3>

      <div className="space-y-3">

        {bets.map((bet, index) => (

          <div
            key={index}
            className="bg-zinc-800 rounded-2xl p-4 border border-zinc-700"
          >

            <p className="font-bold text-sm mb-2">
              ⚽ {bet.jogo}
            </p>

            <p className="text-zinc-300 text-sm">
              🎯 Palpite: {bet.aposta}
            </p>

            {bet.resultado ? (

              <>

                <p className="text-zinc-300 text-sm">
                  🏁 Resultado: {bet.resultado}
                </p>

                <p className="text-yellow-400 text-sm font-bold">
                  ⭐ {bet.pontos || 0} pontos
                </p>

              </>

            ) : (

              <p className="text-blue-400 text-sm">
                ⏳ Aguardando jogo
              </p>

            )}

          </div>

        ))}

      </div>

    </div>

  )

)}

          </div>

        </div>

      )}

    </div>

  </div>

  );

}