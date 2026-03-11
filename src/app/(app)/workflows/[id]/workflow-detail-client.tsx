"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Separator } from "@/components/ui/separator"
import {
  addStep,
  updateStep,
  deleteStep,
  reorderSteps,
  addPainPoint,
  deletePainPoint,
  updateWorkflow,
  type UpdateStepData,
} from "./actions"
import {
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react"

type TeamRole = {
  id: string
  title: string
} | null

type WorkflowStep = {
  id: string
  workflowId: string
  order: number
  name: string
  description: string | null
  actorRoleId: string | null
  toolUsed: string | null
  inputType: string | null
  outputType: string | null
  timeMinutes: number | null
  isManual: boolean
  isBottleneck: boolean
  actorRole?: TeamRole
}

type PainPoint = {
  id: string
  workflowId: string | null
  stepId: string | null
  type: string
  severity: string
  description: string | null
}

type Department = {
  id: string
  name: string
} | null

type Workflow = {
  id: string
  name: string
  description: string | null
  trigger: string | null
  frequency: string | null
  status: string
  owner: string | null
  departmentId: string | null
  costOfCurrentProcess: number | null
  notes: string | null
  createdAt: string
  department: Department
  steps: WorkflowStep[]
  painPoints: PainPoint[]
}

const PAIN_POINT_TYPES = [
  { value: "bottleneck", label: "Bottleneck" },
  { value: "manual_handoff", label: "Manual Handoff" },
  { value: "error_prone", label: "Error Prone" },
  { value: "slow", label: "Slow" },
  { value: "redundant", label: "Redundant" },
  { value: "missing_tool", label: "Missing Tool" },
] as const

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export function WorkflowDetailClient({ workflow }: { workflow: Workflow }) {
  const router = useRouter()
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null)
  const [showAddPainPoint, setShowAddPainPoint] = useState(false)
  const [editingStep, setEditingStep] = useState<Partial<WorkflowStep>>({})
  const [newPainPoint, setNewPainPoint] = useState<{
    type: string
    severity: string
    description: string
  }>({ type: "bottleneck", severity: "medium", description: "" })
  const [notes, setNotes] = useState(workflow.notes ?? "")
  const [cost, setCost] = useState(
    workflow.costOfCurrentProcess != null ? String(workflow.costOfCurrentProcess) : ""
  )
  const [saving, setSaving] = useState(false)

  const steps = [...workflow.steps].sort((a, b) => a.order - b.order)

  const inputsOutputsSummary = steps
    .filter((s) => s.inputType || s.outputType)
    .map((s) => `${s.name}: ${s.inputType || "—"} → ${s.outputType || "—"}`)
    .join("; ") || "No inputs/outputs defined"

  const handleAddStep = async () => {
    setSaving(true)
    const res = await addStep(workflow.id, { name: "New Step" })
    setSaving(false)
    if (res.success) router.refresh()
  }

  const handleUpdateStep = async (stepId: string, data: UpdateStepData) => {
    setSaving(true)
    const res = await updateStep(stepId, data)
    setSaving(false)
    if (res.success) {
      setExpandedStepId(null)
      setEditingStep({})
      router.refresh()
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    setSaving(true)
    const res = await deleteStep(stepId)
    setSaving(false)
    if (res.success) {
      setExpandedStepId(null)
      router.refresh()
    }
  }

  const handleMoveStep = async (index: number, direction: "up" | "down") => {
    const newOrder = [...steps]
    const swap = direction === "up" ? index - 1 : index + 1
    if (swap < 0 || swap >= newOrder.length) return
    ;[newOrder[index], newOrder[swap]] = [newOrder[swap], newOrder[index]]
    const stepIds = newOrder.map((s) => s.id)
    setSaving(true)
    const res = await reorderSteps(workflow.id, stepIds)
    setSaving(false)
    if (res.success) router.refresh()
  }

  const handleAddPainPoint = async () => {
    if (!newPainPoint.description.trim()) return
    setSaving(true)
    const res = await addPainPoint({
      workflowId: workflow.id,
      type: newPainPoint.type,
      severity: newPainPoint.severity,
      description: newPainPoint.description.trim(),
    })
    setSaving(false)
    if (res.success) {
      setNewPainPoint({ type: "bottleneck", severity: "medium", description: "" })
      setShowAddPainPoint(false)
      router.refresh()
    }
  }

  const handleDeletePainPoint = async (id: string) => {
    setSaving(true)
    const res = await deletePainPoint(id)
    setSaving(false)
    if (res.success) router.refresh()
  }

  const handleSaveNotesAndCost = async () => {
    setSaving(true)
    const res = await updateWorkflow(workflow.id, {
      notes: notes || null,
      costOfCurrentProcess: cost ? parseFloat(cost) : null,
    })
    setSaving(false)
    if (res.success) router.refresh()
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-6">
        {/* Workflow info cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trigger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{workflow.trigger || "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{workflow.frequency || "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{workflow.owner || "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {workflow.department?.name ?? "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {formatDate(workflow.createdAt)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Steps editor */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Steps</CardTitle>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleAddStep}
              disabled={saving}
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {steps.map((step, index) => (
                <li key={step.id}>
                  <div
                    className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setExpandedStepId(expandedStepId === step.id ? null : step.id)
                      setEditingStep({
                        name: step.name,
                        description: step.description ?? "",
                        actorRoleId: step.actorRoleId,
                        toolUsed: step.toolUsed,
                        inputType: step.inputType,
                        outputType: step.outputType,
                        timeMinutes: step.timeMinutes,
                        isManual: step.isManual,
                        isBottleneck: step.isBottleneck,
                      })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setExpandedStepId(expandedStepId === step.id ? null : step.id)
                        setEditingStep({
                          name: step.name,
                          description: step.description ?? "",
                          actorRoleId: step.actorRoleId,
                          toolUsed: step.toolUsed,
                          inputType: step.inputType,
                          outputType: step.outputType,
                          timeMinutes: step.timeMinutes,
                          isManual: step.isManual,
                          isBottleneck: step.isBottleneck,
                        })
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="font-medium">{step.name}</span>
                      {(step.actorRole?.title ?? step.actorRoleId) && (
                        <span className="text-xs text-muted-foreground">
                          ({step.actorRole?.title ?? step.actorRoleId})
                        </span>
                      )}
                      {step.toolUsed && (
                        <Badge variant="outline" className="text-xs">
                          {step.toolUsed}
                        </Badge>
                      )}
                      {step.timeMinutes != null && (
                        <span className="text-xs text-muted-foreground">
                          {step.timeMinutes} min
                        </span>
                      )}
                      <Badge
                        variant={step.isManual ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {step.isManual ? "Manual" : "Auto"}
                      </Badge>
                      {step.isBottleneck && (
                        <Badge
                          variant="destructive"
                          className="text-xs"
                        >
                          Bottleneck
                        </Badge>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveStep(index, "up")
                        }}
                        disabled={index === 0 || saving}
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveStep(index, "down")
                        }}
                        disabled={index === steps.length - 1 || saving}
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedStepId === step.id && (
                    <div
                      className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <PencilIcon className="h-4 w-4" />
                        Edit Step
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Label htmlFor={`step-name-${step.id}`}>Name</Label>
                          <Input
                            id={`step-name-${step.id}`}
                            value={editingStep.name ?? ""}
                            onChange={(e) =>
                              setEditingStep((p) => ({ ...p, name: e.target.value }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor={`step-desc-${step.id}`}>
                            Description
                          </Label>
                          <Textarea
                            id={`step-desc-${step.id}`}
                            value={editingStep.description ?? ""}
                            onChange={(e) =>
                              setEditingStep((p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`step-actor-${step.id}`}>
                            Actor Role
                          </Label>
                          <Input
                            id={`step-actor-${step.id}`}
                            value={editingStep.actorRoleId ?? ""}
                            onChange={(e) =>
                              setEditingStep((p) => ({
                                ...p,
                                actorRoleId: e.target.value || null,
                              }))
                            }
                            className="mt-1"
                            placeholder="e.g. Sales Rep"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`step-tool-${step.id}`}>
                            Tool Used
                          </Label>
                          <Input
                            id={`step-tool-${step.id}`}
                            value={editingStep.toolUsed ?? ""}
                            onChange={(e) =>
                              setEditingStep((p) => ({
                                ...p,
                                toolUsed: e.target.value || null,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`step-time-${step.id}`}>
                            Time (minutes)
                          </Label>
                          <Input
                            id={`step-time-${step.id}`}
                            type="number"
                            min={0}
                            value={editingStep.timeMinutes ?? ""}
                            onChange={(e) =>
                              setEditingStep((p) => ({
                                ...p,
                                timeMinutes: e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : null,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`step-input-${step.id}`}>
                            Input Type
                          </Label>
                          <Input
                            id={`step-input-${step.id}`}
                            value={editingStep.inputType ?? ""}
                            onChange={(e) =>
                              setEditingStep((p) => ({
                                ...p,
                                inputType: e.target.value || null,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`step-output-${step.id}`}>
                            Output Type
                          </Label>
                          <Input
                            id={`step-output-${step.id}`}
                            value={editingStep.outputType ?? ""}
                            onChange={(e) =>
                              setEditingStep((p) => ({
                                ...p,
                                outputType: e.target.value || null,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center gap-4 sm:col-span-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingStep.isManual ?? true}
                              onChange={(e) =>
                                setEditingStep((p) => ({
                                  ...p,
                                  isManual: e.target.checked,
                                }))
                              }
                              className="rounded border-input"
                            />
                            <span className="text-sm">Manual</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingStep.isBottleneck ?? false}
                              onChange={(e) =>
                                setEditingStep((p) => ({
                                  ...p,
                                  isBottleneck: e.target.checked,
                                }))
                              }
                              className="rounded border-input"
                            />
                            <span className="text-sm">Bottleneck</span>
                          </label>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700"
                          onClick={() =>
                            handleUpdateStep(step.id, {
                              name: editingStep.name,
                              description: editingStep.description ?? undefined,
                              actorRoleId: editingStep.actorRoleId ?? undefined,
                              toolUsed: editingStep.toolUsed ?? undefined,
                              inputType: editingStep.inputType ?? undefined,
                              outputType: editingStep.outputType ?? undefined,
                              timeMinutes: editingStep.timeMinutes ?? undefined,
                              isManual: editingStep.isManual,
                              isBottleneck: editingStep.isBottleneck,
                            })
                          }
                          disabled={saving}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedStepId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteStep(step.id)}
                          disabled={saving}
                        >
                          <TrashIcon className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Pain Points */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pain Points</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddPainPoint(!showAddPainPoint)}
              disabled={saving}
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              Add Pain Point
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddPainPoint && (
              <div className="rounded-lg border border-dashed p-4">
                <h4 className="mb-3 text-sm font-medium">New Pain Point</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newPainPoint.type}
                      onValueChange={(v) =>
                        setNewPainPoint((p) => ({ ...p, type: v ?? p.type }))
                      }
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAIN_POINT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <Select
                      value={newPainPoint.severity}
                      onValueChange={(v) =>
                        setNewPainPoint((p) => ({ ...p, severity: v ?? p.severity }))
                      }
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITY_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newPainPoint.description}
                      onChange={(e) =>
                        setNewPainPoint((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the pain point..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleAddPainPoint}
                    disabled={saving || !newPainPoint.description.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddPainPoint(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <ul className="space-y-2">
              {workflow.painPoints.map((pp) => (
                <li
                  key={pp.id}
                  className="flex items-start justify-between gap-2 rounded-lg border p-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={
                          SEVERITY_STYLES[pp.severity] ??
                          "bg-secondary text-secondary-foreground"
                        }
                      >
                        {pp.severity}
                      </Badge>
                      <span className="text-sm font-medium capitalize">
                        {pp.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    {pp.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {pp.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDeletePainPoint(pp.id)}
                    disabled={saving}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            {workflow.painPoints.length === 0 && !showAddPainPoint && (
              <p className="text-sm text-muted-foreground">
                No pain points yet. Add one to track workflow issues.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right side info panel */}
      <aside className="w-full lg:w-80 shrink-0">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">
                Inputs / Outputs Summary
              </Label>
              <p className="mt-1 text-sm">{inputsOutputsSummary}</p>
            </div>
            <Separator />
            <div>
              <Label htmlFor="cost">Cost of Current Process</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                onBlur={handleSaveNotesAndCost}
                className="mt-1"
              />
            </div>
            <Separator />
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotesAndCost}
                placeholder="Additional notes..."
                className="mt-1"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
