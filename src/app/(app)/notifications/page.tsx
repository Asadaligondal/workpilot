import { PageHeader } from "@/components/page-header"
import { NotificationsList } from "./notifications-list"
import { Button } from "@/components/ui/button"
import { markAllRead, getNotifications } from "./actions"
import { CheckCheck } from "lucide-react"

export default async function NotificationsPage() {
  const notifications = await getNotifications() as any[]
  const unreadCount = notifications.filter((n: any) => !n.isRead).length

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Notifications"
        description="Stay updated with workspace activity"
        actions={
          unreadCount > 0 ? (
            <form action={markAllRead}>
              <Button type="submit" variant="outline" size="sm">
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            </form>
          ) : undefined
        }
      />
      <div className="flex-1 px-6 py-4">
        <NotificationsList notifications={notifications} />
      </div>
    </div>
  )
}
