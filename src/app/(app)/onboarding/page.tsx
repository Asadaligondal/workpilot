"use client"

import { useState, useTransition } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveOnboardingData, type OnboardingData } from "./actions"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  "Company Info",
  "Growth Stage",
  "Departments",
  "Current Tools",
  "Pain Points",
  "Goals",
  "Upload Documents",
  "Audit Mode",
]

const INDUSTRIES = [
  { value: "agency", label: "Agency" },
  { value: "clinic", label: "Clinic" },
  { value: "contractor", label: "Contractor" },
  { value: "legal-accounting", label: "Legal / Accounting" },
  { value: "ecommerce", label: "Ecommerce" },
  { value: "other", label: "Other" },
]

const TEAM_SIZES = [
  { value: "1-5", label: "1-5" },
  { value: "6-15", label: "6-15" },
  { value: "16-50", label: "16-50" },
  { value: "51-200", label: "51-200" },
  { value: "200+", label: "200+" },
]

const GROWTH_STAGES = [
  { value: "startup", label: "Startup" },
  { value: "growing", label: "Growing" },
  { value: "established", label: "Established" },
  { value: "scaling", label: "Scaling" },
]

const DEPARTMENTS = [
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "HR",
  "Support",
  "IT",
  "Legal",
  "Fulfillment",
]

const TOOL_CATEGORIES = [
  "CRM",
  "PM",
  "Accounting",
  "Communication",
  "Marketing",
  "Analytics",
  "Storage",
  "Other",
]

const PAIN_POINTS = [
  "Manual data entry",
  "Too many tools",
  "Slow processes",
  "Error-prone tasks",
  "Inconsistent workflows",
  "Poor communication",
  "Reporting bottlenecks",
  "Scheduling conflicts",
  "Document management",
  "Customer follow-up",
]

const GOALS = [
  "Reduce costs",
  "Save time",
  "Reduce errors",
  "Scale without hiring",
  "Improve customer experience",
  "Better reporting",
  "Streamline operations",
  "Automate repetitive tasks",
]

const AUDIT_MODES = [
  { value: "quick", label: "Quick Scan - Fast overview of automation opportunities" },
  { value: "deep", label: "Deep Audit - Comprehensive analysis of all workflows" },
]

const initialData: OnboardingData = {
  companyName: "",
  website: "",
  industry: "",
  subIndustry: "",
  teamSize: "",
  locations: "",
  growthStage: "",
  departments: [],
  tools: [],
  painPoints: [],
  painPointsAdditional: "",
  goals: [],
  auditMode: "quick",
}

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(initialData)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  function updateData(partial: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  function handleComplete() {
    startTransition(() => {
      saveOnboardingData(data).catch(console.error)
    })
  }

  function addTool() {
    setData((prev) => ({
      ...prev,
      tools: [...prev.tools, { name: "", category: "" }],
    }))
  }

  function removeTool(index: number) {
    setData((prev) => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index),
    }))
  }

  function updateTool(index: number, field: "name" | "category", value: string) {
    setData((prev) => ({
      ...prev,
      tools: prev.tools.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      ),
    }))
  }

  function toggleDepartment(dept: string) {
    setData((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept],
    }))
  }

  function togglePainPoint(point: string) {
    setData((prev) => ({
      ...prev,
      painPoints: prev.painPoints.includes(point)
        ? prev.painPoints.filter((p) => p !== point)
        : [...prev.painPoints, point],
    }))
  }

  function toggleGoal(goal: string) {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }))
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    setUploadedFiles((prev) => [...prev, ...files.map((f) => f.name)])
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : []
    setUploadedFiles((prev) => [...prev, ...files.map((f) => f.name)])
  }

  function removeFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <>
      <PageHeader
        title="Welcome to WorkPilot"
        description="Let's set up your workspace in a few steps"
      />
      <div className="flex-1 p-6">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  step === i + 1
                    ? "bg-indigo-600 text-white"
                    : step > i + 1
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "bg-muted text-muted-foreground"
                )}
              >
                <span className="size-5 flex items-center justify-center rounded-full bg-white/20 text-xs">
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{STEPS[step - 1]}</CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about your company"}
              {step === 2 && "What stage is your business at?"}
              {step === 3 && "Which departments do you have?"}
              {step === 4 && "What tools does your team use?"}
              {step === 5 && "What are your biggest challenges?"}
              {step === 6 && "What do you want to achieve?"}
              {step === 7 && "Upload SOPs, screenshots, or spreadsheets (optional)"}
              {step === 8 && "How deep should we analyze?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Company Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Company Name</Label>
                  <Input
                    value={data.companyName}
                    onChange={(e) => updateData({ companyName: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Website</Label>
                  <Input
                    value={data.website}
                    onChange={(e) => updateData({ website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Industry</Label>
                  <Select
                    value={data.industry}
                    onValueChange={(v) => updateData({ industry: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => (
                        <SelectItem key={i.value} value={i.value}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Sub-industry</Label>
                  <Input
                    value={data.subIndustry}
                    onChange={(e) => updateData({ subIndustry: e.target.value })}
                    placeholder="e.g. Dental, Plumbing, Law Firm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Team Size</Label>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_SIZES.map((t) => (
                      <label
                        key={t.value}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                          data.teamSize === t.value
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                            : "border-input hover:bg-muted"
                        )}
                      >
                        <input
                          type="radio"
                          name="teamSize"
                          value={t.value}
                          checked={data.teamSize === t.value}
                          onChange={() => updateData({ teamSize: t.value })}
                          className="sr-only"
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Locations</Label>
                  <Input
                    value={data.locations}
                    onChange={(e) => updateData({ locations: e.target.value })}
                    placeholder="e.g. New York, London, Remote"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Growth Stage */}
            {step === 2 && (
              <div className="space-y-2">
                <Label>Growth Stage</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {GROWTH_STAGES.map((g) => (
                    <label
                      key={g.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border p-4 text-sm transition-colors",
                        data.growthStage === g.value
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                          : "border-input hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name="growthStage"
                        value={g.value}
                        checked={data.growthStage === g.value}
                        onChange={() => updateData({ growthStage: g.value })}
                        className="sr-only"
                      />
                      {g.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Departments */}
            {step === 3 && (
              <div className="space-y-2">
                <Label>Departments</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {DEPARTMENTS.map((dept) => (
                    <label
                      key={dept}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={data.departments.includes(dept)}
                        onCheckedChange={() => toggleDepartment(dept)}
                      />
                      <span className="text-sm">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Current Tools */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Current Tools</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTool}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    Add Tool
                  </Button>
                </div>
                <div className="space-y-3">
                  {data.tools.map((tool, i) => (
                    <div
                      key={i}
                      className="flex gap-2 rounded-lg border p-3"
                    >
                      <Input
                        placeholder="Tool name"
                        value={tool.name}
                        onChange={(e) =>
                          updateTool(i, "name", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Select
                        value={tool.category}
                        onValueChange={(v) => updateTool(i, "category", v)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {TOOL_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTool(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {data.tools.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No tools added yet. Click &quot;Add Tool&quot; to get started.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Pain Points */}
            {step === 5 && (
              <div className="space-y-4">
                <Label>Biggest Pain Points</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAIN_POINTS.map((point) => (
                    <label
                      key={point}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={data.painPoints.includes(point)}
                        onCheckedChange={() => togglePainPoint(point)}
                      />
                      <span className="text-sm">{point}</span>
                    </label>
                  ))}
                </div>
                <div className="grid gap-2">
                  <Label>Additional pain points (optional)</Label>
                  <Textarea
                    value={data.painPointsAdditional}
                    onChange={(e) =>
                      updateData({ painPointsAdditional: e.target.value })
                    }
                    placeholder="Describe any other challenges..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 6: Goals */}
            {step === 6 && (
              <div className="space-y-2">
                <Label>Goals</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {GOALS.map((goal) => (
                    <label
                      key={goal}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={data.goals.includes(goal)}
                        onCheckedChange={() => toggleGoal(goal)}
                      />
                      <span className="text-sm">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Upload Documents */}
            {step === 7 && (
              <div className="space-y-4">
                <div
                  role="button"
                  tabIndex={0}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 py-12 px-6 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
                >
                  <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    SOPs, screenshots, spreadsheets
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-hidden
                  />
                  <span className="mt-4 inline-flex cursor-pointer rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                    Browse Files
                  </span>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded files (MVP: stored locally only)</Label>
                    <ul className="space-y-1 rounded-lg border p-3">
                      {uploadedFiles.map((name, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="truncate">{name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFile(i)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Step 8: Audit Mode */}
            {step === 8 && (
              <div className="space-y-2">
                <Label>Audit Mode</Label>
                <div className="grid gap-2">
                  {AUDIT_MODES.map((m) => (
                    <label
                      key={m.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-lg border p-4 text-sm transition-colors",
                        data.auditMode === m.value
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                          : "border-input hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name="auditMode"
                        value={m.value}
                        checked={data.auditMode === m.value}
                        onChange={() => updateData({ auditMode: m.value })}
                        className="mt-0.5"
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-4 border-t pt-6">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <ChevronLeftIcon className="mr-1 h-4 w-4" />
              Previous
            </Button>
            {step < 8 ? (
              <Button
                onClick={() => setStep((s) => Math.min(8, s + 1))}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Next
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isPending ? "Saving..." : "Complete Setup"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
