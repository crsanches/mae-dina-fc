/*
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDG-I0M_P9qtINf9kmceaeNOrOMSx7XIQg",
    authDomain: "mae-dina-fc.firebaseapp.com",
    projectId: "mae-dina-fc",
    storageBucket: "mae-dina-fc.firebasestorage.app",
    messagingSenderId: "204520739342",
    appId: "1:204520739342:web:d41610e7796cd0ed1ea25f"
  };

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
*/

import {

  initializeApp,

  getApps,

  getApp  
  

} from "firebase/app";

import {

  getFirestore

} from "firebase/firestore";

import {

  getAuth,
  GoogleAuthProvider

} from "firebase/auth";

const firebaseConfig = {

  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,

  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,

  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,

  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID

};

const app =

  getApps().length

    ? getApp()

    : initializeApp(firebaseConfig);

export const db =
  getFirestore(app);

export const auth =
  getAuth(app);

export const googleProvider =
  new GoogleAuthProvider();