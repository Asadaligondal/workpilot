"use server"

import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"
import type { OpportunityStatus } from "@/types"
import { findMany, findUnique, where, update, toPlain } from "@/lib/firestore-helpers"

export type OpportunityFilters = {
  type?: string
  status?: string
  quadrant?: string
  search?: string
}

export async function getOpportunities(filters: OpportunityFilters = {}) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return []

    let opportunities = await findMany("opportunities", [
      where("workspaceId", "==", workspaceId),
    ])

    if (filters.type && filters.type !== "all") {
      opportunities = opportunities.filter((o: any) => o.type === filters.type)
    }
    if (filters.status && filters.status !== "all") {
      opportunities = opportunities.filter((o: any) => o.status === filters.status)
    }
    if (filters.quadrant && filters.quadrant !== "all") {
      opportunities = opportunities.filter((o: any) => o.quadrant === filters.quadrant)
    }
    if (filters.search?.trim()) {
      const searchLower = filters.search.trim().toLowerCase()
      opportunities = opportunities.filter((o: any) =>
        o.title?.toLowerCase().includes(searchLower)
      )
    }

    opportunities.sort((a: any, b: any) => {
      const aRoi = a.roiScore ?? 0
      const bRoi = b.roiScore ?? 0
      if (aRoi !== bRoi) return bRoi - aRoi
      return (b.impactScore ?? 0) - (a.impactScore ?? 0)
    })

    const opportunitiesWithWorkflows = await Promise.all(
      opportunities.map(async (opp: any) => {
        const workflow = opp.workflowId
          ? await findUnique("workflows", opp.workflowId)
          : null
        return {
          ...opp,
          workflow: workflow ? { id: workflow.id, name: workflow.name ?? "" } : null,
        }
      })
    )

    return toPlain(opportunitiesWithWorkflows)
  } catch (err) {
    console.error("getOpportunities:", err)
    return []
  }
}

export async function getOpportunity(id: string) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return null

    const opportunity = await findUnique("opportunities", id)
    if (!opportunity || opportunity.workspaceId !== workspaceId) return null

    const workflow = opportunity.workflowId
      ? await findUnique("workflows", opportunity.workflowId)
      : null

    return toPlain({
      ...opportunity,
      workflow: workflow ? { id: workflow.id, name: workflow.name ?? "" } : null,
    })
  } catch (err) {
    console.error("getOpportunity:", err)
    return null
  }
}

export async function updateOpportunityStatus(id: string, status: OpportunityStatus) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }

    const opportunity = await findUnique("opportunities", id)
    if (!opportunity || opportunity.workspaceId !== workspaceId)
      return { success: false, error: "Opportunity not found" }

    await update("opportunities", id, { status })

    revalidatePath("/opportunities")
    revalidatePath(`/opportunities/${id}`)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    console.error("updateOpportunityStatus:", err)
    return { success: false, error: String(err) }
  }
}

export async function approveOpportunity(formData: FormData) {
  const id = formData.get("id") as string
  if (!id) return { success: false, error: "Missing id" }
  return updateOpportunityStatus(id, "APPROVED")
}

export async function dismissOpportunity(formData: FormData) {
  const id = formData.get("id") as string
  if (!id) return { success: false, error: "Missing id" }
  return updateOpportunityStatus(id, "DISMISSED")
}
