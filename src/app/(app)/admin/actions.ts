"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser, isAdmin } from "@/lib/auth"

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>
export type UserWithRole = Awaited<ReturnType<typeof getUsers>>[number]
export type AuditLogWithRelations = Awaited<ReturnType<typeof getRecentAuditLogs>>[number]

export async function getAdminStats() {
  await requireUser()
  if (!(await isAdmin())) throw new Error("Access denied")

  const [
    totalUsers,
    totalWorkspaces,
    totalWorkflows,
    totalOpportunities,
    totalReports,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.workflow.count(),
    prisma.opportunity.count(),
    prisma.report.count(),
    prisma.subscription.count({ where: { status: "active" } }),
  ])

  return {
    totalUsers,
    totalWorkspaces,
    totalWorkflows,
    totalOpportunities,
    totalReports,
    activeSubscriptions,
  }
}

export async function getRecentAuditLogs(limit = 20) {
  await requireUser()
  if (!(await isAdmin())) throw new Error("Access denied")

  const logs = await prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      workspace: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  })

  return logs
}

export async function getUsers() {
  await requireUser()
  if (!(await isAdmin())) throw new Error("Access denied")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: { select: { workspaceId: true } },
    },
  })

  const client = await clerkClient()
  const withRoles = await Promise.all(
    users.map(async (u) => {
      try {
        const clerkUser = await client.users.getUser(u.clerkId)
        const role = (clerkUser.publicMetadata?.role as string) ?? "USER"
        return { ...u, role }
      } catch {
        return { ...u, role: "USER" }
      }
    })
  )

  return withRoles.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    workspaceCount: u.memberships.length,
  }))
}

export async function updateUserRole(userId: string, role: string) {
  await requireUser()
  if (!(await isAdmin())) throw new Error("Access denied")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { clerkId: true },
  })

  if (!user) throw new Error("User not found")

  const client = await clerkClient()
  await client.users.updateUserMetadata(user.clerkId, {
    publicMetadata: { role },
  })

  revalidatePath("/admin")
}
