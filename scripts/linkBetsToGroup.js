const {
    initializeApp
  } = require("firebase/app");
  
  const {
    getFirestore,
    collection,
    getDocs,
    updateDoc,
    doc
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
  
  const GROUP_ID =
    "iFh2X4RFikNHV6usDAG4";
  
  async function vincularBets() {
  
    const snapshot =
      await getDocs(
        collection(db, "bets")
      );
  
    for (const betDoc of snapshot.docs) {
  
      const betRef =
        doc(
          db,
          "bets",
          betDoc.id
        );
  
      await updateDoc(
        betRef,
        {
  
          groupId:
            GROUP_ID
  
        }
      );
  
      console.log(
        `✅ ${betDoc.id}`
      );
  
    }
  
    console.log(
      "🔥 Todas as bets foram vinculadas ao grupo!"
    );
  
  }
  
  vincularBets();