"use client"

import { useTransition } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateOpportunityStatus } from "../actions"
import type { OpportunityStatus } from "@prisma/client"

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  NEW: "New",
  REVIEWED: "Reviewed",
  APPROVED: "Approved",
  DISMISSED: "Dismissed",
}

export function OpportunityDetailClient({
  opportunityId,
  currentStatus,
}: {
  opportunityId: string
  currentStatus: OpportunityStatus
}) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (value: string) => {
    startTransition(async () => {
      await updateOpportunityStatus(opportunityId, value as OpportunityStatus)
    })
  }

  return (
    <Select
      value={currentStatus}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="mt-1 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(STATUS_LABELS) as OpportunityStatus[]).map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
