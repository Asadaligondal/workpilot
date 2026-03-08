"use client"

import { useTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BoltIcon, ChevronsUpDownIcon, PlusIcon, CheckIcon } from "lucide-react"
import { switchWorkspace, createWorkspace } from "@/app/(app)/actions"
import { useState } from "react"

interface WorkspaceSwitcherProps {
  workspaces: { id: string; name: string; plan: string }[]
  activeWorkspaceId: string | null
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar()
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")

  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0]

  function handleSwitch(id: string) {
    startTransition(() => switchWorkspace(id))
  }

  function handleCreate() {
    if (!newName.trim()) return
    startTransition(async () => {
      await createWorkspace({ name: newName.trim() })
      setNewName("")
      setShowCreate(false)
    })
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                />
              }
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <BoltIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {active?.name ?? "WorkPilot"}
                </span>
                <span className="truncate text-xs text-muted-foreground capitalize">
                  {active?.plan ?? "free"} plan
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Workspaces
                </DropdownMenuLabel>
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => handleSwitch(ws.id)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md bg-indigo-600 text-white">
                      <BoltIcon className="size-3" />
                    </div>
                    <span className="flex-1">{ws.name}</span>
                    {ws.id === activeWorkspaceId && (
                      <CheckIcon className="size-4 text-indigo-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onClick={() => setShowCreate(true)}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <PlusIcon className="size-4" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    Create workspace
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace Name</label>
              <Input
                placeholder="My Company"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
