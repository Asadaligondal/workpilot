import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { CommandPalette } from "@/components/command-palette"
import { CreateFirstWorkspace } from "@/components/create-first-workspace"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

async function getLayoutData() {
  try {
    const { getWorkspacesForUser, getActiveWorkspace } = await import("@/lib/workspace")
    const { getNotifications } = await import("@/app/(app)/notifications/actions")
    const { syncUser } = await import("@/lib/auth")
    const user = await syncUser()
    if (!user) {
      return {
        workspaces: [],
        activeWorkspaceId: null,
        unreadCount: 0,
        recentNotifications: [],
      }
    }

    const workspaces = await getWorkspacesForUser()
    const activeWorkspace = await getActiveWorkspace()

    let notifications: any[] = []
    if (activeWorkspace) {
      try {
        notifications = await getNotifications()
      } catch {
        notifications = []
      }
    }
    const unreadCount = notifications.filter((n: any) => !n.isRead).length
    const recentNotifications = notifications.slice(0, 5) as any

    return {
      workspaces: workspaces.filter((w): w is NonNullable<typeof w> => w !== null).map((w: any) => ({
        id: w.id,
        name: w.name || "",
        plan: w.subscription?.plan ?? "free",
      })),
      activeWorkspaceId: activeWorkspace?.id ?? null,
      unreadCount,
      recentNotifications,
    }
  } catch {
    return {
      workspaces: [],
      activeWorkspaceId: null,
      unreadCount: 0,
      recentNotifications: [],
    }
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    workspaces,
    activeWorkspaceId,
    unreadCount,
    recentNotifications,
  } = await getLayoutData()

  if (workspaces.length === 0) {
    return <CreateFirstWorkspace />
  }

  return (
    <SidebarProvider>
      <AppSidebar
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
      />
      <SidebarInset>
        <TopBar
          unreadCount={unreadCount}
          recentNotifications={recentNotifications}
        />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  )
}
