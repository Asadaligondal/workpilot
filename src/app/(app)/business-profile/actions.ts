"use server"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"

async function getWorkspaceContext() {
  const user = await requireUser()
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) throw new Error("No active workspace")

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: user.id, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
  })
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
        operatingHours: data.operatingHours || null,
        locations: data.locations || null,
      },
      update: {
        companyName: data.companyName || null,
        website: data.website || null,
        industry: data.industry || null,
        subIndustry: data.subIndustry || null,
        teamSize: data.teamSize || null,
        growthStage: data.growthStage || null,
        operatingHours: data.operatingHours || null,
        locations: data.locations || null,
      },
    })

    revalidatePath("/business-profile")
    return { success: true }
  } catch (err) {
    console.error("saveCompanyDetails:", err)
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

    const existingDepts = await prisma.department.findMany({
      where: { workspaceId },
      include: { roles: true },
    })
    const existingIds = new Set(existingDepts.map((d) => d.id))
    const incomingIds = new Set(departments.filter((d) => d.id).map((d) => d.id!))

    for (const dept of existingDepts) {
      if (!incomingIds.has(dept.id)) {
        await prisma.department.delete({ where: { id: dept.id } })
      }
    }

    for (const dept of departments) {
      const rolesData = dept.roles.map((r) => ({
        title: r.title,
        responsibilities: r.responsibilities || null,
        toolsUsed: r.toolsUsed ? (r.toolsUsed.split(",").map((s) => s.trim()).filter(Boolean) as unknown) : null,
      }))

      if (dept.id && existingIds.has(dept.id)) {
        await prisma.department.update({
          where: { id: dept.id },
          data: {
            name: dept.name,
            headCount: dept.headCount,
            manager: dept.manager || null,
          },
        })
        const existingRoles = await prisma.teamRole.findMany({
          where: { departmentId: dept.id },
        })
        const roleIds = dept.roles.filter((r) => r.id).map((r) => r.id!)
        for (const r of existingRoles) {
          if (!roleIds.includes(r.id)) {
            await prisma.teamRole.delete({ where: { id: r.id } })
          }
        }
        for (let i = 0; i < rolesData.length; i++) {
          const r = dept.roles[i]
          const data = rolesData[i]
          if (r.id && existingRoles.some((er) => er.id === r.id)) {
            await prisma.teamRole.update({
              where: { id: r.id },
              data,
            })
          } else {
            await prisma.teamRole.create({
              data: {
                departmentId: dept.id,
                ...data,
              },
            })
          }
        }
      } else {
        const created = await prisma.department.create({
          data: {
            workspaceId,
            name: dept.name,
            headCount: dept.headCount,
            manager: dept.manager || null,
            roles: {
              create: rolesData,
            },
          },
        })
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

    const existing = await prisma.toolStackItem.findMany({
      where: { workspaceId },
    })
    const existingIds = new Set(existing.map((i) => i.id))
    const validItems = items.filter((i) => i.name.trim())
    const incomingIds = new Set(validItems.filter((i) => i.id).map((i) => i.id!))

    for (const item of existing) {
      if (!incomingIds.has(item.id)) {
        await prisma.toolStackItem.delete({ where: { id: item.id } })
      }
    }
    for (const item of validItems) {
      const data = {
        name: item.name,
        category: item.category || null,
        monthlyBudget: item.monthlyBudget,
        satisfaction: item.satisfaction,
        notes: item.notes || null,
      }
      if (item.id && existingIds.has(item.id)) {
        await prisma.toolStackItem.update({
          where: { id: item.id },
          data,
        })
      } else {
        await prisma.toolStackItem.create({
          data: { workspaceId, ...data },
        })
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

    await prisma.businessProfile.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        constraints: constraints as unknown as object,
      },
      update: {
        constraints: constraints as unknown as object,
      },
    })

    revalidatePath("/business-profile")
    return { success: true }
  } catch (err) {
    console.error("saveConstraints:", err)
    return { success: false, error: String(err) }
  }
}
