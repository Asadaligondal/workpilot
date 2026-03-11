"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, CheckCheck } from "lucide-react"
import { markAllRead } from "@/app/(app)/notifications/actions"
import type { Notification } from "@/types/notification"

interface NotificationBellProps {
  unreadCount: number
  recentNotifications: Notification[]
}

export function NotificationBell({
  unreadCount,
  recentNotifications,
}: NotificationBellProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full p-0 text-[10px]"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
        <span className="sr-only">Notifications</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <form action={markAllRead}>
              <button
                type="submit"
                className="inline-flex items-center rounded-md px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Mark all read
              </button>
            </form>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            recentNotifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                render={<Link href="/notifications" />}
                className="flex flex-col items-start gap-0.5 px-2 py-2"
              >
                <span className="font-medium">{n.title}</span>
                {n.message && (
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {n.message}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {new Date(n.createdAt as any).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuItem
          render={<Link href="/notifications" />}
          className="justify-center border-t py-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
