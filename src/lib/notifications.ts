import { create } from "./firestore-helpers"

export async function createNotification(params: {
  workspaceId: string
  type: string
  title: string
  message?: string
}) {
  return create("notifications", {
    workspaceId: params.workspaceId,
    type: params.type,
    title: params.title,
    message: params.message || null,
    isRead: false,
  })
}
