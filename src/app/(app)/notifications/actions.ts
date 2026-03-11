"use server"

import { revalidatePath } from "next/cache"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { findMany, where, orderBy, update } from "@/lib/firestore-helpers"

export async function getNotifications() {
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return []

  return findMany("notifications", [
    where("workspaceId", "==", workspaceId),
    orderBy("createdAt", "desc"),
  ])
}

export async function markAsRead(id: string) {
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return

  await update("notifications", id, { isRead: true })
  revalidatePath("/notifications")
  revalidatePath("/")
}

export async function markAllRead() {
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return

  const notifications = await findMany("notifications", [
    where("workspaceId", "==", workspaceId),
    where("isRead", "==", false),
  ])

  for (const notification of notifications) {
    await update("notifications", notification.id, { isRead: true })
  }

  revalidatePath("/notifications")
  revalidatePath("/")
}
