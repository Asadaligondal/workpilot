import { prisma } from "@/lib/prisma"

const PAGE_SIZE = 25
const MAX_ENTRIES = 100

export async function getAuditLogs(workspaceId: string, page = 1) {
  const take = Math.min(page * PAGE_SIZE, MAX_ENTRIES)
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { workspaceId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.auditLog.count({ where: { workspaceId } }),
  ])
  return {
    logs,
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
  await prisma.auditLog.create({
    data: {
      workspaceId: params.workspaceId,
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity ?? null,
      entityId: params.entityId ?? null,
      details: params.details ?? null,
    },
  })
}
