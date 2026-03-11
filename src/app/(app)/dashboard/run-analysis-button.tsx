"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlayIcon, LoaderIcon } from "lucide-react"

export function RunAnalysisButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setRunning(true)
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
      router.refresh()
    } catch (err) {
      setError(String(err))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700"
        onClick={handleRun}
        disabled={running}
      >
        {running ? (
          <>
            <LoaderIcon className="mr-1 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <PlayIcon className="mr-1 h-4 w-4" />
            Run Analysis
          </>
        )}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
