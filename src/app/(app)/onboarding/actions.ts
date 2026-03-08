"use server"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"

export type OnboardingData = {
  companyName: string
  website: string
  industry: string
  subIndustry: string
  teamSize: string
  locations: string
  growthStage: string
  departments: string[]
  tools: { name: string; category: string }[]
  painPoints: string[]
  painPointsAdditional: string
  goals: string[]
  auditMode: string
}

export async function saveOnboardingData(data: OnboardingData) {
  try {
    const user = await requireUser()
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) throw new Error("No active workspace")

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id },
    })
    if (!member) throw new Error("Not a member of this workspace")

    const locationsJson = data.locations
      ? data.locations.split(",").map((s) => s.trim()).filter(Boolean)
      : []

    const mainPainPoints = [
      ...data.painPoints,
      ...(data.painPointsAdditional.trim() ? [data.painPointsAdditional.trim()] : []),
    ]

    await prisma.businessProfile.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        companyName: data.companyName || null,
        website: data.website || null,
        industry: data.industry || null,
        subIndustry: data.subIndustry || null,
        teamSize: data.teamSize || null,
        growthStage: data.growthStage || null,
        mainPainPoints: mainPainPoints.length > 0 ? mainPainPoints : null,
        goals: data.goals.length > 0 ? data.goals : null,
        locations: locationsJson.length > 0 ? locationsJson : null,
        constraints: data.departments.length > 0 ? { departments: data.departments } : null,
        auditMode: data.auditMode || "quick",
      },
      update: {
        companyName: data.companyName || null,
        website: data.website || null,
        industry: data.industry || null,
        subIndustry: data.subIndustry || null,
        teamSize: data.teamSize || null,
        growthStage: data.growthStage || null,
        mainPainPoints: mainPainPoints.length > 0 ? mainPainPoints : null,
        goals: data.goals.length > 0 ? data.goals : null,
        locations: locationsJson.length > 0 ? locationsJson : null,
        constraints: data.departments.length > 0 ? { departments: data.departments } : null,
        auditMode: data.auditMode || "quick",
      },
    })

    await prisma.toolStackItem.deleteMany({ where: { workspaceId } })

    if (data.tools.length > 0) {
      await prisma.toolStackItem.createMany({
        data: data.tools.map((t) => ({
          workspaceId,
          name: t.name,
          category: t.category || null,
        })),
      })
    }

    revalidatePath("/", "layout")
    redirect("/dashboard")
  } catch (err) {
    console.error("saveOnboardingData error:", err)
    throw err
  }
}
