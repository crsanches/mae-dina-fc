const {
    initializeApp
  } = require("firebase/app");
  
  const {
    getFirestore,
    collection,
    getDocs,
    updateDoc,
    doc,
    deleteField
  } = require("firebase/firestore");
  
  const firebaseConfig = {
  
    apiKey:
      "AIzaSyDG-I0M_P9qtINf9kmceaeNOrOMSx7XIQg",
  
    authDomain:
      "mae-dina-fc.firebaseapp.com",
  
    projectId:
      "mae-dina-fc",
  
    storageBucket:
      "mae-dina-fc.firebasestorage.app",
  
    messagingSenderId:
      "204520739342",
  
    appId:
      "1:204520739342:web:d41610e7796cd0ed1ea25f"
  
  };
  
  const app =
    initializeApp(firebaseConfig);
  
  const db =
    getFirestore(app);
  
  async function atualizarJogos() {
  
    const snapshot =
      await getDocs(
        collection(db, "games")
      );
  
    for (const gameDoc of snapshot.docs) {
  
      const gameRef =
        doc(
          db,
          "games",
          gameDoc.id
        );
  
      await updateDoc(
        gameRef,
        {
  
          matchDate:
            "2026-05-15T21:30",
  
            resultadoA: deleteField(),
            resultadoB: deleteField()
  
        }
      );
  
      console.log(
        `✅ ${gameDoc.id} atualizado`
      );
  
    }
  
    console.log(
      "🔥 Todos os jogos atualizados!"
    );
  
  }
  
  atualizarJogos();