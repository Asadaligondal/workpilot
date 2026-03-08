"use server"

import { prisma } from "@/lib/prisma"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"
import type { OpportunityType, OpportunityStatus } from "@prisma/client"

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

    const where: Parameters<typeof prisma.opportunity.findMany>[0]["where"] = {
      workspaceId,
    }

    if (filters.type && filters.type !== "all") {
      where.type = filters.type as OpportunityType
    }
    if (filters.status && filters.status !== "all") {
      where.status = filters.status as OpportunityStatus
    }
    if (filters.quadrant && filters.quadrant !== "all") {
      where.quadrant = filters.quadrant
    }
    if (filters.search?.trim()) {
      where.OR = [
        { title: { contains: filters.search.trim(), mode: "insensitive" } },
        {
          workflow: {
            name: { contains: filters.search.trim(), mode: "insensitive" },
          },
        },
      ]
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: { workflow: true },
      orderBy: [{ roiScore: "desc" }, { impactScore: "desc" }],
    })
    return opportunities
  } catch (err) {
    console.error("getOpportunities:", err)
    return []
  }
}

export async function getOpportunity(id: string) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return null

    const opportunity = await prisma.opportunity.findFirst({
      where: { id, workspaceId },
      include: { workflow: true },
    })
    return opportunity
  } catch (err) {
    console.error("getOpportunity:", err)
    return null
  }
}

export async function updateOpportunityStatus(id: string, status: OpportunityStatus) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }

    await prisma.opportunity.updateMany({
      where: { id, workspaceId },
      data: { status },
    })

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
