import { auth, db } from "./firebase"
import { findFirst, findMany, update as updateDoc } from "./firestore-helpers"
import { cookies } from "next/headers"
import { where } from "./firestore-helpers"

/**
 * Get the current user from Firebase Auth token stored in cookies.
 * Tries session cookie verification first, then falls back to ID token verification.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("firebase-auth-token")?.value
  
  if (!token) return null
  
  try {
    return await auth.verifySessionCookie(token, false)
  } catch {
    // Session cookie failed, try as ID token
  }

  try {
    return await auth.verifyIdToken(token)
  } catch {
    return null
  }
}

/**
 * Sync Firebase Auth user to Firestore User collection.
 * Uses Firebase UID as the document ID for reliable lookups.
 * Migrates old-style user docs (auto-generated IDs) if found.
 */
export async function syncUser() {
  const firebaseUser = await getCurrentUser()
  if (!firebaseUser) return null

  const uid = firebaseUser.uid
  const userRef = db.collection("users").doc(uid)
  let userSnap = await userRef.get()

  if (!userSnap.exists) {
    // Check for old-style user doc (auto-generated ID with firebaseUid field)
    const oldUser = await findFirst("users", [where("firebaseUid", "==", uid)])

    if (oldUser && oldUser.id !== uid) {
      // Migrate: copy old doc data to new doc keyed by Firebase UID
      const { id: oldId, ...oldData } = oldUser
      await userRef.set({ ...oldData, firebaseUid: uid, updatedAt: new Date() })

      // Update all workspace memberships to use the new user ID
      const memberships = await findMany("workspaceMembers", [where("userId", "==", oldId)])
      for (const m of memberships) {
        await updateDoc("workspaceMembers", m.id, { userId: uid })
      }

      // Delete the old user doc
      await db.collection("users").doc(oldId).delete()

      userSnap = await userRef.get()
    } else if (!oldUser) {
      // Brand new user
      const userData = {
        firebaseUid: uid,
        email: firebaseUser.email || "",
        name: firebaseUser.name || null,
        avatarUrl: firebaseUser.picture || null,
        role: "MEMBER",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await userRef.set(userData)
      return { id: uid, ...userData }
    }
  }

  const existingData = userSnap.data()!
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (firebaseUser.email && firebaseUser.email !== existingData.email) {
    updates.email = firebaseUser.email
  }
  if (firebaseUser.name && firebaseUser.name !== existingData.name) {
    updates.name = firebaseUser.name
  }
  if (firebaseUser.picture && firebaseUser.picture !== existingData.avatarUrl) {
    updates.avatarUrl = firebaseUser.picture
  }

  if (Object.keys(updates).length > 1) {
    await userRef.update(updates)
  }

  return { id: uid, ...existingData, ...updates }
}

/**
 * Require authenticated user, throw if not authenticated
 */
export async function requireUser() {
  const user = await syncUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

/**
 * Check if current user has ADMIN role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  const userDoc = await findFirst("users", [where("firebaseUid", "==", user.uid)])
  return userDoc?.role === "ADMIN"
}

/**
 * Get user by ID (document ID or firebaseUid)
 */
export async function getUserById(userId: string) {
  // Try as document ID first
  try {
    const userDoc = await db.collection("users").doc(userId).get()
    if (userDoc.exists) {
      return { id: userDoc.id, ...userDoc.data() }
    }
  } catch {
    // Fall back to querying by firebaseUid
  }
  
  return await findFirst("users", [where("firebaseUid", "==", userId)])
}
