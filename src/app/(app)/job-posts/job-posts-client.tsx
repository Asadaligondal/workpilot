"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { generateJobPost } from "./actions"
import { getOpportunities } from "@/app/(app)/opportunities/actions"
import {
  BriefcaseIcon,
  PlusIcon,
  Loader2Icon,
  CopyIcon,
  CheckIcon,
} from "lucide-react"

const PLATFORMS = [
  { value: "Upwork", label: "Upwork" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "Generic", label: "Generic" },
]

type JobPost = {
  id: string
  title: string
  platform: string | null
  roleType: string | null
  content: string | null
  createdAt: Date
}

export function JobPostsClient({ jobPosts }: { jobPosts: JobPost[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(jobPosts[0]?.id ?? null)
  const [copied, setCopied] = useState(false)

  const selected = jobPosts.find((p) => p.id === selectedId)

  async function handleCopy() {
    const text = selected?.content ?? ""
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Job Posts</h3>
        <GenerateJobPostDialog onCreated={() => router.refresh()} />
      </div>

      {jobPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BriefcaseIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-sm text-muted-foreground">
              No job posts yet. Generate one to get started.
            </p>
            <GenerateJobPostDialog onCreated={() => router.refresh()} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            {jobPosts.map((p) => (
              <Card
                key={p.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedId === p.id && "ring-2 ring-indigo-600"
                )}
                onClick={() => setSelectedId(p.id)}
              >
                <CardHeader className="py-3">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <div className="flex items-center gap-2">
                    {p.platform && (
                      <Badge variant="secondary">{p.platform}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            {selected && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h3 className="font-medium">{selected.title}</h3>
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
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <Textarea
                    readOnly
                    value={selected.content ?? ""}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function GenerateJobPostDialog({
  onCreated,
}: {
  onCreated?: (id: string) => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [platform, setPlatform] = useState("Generic")
  const [roleType, setRoleType] = useState("Freelancer")
  const [skills, setSkills] = useState("")
  const [budgetRange, setBudgetRange] = useState("")
  const [opportunityId, setOpportunityId] = useState<string>("")
  const [opportunities, setOpportunities] = useState<
    { id: string; title: string }[]
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadOpportunities() {
    const list = await getOpportunities({})
    setOpportunities(list.map((o) => ({ id: o.id, title: o.title })))
  }

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (open) loadOpportunities()
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const selectedOpp = opportunities.find((o) => o.id === opportunityId)
      const jobTitle =
        title || selectedOpp?.title || "Automation Implementation Specialist"
      const skillsList = skills
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : []
      const result = await generateJobPost(
        jobTitle,
        platform,
        roleType,
        skillsList,
        budgetRange
      )
      if (result.success && result.id) {
        setOpen(false)
        setTitle("")
        setPlatform("Generic")
        setSkills("")
        setBudgetRange("")
        setOpportunityId("")
        onCreated?.(result.id)
        router.refresh()
      } else {
        setError(result.error || "Failed to generate job post")
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          <PlusIcon className="mr-1 h-4 w-4" />
          Generate Job Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Job Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Opportunity (optional)</Label>
            <Select
              value={opportunityId || "none"}
              onValueChange={(v) => setOpportunityId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select opportunity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Enter role manually</SelectItem>
                {opportunities.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Role / Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Automation Implementation Specialist"
            />
          </div>
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="roleType">Role type</Label>
            <Input
              id="roleType"
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              placeholder="Freelancer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Process automation, API integrations"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget range</Label>
            <Input
              id="budget"
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              placeholder="$5,000 - $10,000"
            />
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
