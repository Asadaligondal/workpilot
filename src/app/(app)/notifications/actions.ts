"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getActiveWorkspaceId } from "@/lib/workspace"

export async function getNotifications() {
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return []

  return prisma.notification.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  })
}

export async function markAsRead(id: string) {
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return

  await prisma.notification.updateMany({
    where: { id, workspaceId },
    data: { isRead: true },
  })
  revalidatePath("/notifications")
  revalidatePath("/")
}

export async function markAllRead() {
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return

  await prisma.notification.updateMany({
    where: { workspaceId },
    data: { isRead: true },
  })
  revalidatePath("/notifications")
  revalidatePath("/")
}
