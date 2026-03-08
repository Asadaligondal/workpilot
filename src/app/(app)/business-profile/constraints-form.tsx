"use client"

import { useTransition, useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { saveConstraints } from "./actions"

type ConstraintsFormProps = {
  initialData?: {
    complianceNotes: string
    budgetConstraints: string
    timelineConstraints: string
    technicalLimitations: string
  }
}

export function ConstraintsForm({ initialData }: ConstraintsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    complianceNotes: initialData?.complianceNotes ?? "",
    budgetConstraints: initialData?.budgetConstraints ?? "",
    timelineConstraints: initialData?.timelineConstraints ?? "",
    technicalLimitations: initialData?.technicalLimitations ?? "",
  })

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveConstraints(form)
      if (!result.success) {
        setError(result.error ?? "Failed to save")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="complianceNotes">Compliance Notes</Label>
        <Textarea
          id="complianceNotes"
          value={form.complianceNotes}
          onChange={(e) =>
            setForm((f) => ({ ...f, complianceNotes: e.target.value }))
          }
          placeholder="e.g. GDPR, HIPAA, SOC2 requirements..."
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="budgetConstraints">Budget Constraints</Label>
        <Textarea
          id="budgetConstraints"
          value={form.budgetConstraints}
          onChange={(e) =>
            setForm((f) => ({ ...f, budgetConstraints: e.target.value }))
          }
          placeholder="e.g. Limited budget for new tools, annual cap..."
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timelineConstraints">Timeline Constraints</Label>
        <Textarea
          id="timelineConstraints"
          value={form.timelineConstraints}
          onChange={(e) =>
            setForm((f) => ({ ...f, timelineConstraints: e.target.value }))
          }
          placeholder="e.g. Must launch by Q2, phased rollout..."
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="technicalLimitations">Technical Limitations</Label>
        <Textarea
          id="technicalLimitations"
          value={form.technicalLimitations}
          onChange={(e) =>
            setForm((f) => ({ ...f, technicalLimitations: e.target.value }))
          }
          placeholder="e.g. Legacy systems, integration requirements..."
          rows={3}
          className="resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

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
