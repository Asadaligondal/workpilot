"use client"

import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCfLNygy5h6rRh3mDvPPIMlqDM3q__7RTw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ai-professor-643e8.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://ai-professor-643e8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-professor-643e8",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ai-professor-643e8.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "534375661470",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:534375661470:web:0f1f424b6de0fb92ffe08f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-RRVHPE4C2F",
}

// Initialize Firebase
if (!getApps().length) {
  initializeApp(firebaseConfig)
}

export const auth = getAuth()
export const db = getFirestore()
