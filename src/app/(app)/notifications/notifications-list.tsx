"use client"

import { markAsRead } from "./actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bell, Check } from "lucide-react"
import type { Notification } from "@prisma/client"

interface NotificationsListProps {
  notifications: Notification[]
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          No notifications yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          You&apos;ll see workspace updates here
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-1">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors",
            notification.isRead
              ? "border-transparent bg-muted/30"
              : "border-indigo-200/50 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-950/20"
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{notification.title}</span>
              {!notification.isRead && (
                <Badge
                  variant="secondary"
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  New
                </Badge>
              )}
            </div>
            {notification.message && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {notification.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(notification.createdAt).toLocaleDateString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          {!notification.isRead && (
            <form action={markAsRead.bind(null, notification.id)}>
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-400"
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            </form>
          )}
        </li>
      ))}
    </ul>
  )
}
