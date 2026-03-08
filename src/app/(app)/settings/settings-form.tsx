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
import { updateWorkspace } from "../actions"

const industries = [
  { value: "agency", label: "Agency / Consultancy" },
  { value: "clinic", label: "Clinic / Service Provider" },
  { value: "contractor", label: "Contractor / Local Business" },
  { value: "legal-accounting", label: "Legal / Accounting" },
  { value: "ecommerce", label: "Ecommerce Operations" },
  { value: "other", label: "Other" },
]

export function SettingsForm({
  name,
  industry,
}: {
  name: string
  industry: string
}) {
  const [isPending, startTransition] = useTransition()
  const [formName, setFormName] = useState(name)
  const [formIndustry, setFormIndustry] = useState(industry)

  function handleSave() {
    startTransition(() =>
      updateWorkspace({ name: formName, industry: formIndustry })
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Workspace Name</Label>
        <Input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label>Industry</Label>
        <Select value={formIndustry} onValueChange={setFormIndustry}>
          <SelectTrigger className="w-64">
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
