"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BoltIcon } from "lucide-react"
import { createWorkspace } from "@/app/(app)/actions"

export function CreateFirstWorkspace() {
  const [name, setName] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleCreate() {
    if (!name.trim()) return
    setError("")
    startTransition(async () => {
      try {
        await createWorkspace({ name: name.trim() })
      } catch (err: any) {
        setError(err.message || "Failed to create workspace")
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <BoltIcon className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to WorkPilot</CardTitle>
          <CardDescription>
            Create your first workspace to get started. A workspace holds all your
            workflows, opportunities, and reports for one business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace Name</label>
              <Input
                placeholder="e.g. My Agency, Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                disabled={isPending}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
