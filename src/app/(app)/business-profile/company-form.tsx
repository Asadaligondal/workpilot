"use client"

import { useTransition, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveCompanyDetails } from "./actions"

const industries = [
  { value: "agency", label: "Agency / Consultancy" },
  { value: "clinic", label: "Clinic / Service Provider" },
  { value: "contractor", label: "Contractor / Local Business" },
  { value: "legal-accounting", label: "Legal / Accounting" },
  { value: "ecommerce", label: "Ecommerce Operations" },
  { value: "technology", label: "Technology / SaaS" },
  { value: "healthcare", label: "Healthcare" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
]

const teamSizes = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "500+", label: "500+" },
]

const growthStages = [
  { value: "startup", label: "Startup" },
  { value: "growth", label: "Growth" },
  { value: "scale", label: "Scale" },
  { value: "mature", label: "Mature" },
]

type CompanyFormProps = {
  initialData?: {
    companyName: string
    website: string
    industry: string
    subIndustry: string
    teamSize: string
    growthStage: string
    operatingHours: string
    locations: string
  }
}

export function CompanyForm({ initialData }: CompanyFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    companyName: initialData?.companyName ?? "",
    website: initialData?.website ?? "",
    industry: initialData?.industry ?? "",
    subIndustry: initialData?.subIndustry ?? "",
    teamSize: initialData?.teamSize ?? "",
    growthStage: initialData?.growthStage ?? "",
    operatingHours: initialData?.operatingHours ?? "",
    locations: initialData?.locations ?? "",
  })

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveCompanyDetails(form)
      if (!result.success) {
        setError(result.error ?? "Failed to save")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            placeholder="Acme Inc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={form.industry || undefined}
            onValueChange={(v) => setForm((f) => ({ ...f, industry: v }))}
          >
            <SelectTrigger id="industry" className="w-full">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subIndustry">Sub-Industry</Label>
          <Input
            id="subIndustry"
            value={form.subIndustry}
            onChange={(e) => setForm((f) => ({ ...f, subIndustry: e.target.value }))}
            placeholder="e.g. Digital Marketing"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="teamSize">Team Size</Label>
          <Select
            value={form.teamSize || undefined}
            onValueChange={(v) => setForm((f) => ({ ...f, teamSize: v }))}
          >
            <SelectTrigger id="teamSize" className="w-full">
              <SelectValue placeholder="Select team size" />
            </SelectTrigger>
            <SelectContent>
              {teamSizes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="growthStage">Growth Stage</Label>
          <Select
            value={form.growthStage || undefined}
            onValueChange={(v) => setForm((f) => ({ ...f, growthStage: v }))}
          >
            <SelectTrigger id="growthStage" className="w-full">
              <SelectValue placeholder="Select growth stage" />
            </SelectTrigger>
            <SelectContent>
              {growthStages.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="operatingHours">Operating Hours</Label>
        <Input
          id="operatingHours"
          value={form.operatingHours}
          onChange={(e) => setForm((f) => ({ ...f, operatingHours: e.target.value }))}
          placeholder="e.g. Mon-Fri 9am-5pm EST"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="locations">Locations</Label>
        <Input
          id="locations"
          value={form.locations}
          onChange={(e) => setForm((f) => ({ ...f, locations: e.target.value }))}
          placeholder="e.g. NYC, London, Remote"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        onClick={handleSave}
        disabled={isPending}
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
