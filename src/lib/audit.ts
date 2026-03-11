import { db } from "./firebase"
import { findMany, findUnique, create, where, orderBy, limit, toPlain } from "./firestore-helpers"

const PAGE_SIZE = 25
const MAX_ENTRIES = 100

export async function getAuditLogs(workspaceId: string, page = 1) {
  const take = Math.min(page * PAGE_SIZE, MAX_ENTRIES)
  
  const logs = await findMany("auditLogs", [
    where("workspaceId", "==", workspaceId),
    orderBy("createdAt", "desc"),
    limit(take),
  ])

  // Get user data for each log
  const logsWithUsers = await Promise.all(
    logs.map(async (log) => {
      if (log.userId) {
        let userDoc = await findUnique("users", log.userId)
        if (!userDoc) {
          const byUid = await findMany("users", [where("firebaseUid", "==", log.userId)])
          userDoc = byUid[0] ?? null
        }
        const user = userDoc ? [userDoc] : []
        return {
          ...log,
          createdAt: log.createdAt,
          user: user[0] ? { name: user[0].name, email: user[0].email } : null,
        } as typeof log & { user: { name: string; email: string } | null }
      }
      return { ...log, createdAt: log.createdAt, user: null } as typeof log & { user: null }
    })
  )

  // Get total count - fetch all matching logs and count
  const allLogs = await findMany("auditLogs", [
    where("workspaceId", "==", workspaceId),
  ])
  const total = allLogs.length

  return {
    logs: toPlain(logsWithUsers),
    hasMore: take < Math.min(total, MAX_ENTRIES),
    page,
  }
}

export async function logAudit(params: {
  workspaceId: string
  userId?: string
  action: string
  entity?: string
  entityId?: string
  details?: Record<string, unknown>
}) {
  let cleanDetails: Record<string, unknown> | null = null
  if (params.details) {
    cleanDetails = Object.fromEntries(
      Object.entries(params.details).filter(([, v]) => v !== undefined)
    )
    if (Object.keys(cleanDetails).length === 0) cleanDetails = null
  }

  try {
    await create("auditLogs", {
      workspaceId: params.workspaceId,
      userId: params.userId || null,
      action: params.action,
      entity: params.entity || null,
      entityId: params.entityId || null,
      details: cleanDetails,
    })
  } catch (err) {
    console.error("logAudit failed (non-fatal):", err)
  }
}
