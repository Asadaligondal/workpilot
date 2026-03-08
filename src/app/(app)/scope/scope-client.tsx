"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { generateScope, generateTaskBreakdown, updateScopeContent } from "./actions"
import {
  ClipboardListIcon,
  Loader2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
} from "lucide-react"

type ScopeContent = {
  businessRequirements?: string
  technicalScope?: string
  deliverables?: string
  assumptions?: string
  acceptanceCriteria?: string
  outOfScope?: string
}

type TaskItem = {
  id: string
  name: string
  tasks?: TaskItem[]
}

type StoryItem = {
  id: string
  name: string
  tasks?: TaskItem[]
}

type EpicItem = {
  id: string
  name: string
  stories?: StoryItem[]
}

type TaskBreakdown = {
  epics?: EpicItem[]
}

type Scope = {
  id: string
  content: unknown
  taskBreakdown: unknown
  updatedAt: Date
}

function getScopeContent(content: unknown): ScopeContent {
  const c = content as ScopeContent | null
  return c ?? {}
}

function getTaskBreakdown(tb: unknown): TaskBreakdown {
  const t = tb as TaskBreakdown | null
  return t ?? {}
}

export function GenerateScopeButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await generateScope()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      className="bg-indigo-600 hover:bg-indigo-700"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? <Loader2Icon className="mr-1 h-4 w-4 animate-spin" /> : null}
      Generate Scope
    </Button>
  )
}

function flattenTasks(epics: EpicItem[]): { epic: string; story: string; task: string }[] {
  const rows: { epic: string; story: string; task: string }[] = []
  for (const epic of epics) {
    for (const story of epic.stories ?? []) {
      for (const task of story.tasks ?? []) {
        rows.push({
          epic: epic.name,
          story: story.name,
          task: task.name,
        })
      }
      if (!story.tasks?.length) {
        rows.push({ epic: epic.name, story: story.name, task: "" })
      }
    }
    if (!epic.stories?.length) {
      rows.push({ epic: epic.name, story: "", task: "" })
    }
  }
  return rows
}

function exportTasksCSV(epics: EpicItem[]) {
  const rows = flattenTasks(epics)
  const header = "Epic,Story,Task\n"
  const csv = header + rows.map((r) => `"${r.epic}","${r.story}","${r.task}"`).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `scope-tasks-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ScopeClient({ scope }: { scope: Scope | null }) {
  const router = useRouter()
  const [content, setContent] = useState<ScopeContent>(
    scope ? getScopeContent(scope.content) : {}
  )
  const [saving, setSaving] = useState(false)
  const [generatingScope, setGeneratingScope] = useState(false)
  const [generatingTasks, setGeneratingTasks] = useState(false)

  const taskBreakdown = scope ? getTaskBreakdown(scope.taskBreakdown) : {}
  const epics = taskBreakdown.epics ?? []

  const sections = [
    { key: "businessRequirements" as const, label: "Business Requirements" },
    { key: "technicalScope" as const, label: "Technical Scope" },
    { key: "deliverables" as const, label: "Deliverables" },
    { key: "assumptions" as const, label: "Assumptions" },
    { key: "acceptanceCriteria" as const, label: "Acceptance Criteria" },
    { key: "outOfScope" as const, label: "Out of Scope" },
  ]

  async function handleGenerateScope() {
    setGeneratingScope(true)
    try {
      await generateScope()
      router.refresh()
    } finally {
      setGeneratingScope(false)
    }
  }

  async function handleGenerateTaskBreakdown() {
    setGeneratingTasks(true)
    try {
      await generateTaskBreakdown()
      router.refresh()
    } finally {
      setGeneratingTasks(false)
    }
  }

  async function handleSave() {
    if (!scope) return
    setSaving(true)
    await updateScopeContent(content)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={handleGenerateScope}
          disabled={generatingScope}
        >
          {generatingScope ? (
            <Loader2Icon className="mr-1 h-4 w-4 animate-spin" />
          ) : null}
          Generate Scope
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateTaskBreakdown}
          disabled={generatingTasks}
        >
          {generatingTasks ? (
            <Loader2Icon className="mr-1 h-4 w-4 animate-spin" />
          ) : null}
          Generate Task Breakdown
        </Button>
        {epics.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportTasksCSV(epics)}
          >
            <DownloadIcon className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {!scope ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardListIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-sm text-muted-foreground">
              No scope document yet. Generate one from your roadmap and opportunities.
            </p>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleGenerateScope}
              disabled={generatingScope}
            >
              {generatingScope ? (
                <Loader2Icon className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              Generate Scope
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="font-medium">Implementation Scope Document</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
              >
                {saving ? <Loader2Icon className="mr-1 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-muted-foreground">{label}</Label>
                  <Textarea
                    value={content[key] ?? ""}
                    onChange={(e) =>
                      setContent((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="mt-1 min-h-[80px]"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {epics.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-medium">Task Breakdown</h3>
                <p className="text-sm text-muted-foreground">
                  Epics → Stories → Tasks
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {epics.map((epic) => (
                    <EpicRow key={epic.id} epic={epic} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function EpicRow({ epic }: { epic: EpicItem }) {
  const [open, setOpen] = useState(true)
  const stories = epic.stories ?? []

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
            open && "bg-muted/50"
          )}
        >
          {open ? (
            <ChevronDownIcon className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 shrink-0" />
          )}
          <Badge variant="secondary">Epic</Badge>
          {epic.name}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 mt-2 space-y-2 border-l pl-4">
          {stories.map((story) => (
            <StoryRow key={story.id} story={story} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function StoryRow({ story }: { story: StoryItem }) {
  const [open, setOpen] = useState(true)
  const tasks = story.tasks ?? []

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50",
            open && "bg-muted/30"
          )}
        >
          {open ? (
            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
          )}
          <Badge variant="outline" className="text-xs">
            Story
          </Badge>
          {story.name}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="ml-6 mt-1 space-y-1 border-l pl-4">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-2 py-1 text-sm text-muted-foreground"
            >
              <span className="text-foreground">•</span>
              {task.name}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
