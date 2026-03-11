"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { NotificationBell } from "@/components/notification-bell"
import { SearchIcon } from "lucide-react"
import type { Notification } from "@/types/notification"

interface TopBarProps {
  unreadCount?: number
  recentNotifications?: Notification[]
}

export function TopBar({
  unreadCount = 0,
  recentNotifications = [],
}: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      <div className="relative flex-1 max-w-md">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search workflows, opportunities..."
          className="h-9 pl-8 bg-muted/50 border-none"
        />
      </div>
      <NotificationBell
        unreadCount={unreadCount}
        recentNotifications={recentNotifications}
      />
    </header>
  )
}
