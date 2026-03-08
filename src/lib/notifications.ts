import { prisma } from "@/lib/prisma"

export async function createNotification(params: {
  workspaceId: string
  type: string
  title: string
  message?: string
}) {
  return prisma.notification.create({
    data: {
      workspaceId: params.workspaceId,
      type: params.type,
      title: params.title,
      message: params.message,
    },
  })
}
