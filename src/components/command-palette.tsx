"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import {
  LayoutDashboardIcon,
  GitBranchIcon,
  LightbulbIcon,
  MapIcon,
  DollarSignIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  BriefcaseIcon,
  ClipboardListIcon,
  SettingsIcon,
  ScrollTextIcon,
  BellIcon,
  SparklesIcon,
  BarChart3Icon,
  PlusIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Workflows", href: "/workflows", icon: GitBranchIcon },
  { title: "Opportunities", href: "/opportunities", icon: LightbulbIcon },
  { title: "Roadmap", href: "/roadmap", icon: MapIcon },
  { title: "Budget", href: "/budget", icon: DollarSignIcon },
  { title: "Reports", href: "/reports", icon: FileTextIcon },
  { title: "Proposals", href: "/proposals", icon: FileSpreadsheetIcon },
  { title: "Job Posts", href: "/job-posts", icon: BriefcaseIcon },
  { title: "Scope", href: "/scope", icon: ClipboardListIcon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
  { title: "Audit Log", href: "/admin", icon: ScrollTextIcon },
  { title: "Notifications", href: "/notifications", icon: BellIcon },
]

const quickActions = [
  { title: "Run AI Analysis", href: "/opportunities", icon: SparklesIcon },
  { title: "Generate Report", href: "/reports", icon: BarChart3Icon },
  { title: "Create Workflow", href: "/workflows/new", icon: PlusIcon },
]

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      overlayClassName="bg-black/60 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      contentClassName={cn(
        "fixed left-1/2 top-[15vh] z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-xl bg-white shadow-2xl",
        "dark:bg-zinc-900"
      )}
    >
      <Command.Input
        placeholder="Search or type a command..."
        className={cn(
          "w-full border-b border-zinc-200 bg-transparent px-4 py-3 text-base outline-none",
          "placeholder:text-zinc-500 dark:border-zinc-700 dark:placeholder:text-zinc-400"
        )}
      />
      <Command.List
        className={cn(
          "max-h-[min(400px,var(--cmdk-list-height))] overflow-y-auto p-2",
          "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500 [&_[cmdk-group-heading]]:dark:text-zinc-400"
        )}
      >
        <Command.Empty className="py-6 text-center text-sm text-zinc-500">
          No results found.
        </Command.Empty>

        <Command.Group heading="Quick actions">
          {quickActions.map((item) => (
            <Command.Item
              key={item.href}
              value={item.title}
              onSelect={() => handleSelect(item.href)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none",
                "data-[selected]:bg-indigo-50 data-[selected]:text-indigo-700",
                "dark:data-[selected]:bg-indigo-950/50 dark:data-[selected]:text-indigo-300"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Separator className="my-1 h-px bg-zinc-200 dark:bg-zinc-700" />

        <Command.Group heading="Navigation">
          {navItems.map((item) => (
            <Command.Item
              key={item.href}
              value={item.title}
              onSelect={() => handleSelect(item.href)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none",
                "data-[selected]:bg-indigo-50 data-[selected]:text-indigo-700",
                "dark:data-[selected]:bg-indigo-950/50 dark:data-[selected]:text-indigo-300"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
