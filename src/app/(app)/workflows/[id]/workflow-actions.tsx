"use client"

import { useState } from "react"
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
  LoaderIcon,
} from "lucide-react"
import { updateWorkflowStatus } from "./actions"

export function WorkflowActionsDropdown({
  workflowId,
  workspaceId,
  statusLabel,
  statusVariant,
}: {
  workflowId: string
  workspaceId: string
  statusLabel: string
  statusVariant: "default" | "secondary" | "destructive" | "outline"
}) {
  const router = useRouter()
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRunAnalysis() {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || "Analysis failed")
        return
      }
      await updateWorkflowStatus(workflowId, "ANALYZED")
      router.refresh()
    } catch (err) {
      setError(String(err))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700"
        onClick={handleRunAnalysis}
        disabled={analyzing}
      >
        {analyzing ? (
          <>
            <LoaderIcon className="mr-1 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <SparklesIcon className="mr-1 h-4 w-4" />
            Run AI Analysis
          </>
        )}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
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
