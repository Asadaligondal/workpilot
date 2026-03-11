"use server"

import { requireUser } from "@/lib/auth"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"
import { findFirst, findMany, where, create, update, deleteRecord, upsert } from "@/lib/firestore-helpers"

async function getWorkspaceContext() {
  const user = await requireUser()
  const workspaceId = await getActiveWorkspaceId()
  console.log("[CTX] getWorkspaceContext: userId:", user.id, "workspaceId:", workspaceId)
  if (!workspaceId) throw new Error("No active workspace")

  const member = await findFirst("workspaceMembers", [
    where("workspaceId", "==", workspaceId),
    where("userId", "==", user.id),
  ])
  console.log("[CTX] membership found:", member ? "YES" : "NO", member ? `role=${member.role}` : "")
  if (!member) throw new Error("Insufficient permissions")

  return workspaceId
}

export type CompanyDetailsInput = {
  companyName: string
  website: string
  industry: string
  subIndustry: string
  teamSize: string
  growthStage: string
  operatingHours: string
  locations: string
}

export async function saveCompanyDetails(data: CompanyDetailsInput) {
  try {
    const workspaceId = await getWorkspaceContext()
    console.log("[SAVE] saveCompanyDetails called. workspaceId:", workspaceId)
    console.log("[SAVE] data:", JSON.stringify(data))

    const result = await upsert(
      "businessProfiles",
      "workspaceId",
      workspaceId,
      {
        workspaceId,
        companyName: data.companyName || null,
        website: data.website || null,
        industry: data.industry || null,
        subIndustry: data.subIndustry || null,
        teamSize: data.teamSize || null,
        growthStage: data.growthStage || null,
        operatingHours: data.operatingHours || null,
        locations: data.locations || null,
      }
    )
    console.log("[SAVE] upsert result:", JSON.stringify(result))

    revalidatePath("/business-profile")
    return { success: true }
  } catch (err) {
    console.error("[SAVE] saveCompanyDetails ERROR:", err)
    return { success: false, error: String(err) }
  }
}

export type DepartmentInput = {
  id?: string
  name: string
  headCount: number | null
  manager: string
  roles: { id?: string; title: string; responsibilities: string; toolsUsed: string }[]
}

export async function saveDepartments(departments: DepartmentInput[]) {
  try {
    const workspaceId = await getWorkspaceContext()

    const existingDepts = await findMany("departments", [
      where("workspaceId", "==", workspaceId),
    ])
    
    // Get roles for each department
    const existingDeptsWithRoles = await Promise.all(
      existingDepts.map(async (dept: any) => {
        const roles = await findMany("teamRoles", [
          where("departmentId", "==", dept.id),
        ])
        return { ...dept, roles }
      })
    )

    const existingIds = new Set(existingDeptsWithRoles.map((d: any) => d.id))
    const incomingIds = new Set(departments.filter((d: any) => d.id).map((d: any) => d.id!))

    // Delete departments that are no longer present
    for (const dept of existingDeptsWithRoles) {
      if (!incomingIds.has(dept.id)) {
        // Delete all roles first
        const roles = await findMany("teamRoles", [
          where("departmentId", "==", dept.id),
        ])
        for (const role of roles) {
          await deleteRecord("teamRoles", role.id)
        }
        await deleteRecord("departments", dept.id)
      }
    }

    // Update or create departments
    for (const dept of departments) {
      const rolesData = dept.roles.map((r: any) => ({
        title: r.title,
        responsibilities: r.responsibilities || null,
        toolsUsed: r.toolsUsed ? (r.toolsUsed.split(",").map((s: any) => s.trim()).filter(Boolean) as unknown) : null,
      }))

      if (dept.id && existingIds.has(dept.id)) {
        // Update department
        await update("departments", dept.id, {
          name: dept.name,
          headCount: dept.headCount,
          manager: dept.manager || null,
        })
        
        // Handle roles
        const existingRoles = await findMany("teamRoles", [
          where("departmentId", "==", dept.id),
        ])
        const roleIds = dept.roles.filter((r: any) => r.id).map((r: any) => r.id!)
        
        // Delete roles that are no longer present
        for (const r of existingRoles) {
          if (!roleIds.includes(r.id)) {
            await deleteRecord("teamRoles", r.id)
          }
        }
        
        // Update or create roles
        for (let i = 0; i < rolesData.length; i++) {
          const r = dept.roles[i]
          const data = rolesData[i]
          if (r.id && existingRoles.some((er: any) => er.id === r.id)) {
            await update("teamRoles", r.id, data)
          } else {
            await create("teamRoles", {
              departmentId: dept.id,
              ...data,
            })
          }
        }
      } else {
        // Create new department
        const created = await create("departments", {
          workspaceId,
          name: dept.name,
          headCount: dept.headCount,
          manager: dept.manager || null,
        })
        
        // Create roles
        for (const roleData of rolesData) {
          await create("teamRoles", {
            departmentId: created.id,
            ...roleData,
          })
        }
        existingIds.add(created.id)
      }
    }

    revalidatePath("/business-profile")
    return { success: true }
  } catch (err) {
    console.error("saveDepartments:", err)
    return { success: false, error: String(err) }
  }
}

export type ToolStackItemInput = {
  id?: string
  name: string
  category: string
  monthlyBudget: number | null
  satisfaction: number | null
  notes: string
}

export async function saveToolStack(items: ToolStackItemInput[]) {
  try {
    const workspaceId = await getWorkspaceContext()

    const existing = await findMany("toolStackItems", [
      where("workspaceId", "==", workspaceId),
    ])
    const existingIds = new Set(existing.map((i: any) => i.id))
    const validItems = items.filter((i: any) => i.name.trim())
    const incomingIds = new Set(validItems.filter((i: any) => i.id).map((i: any) => i.id!))

    // Delete items that are no longer present
    for (const item of existing) {
      if (!incomingIds.has(item.id)) {
        await deleteRecord("toolStackItems", item.id)
      }
    }
    
    // Update or create items
    for (const item of validItems) {
      const data = {
        name: item.name,
        category: item.category || null,
        monthlyBudget: item.monthlyBudget,
        satisfaction: item.satisfaction,
        notes: item.notes || null,
      }
      if (item.id && existingIds.has(item.id)) {
        await update("toolStackItems", item.id, data)
      } else {
        await create("toolStackItems", { workspaceId, ...data })
      }
    }

    revalidatePath("/business-profile")
    return { success: true }
  } catch (err) {
    console.error("saveToolStack:", err)
    return { success: false, error: String(err) }
  }
}

export type ConstraintsInput = {
  complianceNotes: string
  budgetConstraints: string
  timelineConstraints: string
  technicalLimitations: string
}

export async function saveConstraints(data: ConstraintsInput) {
  try {
    const workspaceId = await getWorkspaceContext()

    const constraints = {
      complianceNotes: data.complianceNotes || "",
      budgetConstraints: data.budgetConstraints || "",
      timelineConstraints: data.timelineConstraints || "",
      technicalLimitations: data.technicalLimitations || "",
    }

    await upsert(
      "businessProfiles",
      "workspaceId",
      workspaceId,
      {
        workspaceId,
        constraints: constraints as unknown as object,
      }
    )

    revalidatePath("/business-profile")
    return { success: true }
  } catch (err) {
    console.error("saveConstraints:", err)
    return { success: false, error: String(err) }
  }
}
