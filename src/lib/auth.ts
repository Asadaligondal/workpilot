import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function syncUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null,
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null,
      avatarUrl: clerkUser.imageUrl,
    },
  })

  return user
}

export async function requireUser() {
  const user = await syncUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

/** Check if current user has ADMIN role (stored in Clerk publicMetadata) */
export async function isAdmin(): Promise<boolean> {
  const clerkUser = await currentUser()
  if (!clerkUser) return false
  const role = clerkUser.publicMetadata?.role
  return role === "ADMIN"
}
