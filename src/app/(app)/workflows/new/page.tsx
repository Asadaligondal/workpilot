"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createWorkflow, getDepartments } from "../actions"
import type { CreateWorkflowStepInput } from "../actions"
import { WORKFLOW_TEMPLATES } from "../templates"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  FileSpreadsheetIcon,
  ClipboardListIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const FREQUENCIES = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "as-needed", label: "As needed" },
]

type Department = { id: string; name: string }

const emptyStep: CreateWorkflowStepInput = {
  name: "",
  description: "",
  actorRole: "",
  toolUsed: "",
  timeMinutes: undefined,
  isManual: true,
  painPoints: "",
}

export default function NewWorkflowPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [departments, setDepartments] = useState<Department[]>([])
  const [activeTab, setActiveTab] = useState("guided")

  // Guided form state
  const [guidedStep, setGuidedStep] = useState(1)
  const [name, setName] = useState("")
  const [departmentId, setDepartmentId] = useState<string>("")
  const [description, setDescription] = useState("")
  const [trigger, setTrigger] = useState("")
  const [frequency, setFrequency] = useState("")
  const [owner, setOwner] = useState("")
  const [steps, setSteps] = useState<CreateWorkflowStepInput[]>([{ ...emptyStep }])

  // CSV state
  const [csvWorkflowName, setCsvWorkflowName] = useState("")
  const [csvDepartmentId, setCsvDepartmentId] = useState("")
  const [csvRows, setCsvRows] = useState<{ stepName: string; actor: string; tool: string; time: string; notes: string }[]>([])
  const [csvError, setCsvError] = useState<string | null>(null)

  useEffect(() => {
    getDepartments().then((d) => setDepartments(d as any))
  }, [])

  function applyTemplate(template: (typeof WORKFLOW_TEMPLATES)[0]) {
    setName(template.name)
    setDescription(template.description)
    setSteps(
      template.steps.map((s) => ({
        name: s.name,
        description: s.description ?? "",
        actorRole: s.actorRole ?? "",
        toolUsed: s.toolUsed ?? "",
        timeMinutes: s.timeMinutes,
        isManual: s.isManual ?? true,
        painPoints: s.painPoints ?? "",
      }))
    )
    setActiveTab("guided")
    setGuidedStep(2)
  }

  function addStep() {
    setSteps((prev) => [...prev, { ...emptyStep }])
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  function updateStep(index: number, field: keyof CreateWorkflowStepInput, value: string | number | boolean) {
    setSteps((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function parseCsv(text: string) {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return []
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const rows: { stepName: string; actor: string; tool: string; time: string; notes: string }[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, j) => {
        row[h] = values[j] ?? ""
      })
      rows.push({
        stepName: row["step name"] ?? row["stepname"] ?? "",
        actor: row["actor"] ?? "",
        tool: row["tool"] ?? "",
        time: row["time (min)"] ?? row["time"] ?? "",
        notes: row["notes"] ?? "",
      })
    }
    return rows
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        const rows = parseCsv(text)
        setCsvRows(rows)
      } catch {
        setCsvError("Failed to parse CSV")
      }
    }
    reader.readAsText(file)
  }

  function handleSubmitGuided() {
    const payload = {
      name,
      departmentId: departmentId || null,
      description: description || undefined,
      trigger: trigger || undefined,
      frequency: frequency || undefined,
      owner: owner || undefined,
      steps: steps.filter((s) => s.name.trim()),
    }
    startTransition(async () => {
      const result = await createWorkflow(payload)
      if (result.success && result.id) {
        router.push(`/workflows/${result.id}`)
      }
    })
  }

  function handleSubmitCsv() {
    const payload = {
      name: csvWorkflowName,
      departmentId: csvDepartmentId || null,
      steps: csvRows.map((r) => ({
        name: r.stepName,
        description: r.notes,
        actorRole: r.actor,
        toolUsed: r.tool,
        timeMinutes: r.time ? parseInt(r.time, 10) : undefined,
        isManual: true,
      })),
    }
    startTransition(async () => {
      const result = await createWorkflow(payload)
      if (result.success && result.id) {
        router.push(`/workflows/${result.id}`)
      }
    })
  }

  const canSubmitGuided =
    guidedStep === 3 && name.trim() && steps.some((s) => s.name.trim())

  const canSubmitCsv = csvWorkflowName.trim() && csvRows.length > 0

  return (
    <>
      <PageHeader title="Workflow Intake Center" description="Add workflows via guided form, template, or CSV import" />
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v || "manual")} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="guided" className="gap-2">
              <ClipboardListIcon className="h-4 w-4" />
              Guided Form
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-2">
              <FileSpreadsheetIcon className="h-4 w-4" />
              From Template
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <UploadIcon className="h-4 w-4" />
              CSV Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guided" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  Step {guidedStep} of 3:{" "}
                  {guidedStep === 1 ? "Workflow basics" : guidedStep === 2 ? "Add steps" : "Review & submit"}
                </CardTitle>
                <CardDescription>
                  {guidedStep === 1 && "Define the workflow name, department, and high-level details."}
                  {guidedStep === 2 && "Add each step in the workflow. You can add more steps as needed."}
                  {guidedStep === 3 && "Review your workflow before submitting."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {guidedStep === 1 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lead Handling" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={departmentId} onValueChange={(v) => setDepartmentId(v || "")}>
                        <SelectTrigger id="department" className="w-full">
                          <SelectValue placeholder="Select department">
                            {departmentId ? departments.find((d) => d.id === departmentId)?.name ?? "Select department" : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this workflow" rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trigger">Trigger</Label>
                      <Input id="trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="What starts this workflow?" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select value={frequency} onValueChange={(v) => setFrequency(v || "")}>
                        <SelectTrigger id="frequency" className="w-full">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="owner">Owner</Label>
                      <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Workflow owner (optional)" />
                    </div>
                  </div>
                )}

                {guidedStep === 2 && (
                  <div className="space-y-4">
                    {steps.map((step, i) => (
                      <Card key={i} size="sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-sm">Step {i + 1}</CardTitle>
                          <Button variant="ghost" size="icon-xs" onClick={() => removeStep(i)} disabled={steps.length <= 1}>
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Step Name</Label>
                            <Input value={step.name} onChange={(e) => updateStep(i, "name", e.target.value)} placeholder="e.g. Lead received" />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Description</Label>
                            <Input value={step.description ?? ""} onChange={(e) => updateStep(i, "description", e.target.value)} placeholder="What happens in this step?" />
                          </div>
                          <div className="space-y-2">
                            <Label>Actor / Role</Label>
                            <Input value={step.actorRole ?? ""} onChange={(e) => updateStep(i, "actorRole", e.target.value)} placeholder="e.g. Sales Rep" />
                          </div>
                          <div className="space-y-2">
                            <Label>Tool Used</Label>
                            <Input value={step.toolUsed ?? ""} onChange={(e) => updateStep(i, "toolUsed", e.target.value)} placeholder="e.g. CRM" />
                          </div>
                          <div className="space-y-2">
                            <Label>Time (minutes)</Label>
                            <Input
                                type="number"
                                value={step.timeMinutes ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value
                                  const n = v ? parseInt(v, 10) : undefined
                                  updateStep(i, "timeMinutes", Number.isNaN(n) ? 0 : (n ?? 0))
                                }}
                                placeholder="e.g. 15"
                              />
                          </div>
                          <div className="flex items-center gap-2 space-y-2">
                            <Checkbox checked={step.isManual ?? true} onCheckedChange={(c) => updateStep(i, "isManual", c === true)} />
                            <Label>Is manual step</Label>
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Pain Points</Label>
                            <Input value={step.painPoints ?? ""} onChange={(e) => updateStep(i, "painPoints", e.target.value)} placeholder="Any pain points for this step?" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="outline" onClick={addStep} className="w-full">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add step
                    </Button>
                  </div>
                )}

                {guidedStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">{description || "—"}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Department: {departments.find((d) => d.id === departmentId)?.name ?? "—"} | Trigger: {trigger || "—"} | Frequency: {frequency || "—"}
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Actor</TableHead>
                          <TableHead>Tool</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Manual</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {steps.filter((s) => s.name.trim()).map((s, i) => (
                          <TableRow key={i}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>{s.actorRole ?? "—"}</TableCell>
                            <TableCell>{s.toolUsed ?? "—"}</TableCell>
                            <TableCell>{s.timeMinutes ?? "—"}</TableCell>
                            <TableCell>{s.isManual ? "Yes" : "No"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setGuidedStep((s) => Math.max(1, s - 1))} disabled={guidedStep === 1}>
                  <ChevronLeftIcon className="mr-1 h-4 w-4" />
                  Back
                </Button>
                {guidedStep < 3 ? (
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setGuidedStep((s) => s + 1)}
                    disabled={guidedStep === 1 && !name.trim()}
                  >
                    Next
                    <ChevronRightIcon className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmitGuided} disabled={!canSubmitGuided || isPending}>
                    {isPending ? "Creating..." : "Create Workflow"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="template" className="space-y-6">
            <p className="text-sm text-muted-foreground">Choose a template to pre-fill the guided form. You can customize it before submitting.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WORKFLOW_TEMPLATES.map((t) => (
                <Card key={t.name} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => applyTemplate(t)}>
                  <CardHeader>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <CardDescription>{t.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <span className="text-xs text-muted-foreground">{t.steps.length} steps · {t.industry}</span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>CSV Import</CardTitle>
                <CardDescription>Upload a CSV file with workflow steps. Expected columns: Step Name, Actor, Tool, Time (min), Notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="csv-name">Workflow Name</Label>
                    <Input id="csv-name" value={csvWorkflowName} onChange={(e) => setCsvWorkflowName(e.target.value)} placeholder="e.g. Imported Workflow" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csv-dept">Department</Label>
                    <Select value={csvDepartmentId} onValueChange={(v) => setCsvDepartmentId(v || "")}>
                      <SelectTrigger id="csv-dept" className="w-full">
                        <SelectValue placeholder="Select department">
                          {csvDepartmentId ? departments.find((d) => d.id === csvDepartmentId)?.name ?? "Select department" : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>CSV File</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-dashed p-6">
                    <Input type="file" accept=".csv" onChange={handleCsvFile} className="max-w-xs" />
                  </div>
                  {csvError && <p className="text-sm text-destructive">{csvError}</p>}
                </div>
                {csvRows.length > 0 && (
                  <>
                    <Label>Preview</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Step Name</TableHead>
                          <TableHead>Actor</TableHead>
                          <TableHead>Tool</TableHead>
                          <TableHead>Time (min)</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvRows.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell>{r.stepName}</TableCell>
                            <TableCell>{r.actor}</TableCell>
                            <TableCell>{r.tool}</TableCell>
                            <TableCell>{r.time}</TableCell>
                            <TableCell>{r.notes}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmitCsv} disabled={!canSubmitCsv || isPending}>
                  {isPending ? "Creating..." : "Create Workflow from CSV"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
