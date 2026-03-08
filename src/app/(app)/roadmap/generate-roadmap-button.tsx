"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SparklesIcon } from "lucide-react"
import { generateRoadmap } from "./actions"

export function GenerateRoadmapButton({
  workspaceId,
}: {
  workspaceId: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (!workspaceId) return null

  return (
    <Button
      className="bg-indigo-600 hover:bg-indigo-700"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await generateRoadmap(workspaceId)
          if (result?.success) router.refresh()
        })
      }}
    >
      <SparklesIcon className="mr-2 h-4 w-4" />
      {isPending ? "Generating…" : "Generate Roadmap"}
    </Button>
  )
}
