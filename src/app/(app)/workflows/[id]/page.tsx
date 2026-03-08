import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { getWorkflow } from "./actions"
import { WorkflowDetailClient } from "./workflow-detail-client"
import { WorkflowActionsDropdown } from "./workflow-actions"

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ANALYZED: "Analyzed",
  APPROVED: "Approved",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  ANALYZED: "default",
  APPROVED: "outline",
}

function serializeWorkflow(workflow: Awaited<ReturnType<typeof getWorkflow>>) {
  if (!workflow) return null
  return {
    ...workflow,
    createdAt:
      workflow.createdAt instanceof Date
        ? workflow.createdAt.toISOString()
        : String(workflow.createdAt),
  }
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workflow = await getWorkflow(id)

  if (!workflow) {
    notFound()
  }

  const statusLabel = STATUS_LABELS[workflow.status] ?? workflow.status
  const statusVariant = STATUS_VARIANTS[workflow.status] ?? "secondary"
  const serialized = serializeWorkflow(workflow)

  return (
    <>
      <PageHeader
        title={workflow.name}
        description={workflow.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <WorkflowActionsDropdown workflowId={id} statusVariant={statusVariant} statusLabel={statusLabel} />
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
        }
      />
      <div className="flex-1 p-6">
        {serialized && <WorkflowDetailClient workflow={serialized} />}
      </div>
    </>
  )
}
