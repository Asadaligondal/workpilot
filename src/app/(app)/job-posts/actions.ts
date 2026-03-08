"use server"

import { prisma } from "@/lib/prisma"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"

export async function getJobPosts() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return []

    const jobPosts = await prisma.jobPost.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    })
    return jobPosts
  } catch (err) {
    console.error("getJobPosts:", err)
    return []
  }
}

function buildJobPostContent(
  data: {
    title: string
    platform: string
    roleType: string
    skills: string[]
    budgetRange: string
    opportunities: { title?: string; type?: string; toolingSuggestion?: string }[]
  }
): string {
  const sections: string[] = []

  sections.push(`# ${data.title}\n`)
  sections.push(`We are looking for a skilled professional to help implement automation and process improvements.\n`)

  sections.push(`## Role Type\n`)
  sections.push(`${data.roleType}\n`)

  sections.push(`## Responsibilities\n`)
  data.opportunities.slice(0, 5).forEach((o) => {
    sections.push(`- Implement ${o.title || "automation opportunity"}\n`)
  })
  sections.push(`- Collaborate with stakeholders to define requirements\n`)
  sections.push(`- Deliver high-quality, documented solutions\n`)

  sections.push(`## Required Skills\n`)
  if (data.skills.length > 0) {
    data.skills.forEach((s) => sections.push(`- ${s}\n`))
  } else {
    sections.push(`- Process automation\n`)
    sections.push(`- API integrations\n`)
    sections.push(`- Workflow design\n`)
    sections.push(`- Documentation\n`)
  }

  sections.push(`## Budget\n`)
  sections.push(`${data.budgetRange}\n`)

  sections.push(`## Platform\n`)
  sections.push(`This project will be managed via ${data.platform}.\n`)

  return sections.join("\n")
}

export async function generateJobPost(
  title: string,
  platform: string,
  roleType: string,
  skills: string[],
  budgetRange: string
) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }
    const opportunities = await prisma.opportunity.findMany({
      where: { workspaceId },
    })

    const content = buildJobPostContent({
      title: title || "Automation Implementation Specialist",
      platform: platform || "Generic",
      roleType: roleType || "Freelancer",
      skills: skills || [],
      budgetRange: budgetRange || "To be discussed",
      opportunities,
    })

    const jobPost = await prisma.jobPost.create({
      data: {
        workspaceId,
        title: title || "Automation Implementation Specialist",
        platform: platform || null,
        roleType: roleType || null,
        skills: skills.length > 0 ? skills : null,
        budgetRange: budgetRange || null,
        content,
      },
    })

    revalidatePath("/job-posts")
    return { success: true, id: jobPost.id, content }
  } catch (err) {
    console.error("generateJobPost:", err)
    return { success: false, error: String(err) }
  }
}
