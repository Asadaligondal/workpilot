import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"

const WORKSPACE_COOKIE = "workpilot-workspace-id"

export async function getActiveWorkspaceId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(WORKSPACE_COOKIE)?.value ?? null
}

export async function setActiveWorkspaceId(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function getWorkspacesForUser() {
  const user = await requireUser()
  return prisma.workspace.findMany({
    where: {
      members: { some: { userId: user.id } },
    },
    include: {
      members: { where: { userId: user.id }, take: 1 },
      subscription: true,
      _count: { select: { workflows: true, opportunities: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getActiveWorkspace() {
  const user = await requireUser()
  const activeId = await getActiveWorkspaceId()

  if (activeId) {
    const ws = await prisma.workspace.findFirst({
      where: {
        id: activeId,
        members: { some: { userId: user.id } },
      },
      include: {
        members: { where: { userId: user.id }, take: 1 },
        subscription: true,
      },
    })
    if (ws) return ws
  }

  const firstWs = await prisma.workspace.findFirst({
    where: {
      members: { some: { userId: user.id } },
    },
    include: {
      members: { where: { userId: user.id }, take: 1 },
      subscription: true,
    },
    orderBy: { createdAt: "asc" },
  })

  if (firstWs) {
    await setActiveWorkspaceId(firstWs.id)
  }

  return firstWs
}
