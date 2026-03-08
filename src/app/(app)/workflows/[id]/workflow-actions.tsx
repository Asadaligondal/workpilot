"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronDownIcon,
  PencilIcon,
  CopyIcon,
  TrashIcon,
  SparklesIcon,
} from "lucide-react"
import { updateWorkflowStatus } from "./actions"

export function WorkflowActionsDropdown({
  workflowId,
  statusLabel,
  statusVariant,
}: {
  workflowId: string
  statusLabel: string
  statusVariant: "default" | "secondary" | "destructive" | "outline"
}) {
  const router = useRouter()

  async function handleMarkReady() {
    const res = await updateWorkflowStatus(workflowId, "ANALYZED")
    if (res.success) router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700"
        onClick={handleMarkReady}
      >
        <SparklesIcon className="mr-1 h-4 w-4" />
        Mark Ready for Analysis
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline" size="sm">
            Actions
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => router.push(`/workflows/${workflowId}/edit`)}
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => router.push(`/workflows/new?duplicate=${workflowId}`)}
          >
            <CopyIcon className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => router.push(`/workflows/${workflowId}/delete`)}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Badge variant={statusVariant}>{statusLabel}</Badge>
    </div>
  )
}
