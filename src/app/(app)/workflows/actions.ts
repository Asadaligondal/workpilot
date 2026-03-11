"use server"

import { requireUser } from "@/lib/auth"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { logAudit } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { findFirst, findMany, findUnique, where, create, deleteRecord, orderBy } from "@/lib/firestore-helpers"

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

    const member = await findFirst("workspaceMembers", [
      where("workspaceId", "==", workspaceId),
      where("userId", "==", user.id),
    ])
    if (!member) return { success: false, error: "Insufficient permissions" }

    const workflow = await create("workflows", {
      workspaceId,
      departmentId: data.departmentId ?? null,
      name: data.name,
      description: data.description ?? null,
      trigger: data.trigger ?? null,
      frequency: data.frequency ?? null,
      owner: data.owner ?? null,
      status: "DRAFT",
    })

    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i]
      let actorRoleId: string | null = null

      if (step.actorRole?.trim() && data.departmentId) {
        const existing = await findFirst("teamRoles", [
          where("departmentId", "==", data.departmentId),
          where("title", "==", step.actorRole.trim()),
        ])
        if (existing) {
          actorRoleId = existing.id
        } else {
          const created = await create("teamRoles", {
            departmentId: data.departmentId,
            title: step.actorRole.trim(),
          })
          actorRoleId = created.id
        }
      }

      const createdStep = await create("workflowSteps", {
        workflowId: workflow.id,
        order: i,
        name: step.name,
        description: step.description ?? null,
        actorRoleId,
        toolUsed: step.toolUsed ?? null,
        timeMinutes: step.timeMinutes ?? null,
        isManual: step.isManual ?? true,
      })

      if (step.painPoints?.trim()) {
        await create("painPoints", {
          workflowId: workflow.id,
          stepId: createdStep.id,
          type: "general",
          severity: "medium",
          description: step.painPoints.trim(),
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
    const member = await findFirst("workspaceMembers", [
      where("workspaceId", "==", workspaceId),
      where("userId", "==", user.id),
    ])
    if (!member) return { success: false, error: "Insufficient permissions" }

    const workflow = await findUnique("workflows", id)
    if (!workflow || workflow.workspaceId !== workspaceId)
      return { success: false, error: "Workflow not found" }

    // Delete all steps and pain points first
    const steps = await findMany("workflowSteps", [where("workflowId", "==", id)])
    for (const step of steps) {
      const painPoints = await findMany("painPoints", [where("stepId", "==", step.id)])
      for (const pp of painPoints) {
        await deleteRecord("painPoints", pp.id)
      }
      await deleteRecord("workflowSteps", step.id)
    }
    
    const workflowPainPoints = await findMany("painPoints", [where("workflowId", "==", id)])
    for (const pp of workflowPainPoints) {
      await deleteRecord("painPoints", pp.id)
    }

    await deleteRecord("workflows", id)

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

    const departments = await findMany("departments", [
      where("workspaceId", "==", workspaceId),
    ])
    return departments
      .map((d: any) => ({ id: d.id, name: d.name ?? "" }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (err) {
    console.error("getDepartments:", err)
    return []
  }
}

export async function getWorkflows() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return []

    const workflows = await findMany("workflows", [
      where("workspaceId", "==", workspaceId),
    ])

    const workflowsWithData = await Promise.all(
      workflows.map(async (wf: any) => {
        const department = wf.departmentId
          ? await findUnique("departments", wf.departmentId)
          : null
        const steps = await findMany("workflowSteps", [where("workflowId", "==", wf.id)])

        return {
          id: wf.id,
          name: wf.name ?? "",
          description: wf.description ?? null,
          status: wf.status ?? "DRAFT",
          automationPotentialScore: wf.automationPotentialScore ?? null,
          owner: wf.owner ?? null,
          department: department ? { id: department.id, name: department.name ?? "" } : null,
          _count: { steps: steps.length },
        }
      })
    )

    return workflowsWithData.sort((a, b) => b.name.localeCompare(a.name))
  } catch (err) {
    console.error("getWorkflows:", err)
    return []
  }
}
