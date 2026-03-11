import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { getWorkflow } from "./actions"
import { WorkflowDetailClient } from "./workflow-detail-client"
import { WorkflowActionsDropdown } from "./workflow-actions"
import { getActiveWorkspaceId } from "@/lib/workspace"

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

function serializeWorkflow(workflow: any) {
  if (!workflow) return null
  return {
    ...workflow,
    createdAt:
      workflow.createdAt instanceof Date
        ? workflow.createdAt.toISOString()
        : workflow.createdAt?.toDate?.()?.toISOString?.() || String(workflow.createdAt ?? ""),
  }
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workspaceId = await getActiveWorkspaceId()
  const workflow = await getWorkflow(id) as any

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
          <WorkflowActionsDropdown
            workflowId={id}
            workspaceId={workspaceId ?? ""}
            statusVariant={statusVariant}
            statusLabel={statusLabel}
          />
        }
      />
      <div className="flex-1 p-6">
        {serialized && <WorkflowDetailClient workflow={serialized} />}
      </div>
    </>
  )
}
