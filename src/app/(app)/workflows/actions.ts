"use server"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { logAudit } from "@/lib/audit"
import { revalidatePath } from "next/cache"

export type CreateWorkflowStepInput = {
  name: string
  description?: string
  actorRole?: string
  toolUsed?: string
  timeMinutes?: number
  isManual?: boolean
  painPoints?: string
}

export type CreateWorkflowInput = {
  name: string
  departmentId?: string | null
  description?: string
  trigger?: string
  frequency?: string
  owner?: string
  steps: CreateWorkflowStepInput[]
}

export async function createWorkflow(data: CreateWorkflowInput) {
  try {
    const user = await requireUser()
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        role: { in: ["OWNER", "ADMIN", "MEMBER"] },
      },
    })
    if (!member) return { success: false, error: "Insufficient permissions" }

    const workflow = await prisma.workflow.create({
      data: {
        workspaceId,
        departmentId: data.departmentId ?? null,
        name: data.name,
        description: data.description ?? null,
        trigger: data.trigger ?? null,
        frequency: data.frequency ?? null,
        owner: data.owner ?? null,
      },
    })

    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i]
      let actorRoleId: string | null = null

      if (step.actorRole?.trim() && data.departmentId) {
        const existing = await prisma.teamRole.findFirst({
          where: {
            departmentId: data.departmentId,
            title: step.actorRole.trim(),
          },
        })
        if (existing) {
          actorRoleId = existing.id
        } else {
          const created = await prisma.teamRole.create({
            data: {
              departmentId: data.departmentId,
              title: step.actorRole.trim(),
            },
          })
          actorRoleId = created.id
        }
      }

      const createdStep = await prisma.workflowStep.create({
        data: {
          workflowId: workflow.id,
          order: i,
          name: step.name,
          description: step.description ?? null,
          actorRoleId,
          toolUsed: step.toolUsed ?? null,
          timeMinutes: step.timeMinutes ?? null,
          isManual: step.isManual ?? true,
        },
      })

      if (step.painPoints?.trim()) {
        await prisma.painPoint.create({
          data: {
            workflowId: workflow.id,
            stepId: createdStep.id,
            type: "general",
            severity: "medium",
            description: step.painPoints.trim(),
          },
        })
      }
    }

    await logAudit({
      workspaceId,
      userId: user.id,
      action: "workflow.created",
      entity: "Workflow",
      entityId: workflow.id,
      details: { name: workflow.name },
    })
    revalidatePath("/workflows")
    return { success: true, id: workflow.id }
  } catch (err) {
    console.error("createWorkflow:", err)
    return { success: false, error: String(err) }
  }
}

export async function deleteWorkflow(id: string) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }

    const user = await requireUser()
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        role: { in: ["OWNER", "ADMIN", "MEMBER"] },
      },
    })
    if (!member) return { success: false, error: "Insufficient permissions" }

    const workflow = await prisma.workflow.findFirst({
      where: { id, workspaceId },
    })
    if (!workflow) return { success: false, error: "Workflow not found" }

    await prisma.workflow.delete({ where: { id } })

    revalidatePath("/workflows")
    return { success: true }
  } catch (err) {
    console.error("deleteWorkflow:", err)
    return { success: false, error: String(err) }
  }
}

export async function getDepartments() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return []

    const departments = await prisma.department.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
    })
    return departments
  } catch (err) {
    console.error("getDepartments:", err)
    return []
  }
}

export async function getWorkflows() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return []

    const workflows = await prisma.workflow.findMany({
      where: { workspaceId },
      include: {
        department: true,
        _count: { select: { steps: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return workflows
  } catch (err) {
    console.error("getWorkflows:", err)
    return []
  }
}
