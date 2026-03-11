import { cookies } from "next/headers"
import { db } from "@/lib/firebase"
import { requireUser } from "@/lib/auth"
import { findMany, findFirst, where, orderBy } from "./firestore-helpers"

const WORKSPACE_COOKIE = "workpilot-workspace-id"

export async function getActiveWorkspaceId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(WORKSPACE_COOKIE)?.value ?? null
}

export async function setActiveWorkspaceId(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function getWorkspacesForUser() {
  const user = await requireUser()
  
  // Get workspace memberships for this user
  const memberships = await findMany("workspaceMembers", [
    where("userId", "==", user.id),
  ])
  
  if (memberships.length === 0) return []
  
  // Get workspaces by document ID
  const workspaces = await Promise.all(
    memberships.map(async (membership) => {
      const workspaceDoc = await db.collection("workspaces").doc(membership.workspaceId).get()
      if (!workspaceDoc.exists) return null
      
      const workspace = { id: workspaceDoc.id, ...workspaceDoc.data() }
      
      // Get subscription if exists
      const subscriptionDoc = await db.collection("subscriptions").doc(membership.workspaceId).get()
      const subscription = subscriptionDoc.exists ? { id: subscriptionDoc.id, ...subscriptionDoc.data() } : null
      
      // Count workflows and opportunities
      const workflows = await findMany("workflows", [where("workspaceId", "==", membership.workspaceId)])
      const opportunities = await findMany("opportunities", [where("workspaceId", "==", membership.workspaceId)])
      
      return {
        ...workspace,
        members: [membership],
        subscription: subscription || null,
        _count: {
          workflows: workflows.length,
          opportunities: opportunities.length,
        },
      }
    })
  )
  
  return workspaces.filter(Boolean).sort((a: any, b: any) => {
    const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.getTime?.() || 0)
    const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.getTime?.() || 0)
    return bDate - aDate
  })
}

export async function getActiveWorkspace() {
  const user = await requireUser()
  const activeId = await getActiveWorkspaceId()

  if (activeId) {
    // Check if user is a member
    const membership = await findFirst("workspaceMembers", [
      where("workspaceId", "==", activeId),
      where("userId", "==", user.id),
    ])
    
    if (membership) {
      const workspaceDoc = await db.collection("workspaces").doc(activeId).get()
      if (workspaceDoc.exists) {
        const workspace = { id: workspaceDoc.id, ...workspaceDoc.data() }
        const subscriptionDoc = await db.collection("subscriptions").doc(activeId).get()
        const subscription = subscriptionDoc.exists ? { id: subscriptionDoc.id, ...subscriptionDoc.data() } : null
        return {
          ...workspace,
          members: [membership],
          subscription: subscription || null,
        }
      }
    }
  }

  // Get first workspace
  const firstMembership = await findFirst("workspaceMembers", [
    where("userId", "==", user.id),
    orderBy("createdAt", "asc"),
  ])

  if (firstMembership) {
    const workspaceDoc = await db.collection("workspaces").doc(firstMembership.workspaceId).get()
    if (workspaceDoc.exists) {
      const workspace = { id: workspaceDoc.id, ...workspaceDoc.data() }
      await setActiveWorkspaceId(workspace.id)
      const subscriptionDoc = await db.collection("subscriptions").doc(workspace.id).get()
      const subscription = subscriptionDoc.exists ? { id: subscriptionDoc.id, ...subscriptionDoc.data() } : null
      return {
        ...workspace,
        members: [firstMembership],
        subscription: subscription || null,
      }
    }
  }

  return null
}
