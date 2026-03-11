"use server"

import { redirect } from "next/navigation"
import { db } from "@/lib/firebase"
import { requireUser } from "@/lib/auth"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"
import { findFirst, where, create, findMany, deleteRecord, upsert } from "@/lib/firestore-helpers"
import { Timestamp } from "firebase-admin/firestore"

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
  const user = await requireUser()
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) throw new Error("No active workspace")

  const member = await findFirst("workspaceMembers", [
    where("workspaceId", "==", workspaceId),
    where("userId", "==", user.id),
  ])
  if (!member) throw new Error("Not a member of this workspace")

  const locationsJson = data.locations
    ? data.locations.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  const mainPainPoints = [
    ...data.painPoints,
    ...(data.painPointsAdditional.trim() ? [data.painPointsAdditional.trim()] : []),
  ]

  const profileData = {
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
  }

  await upsert(
    "businessProfiles",
    "workspaceId",
    workspaceId,
    profileData
  )

  const existingTools = await findMany("toolStackItems", [
    where("workspaceId", "==", workspaceId),
  ])
  for (const tool of existingTools) {
    await deleteRecord("toolStackItems", tool.id)
  }

  if (data.tools.length > 0) {
    for (const tool of data.tools) {
      await create("toolStackItems", {
        workspaceId,
        name: tool.name,
        category: tool.category || null,
      })
    }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}
