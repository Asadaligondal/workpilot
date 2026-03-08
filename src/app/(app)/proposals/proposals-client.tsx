"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { generateProposal, updateProposalContent } from "./actions"
import {
  FileSpreadsheetIcon,
  PlusIcon,
  Loader2Icon,
  CopyIcon,
  CheckIcon,
} from "lucide-react"

const TEMPLATES = [
  { value: "consulting", label: "Consulting" },
  { value: "agency", label: "Agency" },
  { value: "internal", label: "Internal Brief" },
]

type Proposal = {
  id: string
  title: string
  clientName: string | null
  content: unknown
  createdAt: Date
}

function getProposalMarkdown(content: unknown): string {
  const c = content as { markdown?: string } | null
  return c?.markdown ?? ""
}

export function ProposalsClient({
  proposals,
  initialProposalId,
}: {
  proposals: Proposal[]
  initialProposalId?: string | null
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialProposalId ?? proposals[0]?.id ?? null
  )
  const [editedContent, setEditedContent] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const selected = proposals.find((p) => p.id === selectedId)
  const displayContent = selected
    ? editedContent || getProposalMarkdown(selected.content)
    : ""

  function handleSelect(p: Proposal) {
    setSelectedId(p.id)
    setEditedContent(getProposalMarkdown(p.content))
  }

  async function handleCopy() {
    const text = editedContent || (selected && getProposalMarkdown(selected.content)) || ""
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)
    await updateProposalContent(selectedId, editedContent)
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Proposals</h3>
            <GenerateProposalDialog
              onCreated={(id) => {
                setSelectedId(id)
                setEditedContent("")
              }}
            />
          </div>
          {proposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No proposals yet. Generate one to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {proposals.map((p) => (
                <Card
                  key={p.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedId === p.id && "ring-2 ring-indigo-600"
                  )}
                  onClick={() => handleSelect(p)}
                >
                  <CardHeader className="py-3">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.clientName || "—"} · {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="font-medium">{selected.title}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                  >
                    {copied ? (
                      <CheckIcon className="mr-1 h-4 w-4" />
                    ) : (
                      <CopyIcon className="mr-1 h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy to clipboard"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2Icon className="mr-1 h-4 w-4 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editedContent || getProposalMarkdown(selected.content)}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Proposal content..."
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileSpreadsheetIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select a proposal or generate a new one
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export function GenerateProposalDialog({
  onCreated,
}: {
  onCreated?: (id: string) => void
} = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clientName, setClientName] = useState("")
  const [template, setTemplate] = useState("consulting")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateProposal(clientName, template)
      if (result.success && result.id) {
        setOpen(false)
        setClientName("")
        onCreated?.(result.id)
      } else {
        setError(result.error || "Failed to generate proposal")
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          <PlusIcon className="mr-1 h-4 w-4" />
          Generate Proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Proposal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client name</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-2">
            <Label>Proposal template</Label>
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((t) => (
                <label
                  key={t.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                    template === t.value
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                      : "border-input hover:bg-muted"
                  )}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t.value}
                    checked={template === t.value}
                    onChange={() => setTemplate(t.value)}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
