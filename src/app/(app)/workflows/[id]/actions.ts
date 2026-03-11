"use server"

import { requireUser } from "@/lib/auth"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"
import type { WorkflowStatus } from "@/types"
import { findFirst, findMany, findUnique, where, create, update, deleteRecord, orderBy, toPlain } from "@/lib/firestore-helpers"

async function getWorkspaceContext() {
  const user = await requireUser()
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) throw new Error("No active workspace")

  const member = await findFirst("workspaceMembers", [
    where("workspaceId", "==", workspaceId),
    where("userId", "==", user.id),
  ])
  if (!member) throw new Error("Insufficient permissions")

  return workspaceId
}

async function verifyWorkflowOwnership(workflowId: string) {
  const workspaceId = await getWorkspaceContext()
  const workflow = await findUnique("workflows", workflowId)
  if (!workflow || workflow.workspaceId !== workspaceId) return null
  return workflow
}

export async function getWorkflow(id: string) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return null

    const workflow = await findUnique("workflows", id)
    if (!workflow || workflow.workspaceId !== workspaceId) return null

    // Get steps with actor roles
    const steps = await findMany("workflowSteps", [
      where("workflowId", "==", id),
    ])
    const sortedSteps = steps.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))

    const stepsWithRoles = await Promise.all(
      sortedSteps.map(async (step: any) => {
        const actorRole = step.actorRoleId
          ? await findUnique("teamRoles", step.actorRoleId)
          : null
        return { ...step, actorRole }
      })
    )

    // Get pain points
    const painPoints = await findMany("painPoints", [where("workflowId", "==", id)])

    // Get department
    const department = workflow.departmentId
      ? await findUnique("departments", workflow.departmentId)
      : null

    return toPlain({
      ...workflow,
      steps: stepsWithRoles,
      painPoints,
      department,
    })
  } catch (err) {
    console.error("getWorkflow:", err)
    return null
  }
}

export type UpdateWorkflowData = {
  name?: string
  description?: string
  trigger?: string
  frequency?: string
  owner?: string
  departmentId?: string | null
  costOfCurrentProcess?: number | null
  notes?: string | null
}

export async function updateWorkflow(id: string, data: UpdateWorkflowData) {
  try {
    const workflow = await verifyWorkflowOwnership(id)
    if (!workflow) return { success: false, error: "Workflow not found" }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.trigger !== undefined) updateData.trigger = data.trigger
    if (data.frequency !== undefined) updateData.frequency = data.frequency
    if (data.owner !== undefined) updateData.owner = data.owner
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId
    if (data.costOfCurrentProcess !== undefined) updateData.costOfCurrentProcess = data.costOfCurrentProcess
    if (data.notes !== undefined) updateData.notes = data.notes

    await update("workflows", id, updateData)

    revalidatePath(`/workflows/${id}`)
    return { success: true }
  } catch (err) {
    console.error("updateWorkflow:", err)
    return { success: false, error: String(err) }
  }
}

export type AddStepInput = {
  name: string
  description?: string
  actorRoleId?: string | null
  toolUsed?: string | null
  inputType?: string | null
  outputType?: string | null
  timeMinutes?: number | null
  isManual?: boolean
  isBottleneck?: boolean
}

export async function addStep(workflowId: string, step: AddStepInput) {
  try {
    const workflow = await verifyWorkflowOwnership(workflowId)
    if (!workflow) return { success: false, error: "Workflow not found" }

    // Get max order
    const steps = await findMany("workflowSteps", [where("workflowId", "==", workflowId)])
    const maxOrder = steps.length > 0
      ? Math.max(...steps.map((s: any) => s.order ?? 0))
      : -1
    const nextOrder = maxOrder + 1

    await create("workflowSteps", {
      workflowId,
      order: nextOrder,
      name: step.name,
      description: step.description ?? null,
      actorRoleId: step.actorRoleId ?? null,
      toolUsed: step.toolUsed ?? null,
      inputType: step.inputType ?? null,
      outputType: step.outputType ?? null,
      timeMinutes: step.timeMinutes ?? null,
      isManual: step.isManual ?? true,
      isBottleneck: step.isBottleneck ?? false,
    })

    revalidatePath(`/workflows/${workflowId}`)
    return { success: true }
  } catch (err) {
    console.error("addStep:", err)
    return { success: false, error: String(err) }
  }
}

export type UpdateStepData = {
  name?: string
  description?: string
  actorRoleId?: string | null
  toolUsed?: string | null
  inputType?: string | null
  outputType?: string | null
  timeMinutes?: number | null
  isManual?: boolean
  isBottleneck?: boolean
}

export async function updateStep(stepId: string, data: UpdateStepData) {
  try {
    const step = await findUnique("workflowSteps", stepId)
    if (!step) return { success: false, error: "Step not found" }

    const workflow = await verifyWorkflowOwnership(step.workflowId)
    if (!workflow) return { success: false, error: "Workflow not found" }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.actorRoleId !== undefined) updateData.actorRoleId = data.actorRoleId
    if (data.toolUsed !== undefined) updateData.toolUsed = data.toolUsed
    if (data.inputType !== undefined) updateData.inputType = data.inputType
    if (data.outputType !== undefined) updateData.outputType = data.outputType
    if (data.timeMinutes !== undefined) updateData.timeMinutes = data.timeMinutes
    if (data.isManual !== undefined) updateData.isManual = data.isManual
    if (data.isBottleneck !== undefined) updateData.isBottleneck = data.isBottleneck

    await update("workflowSteps", stepId, updateData)

    revalidatePath(`/workflows/${step.workflowId}`)
    return { success: true }
  } catch (err) {
    console.error("updateStep:", err)
    return { success: false, error: String(err) }
  }
}

export async function deleteStep(stepId: string) {
  try {
    const step = await findUnique("workflowSteps", stepId)
    if (!step) return { success: false, error: "Step not found" }

    const workflow = await verifyWorkflowOwnership(step.workflowId)
    if (!workflow) return { success: false, error: "Workflow not found" }

    await deleteRecord("workflowSteps", stepId)

    // Reorder remaining steps
    const remaining = await findMany("workflowSteps", [
      where("workflowId", "==", step.workflowId),
      orderBy("order", "asc"),
    ])
    for (let i = 0; i < remaining.length; i++) {
      await update("workflowSteps", remaining[i].id, { order: i })
    }

    revalidatePath(`/workflows/${step.workflowId}`)
    return { success: true }
  } catch (err) {
    console.error("deleteStep:", err)
    return { success: false, error: String(err) }
  }
}

export async function reorderSteps(workflowId: string, stepIds: string[]) {
  try {
    const workflow = await verifyWorkflowOwnership(workflowId)
    if (!workflow) return { success: false, error: "Workflow not found" }

    for (let i = 0; i < stepIds.length; i++) {
      await update("workflowSteps", stepIds[i], { order: i })
    }

    revalidatePath(`/workflows/${workflowId}`)
    return { success: true }
  } catch (err) {
    console.error("reorderSteps:", err)
    return { success: false, error: String(err) }
  }
}

export type AddPainPointInput = {
  workflowId: string
  stepId?: string | null
  type: string
  severity: string
  description?: string | null
}

export async function addPainPoint(data: AddPainPointInput) {
  try {
    const workflow = await verifyWorkflowOwnership(data.workflowId)
    if (!workflow) return { success: false, error: "Workflow not found" }

    await create("painPoints", {
      workflowId: data.workflowId,
      stepId: data.stepId ?? null,
      type: data.type,
      severity: data.severity,
      description: data.description ?? null,
    })

    revalidatePath(`/workflows/${data.workflowId}`)
    return { success: true }
  } catch (err) {
    console.error("addPainPoint:", err)
    return { success: false, error: String(err) }
  }
}

export async function deletePainPoint(id: string) {
  try {
    const painPoint = await findUnique("painPoints", id)
    if (!painPoint) return { success: false, error: "Pain point not found" }

    const workflow = await verifyWorkflowOwnership(painPoint.workflowId)
    if (!workflow) return { success: false, error: "Workflow not found" }

    await deleteRecord("painPoints", id)

    revalidatePath(`/workflows/${painPoint.workflowId}`)
    return { success: true }
  } catch (err) {
    console.error("deletePainPoint:", err)
    return { success: false, error: String(err) }
  }
}

export async function updateWorkflowStatus(id: string, status: WorkflowStatus) {
  try {
    const workflow = await verifyWorkflowOwnership(id)
    if (!workflow) return { success: false, error: "Workflow not found" }

    await update("workflows", id, { status })

    revalidatePath(`/workflows/${id}`)
    return { success: true }
  } catch (err) {
    console.error("updateWorkflowStatus:", err)
    return { success: false, error: String(err) }
  }
}
