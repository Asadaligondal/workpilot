/**
 * Firestore helper functions for database operations
 */

import { db } from "./firebase"
import { Timestamp } from "firebase-admin/firestore"
import type { DocumentData } from "firebase-admin/firestore"

/**
 * Recursively strip undefined values from an object.
 * Firestore rejects undefined; this converts them to null or removes them.
 */
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue
    if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Timestamp)) {
      result[key] = stripUndefined(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result
}

// Helper to convert Firestore Timestamp to Date
export function toDate(timestamp: Timestamp | Date | null | undefined): Date | null {
  if (!timestamp) return null
  if (timestamp instanceof Date) return timestamp
  if (timestamp instanceof Timestamp) return timestamp.toDate()
  return null
}

// Helper to convert Date to Firestore Timestamp
export function toTimestamp(date: Date | null | undefined): Timestamp | null {
  if (!date) return null
  return Timestamp.fromDate(date instanceof Date ? date : new Date(date))
}

// Helper to convert Firestore doc to object with id
export function docToObject<T extends DocumentData>(docSnap: FirebaseFirestore.DocumentSnapshot): T & { id: string } {
  const data = docSnap.data() as T
  return {
    ...data,
    id: docSnap.id,
  }
}

// Query constraint types
export type QueryConstraint = {
  field: string
  operator: FirebaseFirestore.WhereFilterOp
  value: unknown
} | {
  field: string
  direction: "asc" | "desc"
} | {
  limit: number
}

// Generic CRUD helpers
export async function findUnique<T extends DocumentData>(
  collectionName: string,
  id: string
): Promise<(T & { id: string }) | null> {
  const docSnap = await db.collection(collectionName).doc(id).get()
  if (!docSnap.exists) return null
  return docToObject<T>(docSnap)
}

export async function findMany<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  let query: FirebaseFirestore.Query = db.collection(collectionName)
  
  for (const constraint of constraints) {
    if ("operator" in constraint) {
      query = query.where(constraint.field, constraint.operator, constraint.value)
    } else if ("direction" in constraint) {
      query = query.orderBy(constraint.field, constraint.direction)
    } else if ("limit" in constraint) {
      query = query.limit(constraint.limit)
    }
  }
  
  const querySnapshot = await query.get()
  return querySnapshot.docs.map((docSnap) => docToObject<T>(docSnap))
}

export async function findFirst<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string }) | null> {
  const results = await findMany<T>(collectionName, [...constraints, { limit: 1 }])
  return results[0] || null
}

export async function create<T extends DocumentData>(
  collectionName: string,
  data: T & { id?: string }
): Promise<T & { id: string }> {
  const { id, ...docData } = data
  const docRef = id ? db.collection(collectionName).doc(id) : db.collection(collectionName).doc()
  
  const processedData = stripUndefined(
    Object.entries(docData).reduce((acc, [key, value]) => {
      if (value instanceof Date) {
        acc[key] = Timestamp.fromDate(value)
      } else {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, unknown>)
  )
  
  await docRef.set({
    ...processedData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  
  return { ...data, id: docRef.id }
}

export async function update<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const docRef = db.collection(collectionName).doc(id)
  
  const processedData = stripUndefined(
    Object.entries(data).reduce((acc, [key, value]) => {
      if (value instanceof Date) {
        acc[key] = Timestamp.fromDate(value)
      } else {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, unknown>)
  )
  
  await docRef.update({
    ...processedData,
    updatedAt: Timestamp.now(),
  })
}

export async function upsert<T extends DocumentData>(
  collectionName: string,
  whereField: string,
  whereValue: string,
  data: T & { id?: string }
): Promise<T & { id: string }> {
  const existing = await findFirst<T>(collectionName, [{ field: whereField, operator: "==", value: whereValue }])
  
  if (existing) {
    await update(collectionName, existing.id, data)
    return { ...existing, ...data }
  } else {
    return await create(collectionName, data)
  }
}

export async function deleteRecord(collectionName: string, id: string): Promise<void> {
  await db.collection(collectionName).doc(id).delete()
}

// Query helpers - return constraint objects
export function where(field: string, operator: FirebaseFirestore.WhereFilterOp, value: unknown): QueryConstraint {
  return { field, operator, value }
}

export function orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryConstraint {
  return { field, direction }
}

export function limit(count: number): QueryConstraint {
  return { limit: count }
}

/**
 * Recursively convert Firestore Timestamps/Dates to ISO strings
 * so objects can safely cross the server→client boundary.
 */
export function toPlain<T = any>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Timestamp) return obj.toDate().toISOString() as unknown as T
  if (obj instanceof Date) return obj.toISOString() as unknown as T
  if (Array.isArray(obj)) return obj.map(toPlain) as unknown as T
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = toPlain(value)
    }
    return result as T
  }
  return obj
}
