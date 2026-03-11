/**
 * Notification type
 */
export type Notification = {
  id: string
  workspaceId: string
  type: string
  title: string
  message: string | null
  isRead: boolean
  createdAt: Date | { toDate: () => Date } | { seconds: number; nanoseconds: number }
}
