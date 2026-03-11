"use server"

import { revalidatePath } from "next/cache"
import { requireUser, isAdmin } from "@/lib/auth"
import { findMany, findFirst, findUnique, where, orderBy, limit, update, toPlain } from "@/lib/firestore-helpers"
import { db } from "@/lib/firebase"

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>
export type UserWithRole = Awaited<ReturnType<typeof getUsers>>[number]
export type AuditLogWithRelations = Awaited<ReturnType<typeof getRecentAuditLogs>>[number]

export async function getAdminStats() {
  await requireUser()
  if (!(await isAdmin())) throw new Error("Access denied")

  // Get counts using Firestore - fetch all and count (for small datasets this is fine)
  const [
    users,
    workspaces,
    workflows,
    opportunities,
    reports,
    subscriptions,
  ] = await Promise.all([
    db.collection("users").select().get(),
    db.collection("workspaces").select().get(),
    db.collection("workflows").select().get(),
    db.collection("opportunities").select().get(),
    db.collection("reports").select().get(),
    db.collection("subscriptions").where("status", "==", "active").select().get(),
  ])

  return {
    totalUsers: users.size,
    totalWorkspaces: workspaces.size,
    totalWorkflows: workflows.size,
    totalOpportunities: opportunities.size,
    totalReports: reports.size,
    activeSubscriptions: subscriptions.size,
  }
}

export async function getRecentAuditLogs(limitCount = 20) {
  await requireUser()
  if (!(await isAdmin())) throw new Error("Access denied")

  const logs = await findMany("auditLogs", [
    orderBy("createdAt", "desc"),
    limit(limitCount),
  ])

  // Get workspace and user data
  const logsWithRelations = await Promise.all(
    logs.map(async (log) => {
      const workspace = log.workspaceId
        ? await findUnique("workspaces", log.workspaceId)
        : null

      let user = null
      if (log.userId) {
        user = await findUnique("users", log.userId)
        if (!user) {
          user = await findFirst("users", [where("firebaseUid", "==", log.userId)])
        }
      }

      return {
        ...log,
        createdAt: log.createdAt,
        workspace: workspace ? { name: workspace.name } : null,
        user: user ? { name: user.name, email: user.email } : null,
      } as typeof log & { workspace: { name: string } | null; user: { name: string; email: string } | null }
    })
  )

  return toPlain(logsWithRelations)
}

export async function getUsers() {
  await requireUser()
  if (!(await isAdmin())) throw new Error("Access denied")

  const users = await findMany("users", [orderBy("createdAt", "desc")])

  // Get workspace counts for each user
  const usersWithCounts = await Promise.all(
    users.map(async (u) => {
      const memberships = await findMany("workspaceMembers", [
        where("userId", "==", u.id),
      ])
      
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || "USER",
        createdAt: u.createdAt,
        workspaceCount: memberships.length,
      }
    })
  )

  return toPlain(usersWithCounts)
}

export async function updateUserRole(userId: string, role: string) {
  await requireUser()
  if (!(await isAdmin())) throw new Error("Access denied")

  const user = await findUnique("users", userId)
  if (!user) {
    const userByUid = await findFirst("users", [where("firebaseUid", "==", userId)])
    if (!userByUid) throw new Error("User not found")
    await update("users", userByUid.id, { role })
  } else {
    await update("users", user.id, { role })
  }

  revalidatePath("/admin")
}
