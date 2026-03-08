"use server"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { setActiveWorkspaceId } from "@/lib/workspace"
import { logAudit } from "@/lib/audit"
import { revalidatePath } from "next/cache"

export async function createWorkspace(data: {
  name: string
  industry?: string
}) {
  const user = await requireUser()

  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Math.random().toString(36).slice(2, 6)

  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      slug,
      industry: data.industry,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
      subscription: {
        create: {
          plan: "free",
          status: "active",
        },
      },
    },
  })

  await setActiveWorkspaceId(workspace.id)
  await logAudit({
    workspaceId: workspace.id,
    userId: user.id,
    action: "workspace.created",
    entity: "Workspace",
    entityId: workspace.id,
    details: { name: workspace.name, industry: data.industry },
  })
  revalidatePath("/", "layout")
  return workspace
}

export async function switchWorkspace(workspaceId: string) {
  const user = await requireUser()

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: user.id },
  })
  if (!member) throw new Error("Not a member of this workspace")

  await setActiveWorkspaceId(workspaceId)
  revalidatePath("/", "layout")
}

export async function updateWorkspace(data: {
  name?: string
  industry?: string
}) {
  const user = await requireUser()
  const { getActiveWorkspaceId } = await import("@/lib/workspace")
  const wsId = await getActiveWorkspaceId()
  if (!wsId) throw new Error("No active workspace")

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: wsId, userId: user.id, role: { in: ["OWNER", "ADMIN"] } },
  })
  if (!member) throw new Error("Insufficient permissions")

  await prisma.workspace.update({
    where: { id: wsId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.industry && { industry: data.industry }),
    },
  })

  revalidatePath("/settings")
}

export async function inviteMember(email: string, role: "ADMIN" | "MEMBER" | "VIEWER") {
  // Stub for now — will send email invite in later milestone
  return { success: true, message: "Invite functionality coming soon" }
}
