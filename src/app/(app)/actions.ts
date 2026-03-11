"use server"

import { db } from "@/lib/firebase"
import { requireUser } from "@/lib/auth"
import { setActiveWorkspaceId } from "@/lib/workspace"
import { logAudit } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { create, findFirst, where, update } from "@/lib/firestore-helpers"
import { Timestamp } from "firebase-admin/firestore"

export async function createWorkspace(data: {
  name: string
  industry?: string
}) {
  const user = await requireUser()

  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Math.random().toString(36).slice(2, 6)

  // Create workspace document
  const workspaceRef = db.collection("workspaces").doc()
  const workspaceId = workspaceRef.id
  
  await workspaceRef.set({
    name: data.name,
    slug,
    industry: data.industry || null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  // Create workspace member
  await create("workspaceMembers", {
    workspaceId,
    userId: user.id,
    role: "OWNER",
  })

  // Create subscription
  await db.collection("subscriptions").doc(workspaceId).set({
    workspaceId,
    plan: "free",
    status: "active",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  await setActiveWorkspaceId(workspaceId)
  await logAudit({
    workspaceId,
    userId: user.id,
    action: "workspace.created",
    entity: "Workspace",
    entityId: workspaceId,
    details: { name: data.name, industry: data.industry },
  })
  revalidatePath("/")
  
  return {
    id: workspaceId,
    name: data.name,
    slug,
    industry: data.industry || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function switchWorkspace(workspaceId: string) {
  const user = await requireUser()

  const member = await findFirst("workspaceMembers", [
    where("workspaceId", "==", workspaceId),
    where("userId", "==", user.id),
  ])
  if (!member) throw new Error("Not a member of this workspace")

  await setActiveWorkspaceId(workspaceId)
  revalidatePath("/")
}

export async function updateWorkspace(data: {
  name?: string
  industry?: string
}) {
  const user = await requireUser()
  const { getActiveWorkspaceId } = await import("@/lib/workspace")
  const wsId = await getActiveWorkspaceId()
  if (!wsId) throw new Error("No active workspace")

  const member = await findFirst("workspaceMembers", [
    where("workspaceId", "==", wsId),
    where("userId", "==", user.id),
  ])
  if (!member || !["OWNER", "ADMIN"].includes(member.role as string)) {
    throw new Error("Insufficient permissions")
  }

  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  }
  if (data.name) updateData.name = data.name
  if (data.industry !== undefined) updateData.industry = data.industry || null

  await update("workspaces", wsId, updateData)

  revalidatePath("/settings")
}

export async function inviteMember(email: string, role: "ADMIN" | "MEMBER" | "VIEWER") {
  // Stub for now — will send email invite in later milestone
  return { success: true, message: "Invite functionality coming soon" }
}
