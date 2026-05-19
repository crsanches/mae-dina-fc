import { cert, getApps, initializeApp }
from "firebase-admin/app";

import { getFirestore }
from "firebase-admin/firestore";

const firebaseAdminConfig = {

  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,

  clientEmail:
    process.env.FIREBASE_CLIENT_EMAIL,

  privateKey:
    process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    )

};

const app =

  getApps().length

    ? getApps()[0]

    : initializeApp({

        credential:
          cert(firebaseAdminConfig)

      });

export const adminDb =
  getFirestore(app);