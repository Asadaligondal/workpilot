"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { WorkflowStatus } from "@prisma/client"

type WorkflowWithMeta = {
  id: string
  name: string
  description: string | null
  status: WorkflowStatus
  automationPotentialScore: number | null
  owner: string | null
  department: { id: string; name: string } | null
  _count: { steps: number }
}

export function WorkflowsTable({ workflows }: { workflows: WorkflowWithMeta[] }) {
  const router = useRouter()
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const departments = useMemo(() => {
    const set = new Set<string>()
    workflows.forEach((w) => {
      if (w.department?.name) set.add(w.department.name)
    })
    return Array.from(set).sort()
  }, [workflows])

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      if (departmentFilter !== "all" && w.department?.name !== departmentFilter)
        return false
      if (statusFilter !== "all" && w.status !== statusFilter) return false
      return true
    })
  }, [workflows, departmentFilter, statusFilter])

  const statusBadgeVariant = (status: WorkflowStatus) => {
    switch (status) {
      case "DRAFT":
        return "secondary"
      case "ANALYZED":
        return "default"
      case "APPROVED":
        return "outline"
      default:
        return "secondary"
    }
  }

  const statusLabel = (status: WorkflowStatus) => {
    switch (status) {
      case "DRAFT":
        return "Draft"
      case "ANALYZED":
        return "Analyzed"
      case "APPROVED":
        return "Approved"
      default:
        return status
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select
          value={departmentFilter}
          onValueChange={setDepartmentFilter}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ANALYZED">Analyzed</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Steps</TableHead>
            <TableHead>Automation Score</TableHead>
            <TableHead>Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((w) => (
            <TableRow
              key={w.id}
              className="cursor-pointer"
              onClick={() => router.push(`/workflows/${w.id}`)}
            >
              <TableCell className="font-medium">{w.name}</TableCell>
              <TableCell>{w.department?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(w.status)}>
                  {statusLabel(w.status)}
                </Badge>
              </TableCell>
              <TableCell>{w._count.steps}</TableCell>
              <TableCell>
                {w.automationPotentialScore != null
                  ? `${Math.round(w.automationPotentialScore)}%`
                  : "—"}
              </TableCell>
              <TableCell>{w.owner ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
