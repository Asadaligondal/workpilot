"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import {
  LayoutDashboardIcon,
  GitBranchIcon,
  LightbulbIcon,
  MapIcon,
  DollarSignIcon,
  FileTextIcon,
  BuildingIcon,
  SettingsIcon,
  FileSpreadsheetIcon,
  BriefcaseIcon,
  ClipboardListIcon,
  CreditCardIcon,
  ShieldIcon,
} from "lucide-react"

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Business Profile", href: "/business-profile", icon: BuildingIcon },
  { title: "Workflows", href: "/workflows", icon: GitBranchIcon },
  { title: "Opportunities", href: "/opportunities", icon: LightbulbIcon },
  { title: "Roadmap", href: "/roadmap", icon: MapIcon },
  { title: "Budget & ROI", href: "/budget", icon: DollarSignIcon },
  { title: "Reports", href: "/reports", icon: FileTextIcon },
]

const outputNav = [
  { title: "Proposals", href: "/proposals", icon: FileSpreadsheetIcon },
  { title: "Job Posts", href: "/job-posts", icon: BriefcaseIcon },
  { title: "Scope & Tasks", href: "/scope", icon: ClipboardListIcon },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  workspaces: { id: string; name: string; plan: string }[]
  activeWorkspaceId: string | null
}

export function AppSidebar({ workspaces, activeWorkspaceId, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Outputs</SidebarGroupLabel>
          <SidebarMenu>
            {outputNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Admin"
                isActive={pathname === "/admin" || pathname.startsWith("/admin/")}
                render={<Link href="/admin" />}
              >
                <ShieldIcon />
                <span>Admin</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Audit Log"
                isActive={pathname === "/audit-log" || pathname.startsWith("/audit-log/")}
                render={<Link href="/audit-log" />}
              >
                <ClipboardListIcon />
                <span>Audit Log</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Billing"
                isActive={pathname === "/billing" || pathname.startsWith("/billing/")}
                render={<Link href="/billing" />}
              >
                <CreditCardIcon />
                <span>Billing</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Settings"
                isActive={pathname.startsWith("/settings")}
                render={<Link href="/settings" />}
              >
                <SettingsIcon />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
