"use server"

import { prisma } from "@/lib/prisma"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"

export async function getProposals() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return []

    const proposals = await prisma.proposal.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    })
    return proposals
  } catch (err) {
    console.error("getProposals:", err)
    return []
  }
}

function buildProposalContent(
  data: {
    companyName: string
    clientName: string
    template: string
    opportunities: { title?: string; type?: string; expectedImpact?: string }[]
    roadmaps: { name?: string; phases?: { name?: string; description?: string }[] }[]
    budgetEstimates: { itemName?: string; oneTimeCost?: number; recurringMonthlyCost?: number }[]
  }
): string {
  const sections: string[] = []

  sections.push(`# Proposal for ${data.clientName}\n`)
  sections.push(`Prepared by ${data.companyName}\n`)

  sections.push(`## Introduction\n`)
  sections.push(
    `This proposal outlines our recommended approach for implementing automation and process improvements for ${data.clientName}. Based on our analysis, we have identified key opportunities to enhance efficiency and reduce manual effort.\n`
  )

  sections.push(`## Scope\n`)
  if (data.template === "consulting") {
    sections.push(
      `Our consulting engagement will include discovery, analysis, and strategic recommendations for process automation.\n`
    )
  } else if (data.template === "agency") {
    sections.push(
      `Our agency engagement covers end-to-end implementation including design, development, and deployment of automation solutions.\n`
    )
  } else {
    sections.push(
      `This internal brief summarizes findings and recommended next steps for the implementation team.\n`
    )
  }

  sections.push(`## Phases\n`)
  if (data.roadmaps.length > 0) {
    data.roadmaps.forEach((r, i) => {
      sections.push(`### Phase ${i + 1}: ${r.name || "Implementation"}\n`)
      r.phases?.forEach((p) => {
        sections.push(`- **${p.name || "Step"}**: ${p.description || ""}\n`)
      })
    })
  } else {
    sections.push(`- Discovery & Assessment\n`)
    sections.push(`- Design & Planning\n`)
    sections.push(`- Implementation\n`)
    sections.push(`- Testing & Deployment\n`)
  }

  sections.push(`## Deliverables\n`)
  data.opportunities.slice(0, 5).forEach((o) => {
    sections.push(`- ${o.title || "Opportunity"} implementation\n`)
  })
  sections.push(`- Documentation and training materials\n`)
  sections.push(`- Post-implementation support plan\n`)

  sections.push(`## Timeline\n`)
  const totalWeeks = data.roadmaps.reduce(
    (sum, r) =>
      sum +
      (r.phases?.reduce(
        (s, p) => s + 1,
        0 as number
      ) ?? 4),
    0
  )
  sections.push(`Estimated duration: ${totalWeeks || 8} weeks\n`)

  sections.push(`## Budget\n`)
  const totalOneTime = data.budgetEstimates.reduce(
    (s, b) => s + (b.oneTimeCost || 0),
    0
  )
  const totalRecurring = data.budgetEstimates.reduce(
    (s, b) => s + (b.recurringMonthlyCost || 0) * 12,
    0
  )
  sections.push(`- One-time costs: $${totalOneTime.toLocaleString()}\n`)
  sections.push(`- Annual recurring: $${totalRecurring.toLocaleString()}\n`)

  sections.push(`## Terms\n`)
  sections.push(`- Payment terms: Net 30\n`)
  sections.push(`- Warranty: 90 days post-implementation\n`)
  sections.push(`- Change requests: Documented and approved\n`)

  return sections.join("\n")
}

export async function generateProposal(
  clientName: string,
  template: string
) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }
    const [workspace, businessProfile, opportunities, roadmaps, budgetEstimates] =
      await Promise.all([
        prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { name: true },
        }),
        prisma.businessProfile.findFirst({ where: { workspaceId } }),
        prisma.opportunity.findMany({ where: { workspaceId } }),
        prisma.roadmap.findMany({
          where: { workspaceId },
          include: { phases: true },
        }),
        prisma.budgetEstimate.findMany({ where: { workspaceId } }),
      ])

    const companyName =
      workspace?.name || businessProfile?.companyName || "Company"

    const content = buildProposalContent({
      companyName,
      clientName: clientName || "Client",
      template: template || "consulting",
      opportunities,
      roadmaps,
      budgetEstimates,
    })

    const proposal = await prisma.proposal.create({
      data: {
        workspaceId,
        title: `Proposal for ${clientName || "Client"}`,
        clientName: clientName || null,
        content: {
          markdown: content,
          template,
        } as object,
      },
    })

    revalidatePath("/proposals")
    return { success: true, id: proposal.id, content }
  } catch (err) {
    console.error("generateProposal:", err)
    return { success: false, error: String(err) }
  }
}

export async function updateProposalContent(id: string, content: string) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }

    const existing = await prisma.proposal.findFirst({
      where: { id, workspaceId },
    })
    if (!existing) return { success: false, error: "Proposal not found" }

    const currentContent = (existing.content as { markdown?: string }) ?? {}
    await prisma.proposal.update({
      where: { id },
      data: {
        content: {
          ...currentContent,
          markdown: content,
        } as object,
      },
    })

    revalidatePath("/proposals")
    return { success: true }
  } catch (err) {
    console.error("updateProposalContent:", err)
    return { success: false, error: String(err) }
  }
}
