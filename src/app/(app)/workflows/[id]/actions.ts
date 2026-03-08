"use server"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"
import type { WorkflowStatus } from "@prisma/client"

async function getWorkspaceContext() {
  const user = await requireUser()
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) throw new Error("No active workspace")

  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: user.id,
      role: { in: ["OWNER", "ADMIN", "MEMBER"] },
    },
  })
  if (!member) throw new Error("Insufficient permissions")

  return workspaceId
}

async function verifyWorkflowOwnership(workflowId: string) {
  const workspaceId = await getWorkspaceContext()
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, workspaceId },
  })
  if (!workflow) return null
  return workflow
}

export async function getWorkflow(id: string) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return null

    const workflow = await prisma.workflow.findFirst({
      where: { id, workspaceId },
      include: {
        steps: {
          orderBy: { order: "asc" },
          include: { actorRole: true },
        },
        painPoints: true,
        department: true,
      },
    })
    return workflow
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

    await prisma.workflow.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.trigger !== undefined && { trigger: data.trigger }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        ...(data.owner !== undefined && { owner: data.owner }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.costOfCurrentProcess !== undefined && {
          costOfCurrentProcess: data.costOfCurrentProcess,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    })

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

    const maxOrder = await prisma.workflowStep.aggregate({
      where: { workflowId },
      _max: { order: true },
    })
    const nextOrder = (maxOrder._max.order ?? -1) + 1

    await prisma.workflowStep.create({
      data: {
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
      },
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
    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId },
      select: { workflowId: true },
    })
    if (!step) return { success: false, error: "Step not found" }

    const workflow = await verifyWorkflowOwnership(step.workflowId)
    if (!workflow) return { success: false, error: "Workflow not found" }

    await prisma.workflowStep.update({
      where: { id: stepId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.actorRoleId !== undefined && { actorRoleId: data.actorRoleId }),
        ...(data.toolUsed !== undefined && { toolUsed: data.toolUsed }),
        ...(data.inputType !== undefined && { inputType: data.inputType }),
        ...(data.outputType !== undefined && { outputType: data.outputType }),
        ...(data.timeMinutes !== undefined && { timeMinutes: data.timeMinutes }),
        ...(data.isManual !== undefined && { isManual: data.isManual }),
        ...(data.isBottleneck !== undefined && { isBottleneck: data.isBottleneck }),
      },
    })

    revalidatePath(`/workflows/${step.workflowId}`)
    return { success: true }
  } catch (err) {
    console.error("updateStep:", err)
    return { success: false, error: String(err) }
  }
}

export async function deleteStep(stepId: string) {
  try {
    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId },
      select: { workflowId: true, order: true },
    })
    if (!step) return { success: false, error: "Step not found" }

    const workflow = await verifyWorkflowOwnership(step.workflowId)
    if (!workflow) return { success: false, error: "Workflow not found" }

    await prisma.workflowStep.delete({ where: { id: stepId } })

    const remaining = await prisma.workflowStep.findMany({
      where: { workflowId: step.workflowId },
      orderBy: { order: "asc" },
    })
    for (let i = 0; i < remaining.length; i++) {
      await prisma.workflowStep.update({
        where: { id: remaining[i].id },
        data: { order: i },
      })
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
      await prisma.workflowStep.update({
        where: { id: stepIds[i] },
        data: { order: i },
      })
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

    await prisma.painPoint.create({
      data: {
        workflowId: data.workflowId,
        stepId: data.stepId ?? null,
        type: data.type,
        severity: data.severity,
        description: data.description ?? null,
      },
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
    const painPoint = await prisma.painPoint.findUnique({
      where: { id },
      select: { workflowId: true },
    })
    if (!painPoint) return { success: false, error: "Pain point not found" }

    const workflow = await verifyWorkflowOwnership(painPoint.workflowId!)
    if (!workflow) return { success: false, error: "Workflow not found" }

    await prisma.painPoint.delete({ where: { id } })

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

    await prisma.workflow.update({
      where: { id },
      data: { status },
    })

    revalidatePath(`/workflows/${id}`)
    return { success: true }
  } catch (err) {
    console.error("updateWorkflowStatus:", err)
    return { success: false, error: String(err) }
  }
}
