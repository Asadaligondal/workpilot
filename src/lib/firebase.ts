import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { readFileSync } from "fs"
import { join } from "path"

// Initialize Firebase Admin SDK
if (!getApps().length) {
  let serviceAccount
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Option 1: JSON string from env
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Option 2: Path to JSON file
    serviceAccount = JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"))
  } else {
    // Option 3: Default location
    try {
      const defaultPath = join(process.cwd(), "ai-professor-643e8-firebase-adminsdk-fbsvc-a51c81c426.json")
      serviceAccount = JSON.parse(readFileSync(defaultPath, "utf8"))
    } catch {
      throw new Error("Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_PATH")
    }
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-professor-643e8",
  })
}

export const db = getFirestore()
export const auth = getAuth()
