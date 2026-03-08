"use server"

import { prisma } from "@/lib/prisma"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"

export async function getScope() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return null

    const scope = await prisma.scope.findUnique({
      where: { workspaceId },
    })
    return scope
  } catch (err) {
    console.error("getScope:", err)
    return null
  }
}

function buildScopeContent(data: {
  companyName: string
  opportunities: { title?: string; type?: string; expectedImpact?: string }[]
  roadmaps: { name?: string; phases?: { name?: string; description?: string }[] }[]
  workflows: { name?: string; description?: string }[]
}): Record<string, string> {
  const sections: Record<string, string> = {}

  sections.businessRequirements = `## Business Requirements\n\nThis implementation scope addresses the automation and process improvement needs for ${data.companyName}.\n\nKey drivers:\n${data.opportunities.slice(0, 5).map((o) => `- ${o.title || "Opportunity"}: ${o.expectedImpact || ""}`).join("\n")}`

  sections.technicalScope = `## Technical Scope\n\nWorkflows in scope:\n${data.workflows.map((w) => `- ${w.name || "Workflow"}: ${w.description || ""}`).join("\n")}\n\nIntegration requirements: APIs, data connectors, and automation tooling as identified per opportunity.`

  sections.deliverables = `## Deliverables\n\n${data.opportunities.slice(0, 8).map((o) => `- ${o.title || "Opportunity"} implementation`).join("\n")}\n- Documentation and training\n- Post-implementation support plan`

  sections.assumptions = `## Assumptions\n\n- Stakeholder availability for reviews and sign-offs\n- Access to required systems and data\n- No major organizational changes during implementation\n- Budget and timeline approvals as outlined`

  sections.acceptanceCriteria = `## Acceptance Criteria\n\n- All deliverables completed and tested\n- Documentation delivered\n- Training sessions completed\n- Sign-off from project sponsor`

  sections.outOfScope = `## Out of Scope\n\n- Custom development outside agreed deliverables\n- Third-party licensing costs not in budget\n- Ongoing maintenance beyond warranty period`

  return sections
}

type EpicItem = { id: string; name: string; stories?: StoryItem[] }
type StoryItem = { id: string; name: string; tasks?: TaskItem[] }
type TaskItem = { id: string; name: string }

function buildTaskBreakdown(data: {
  opportunities: { title?: string; type?: string }[]
  roadmaps: { phases?: { name?: string; items?: unknown[] }[] }[]
}): { epics: EpicItem[] } {
  const epics: EpicItem[] = []
  const phases = data.roadmaps[0]?.phases ?? []

  if (phases.length === 0) {
    data.opportunities.slice(0, 3).forEach((o, i) => {
      epics.push({
        id: `epic-${i + 1}`,
        name: o.title || `Epic ${i + 1}`,
        stories: [
          {
            id: `story-${i + 1}-1`,
            name: "Discovery & requirements",
            tasks: [
              { id: `task-${i + 1}-1-1`, name: "Gather requirements" },
              { id: `task-${i + 1}-1-2`, name: "Document current state" },
            ],
          },
          {
            id: `story-${i + 1}-2`,
            name: "Implementation",
            tasks: [
              { id: `task-${i + 1}-2-1`, name: "Build solution" },
              { id: `task-${i + 1}-2-2`, name: "Unit testing" },
            ],
          },
        ],
      })
    })
  } else {
    phases.forEach((phase, i) => {
      epics.push({
        id: `epic-${i + 1}`,
        name: phase.name || `Phase ${i + 1}`,
        stories: [
          {
            id: `story-${i + 1}-1`,
            name: "Setup & discovery",
            tasks: [
              { id: `task-${i + 1}-1-1`, name: "Environment setup" },
              { id: `task-${i + 1}-1-2`, name: "Requirements validation" },
            ],
          },
          {
            id: `story-${i + 1}-2`,
            name: "Build & test",
            tasks: [
              { id: `task-${i + 1}-2-1`, name: "Development" },
              { id: `task-${i + 1}-2-2`, name: "Testing" },
              { id: `task-${i + 1}-2-3`, name: "Documentation" },
            ],
          },
        ],
      })
    })
  }

  return { epics }
}

export async function generateScope() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }
    const [workspace, businessProfile, opportunities, roadmaps, workflows] =
      await Promise.all([
        prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { name: true },
        }),
        prisma.businessProfile.findFirst({ where: { workspaceId } }),
        prisma.opportunity.findMany({ where: { workspaceId } }),
        prisma.roadmap.findMany({
          where: { workspaceId },
          include: { phases: { include: { items: true } } },
        }),
        prisma.workflow.findMany({ where: { workspaceId } }),
      ])

    const companyName =
      workspace?.name || businessProfile?.companyName || "Company"

    const content = buildScopeContent({
      companyName,
      opportunities,
      roadmaps,
      workflows,
    })

    const scope = await prisma.scope.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        content: content as object,
      },
      update: {
        content: content as object,
      },
    })

    revalidatePath("/scope")
    return { success: true, id: scope.id }
  } catch (err) {
    console.error("generateScope:", err)
    return { success: false, error: String(err) }
  }
}

export async function generateTaskBreakdown() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }
    const [opportunities, roadmaps, scope] = await Promise.all([
      prisma.opportunity.findMany({ where: { workspaceId } }),
      prisma.roadmap.findMany({
        where: { workspaceId },
        include: { phases: { include: { items: true } } },
      }),
      prisma.scope.findUnique({ where: { workspaceId } }),
    ])

    const taskBreakdown = buildTaskBreakdown({
      opportunities,
      roadmaps,
    })

    if (scope) {
      await prisma.scope.update({
        where: { id: scope.id },
        data: {
          taskBreakdown: taskBreakdown as object,
        },
      })
    } else {
      await prisma.scope.create({
        data: {
          workspaceId,
          taskBreakdown: taskBreakdown as object,
        },
      })
    }

    revalidatePath("/scope")
    return { success: true }
  } catch (err) {
    console.error("generateTaskBreakdown:", err)
    return { success: false, error: String(err) }
  }
}

export async function updateScopeContent(content: Record<string, string>) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }

    const scope = await prisma.scope.findUnique({
      where: { workspaceId },
    })
    if (!scope) return { success: false, error: "No scope document" }

    await prisma.scope.update({
      where: { id: scope.id },
      data: { content: content as object },
    })

    revalidatePath("/scope")
    return { success: true }
  } catch (err) {
    console.error("updateScopeContent:", err)
    return { success: false, error: String(err) }
  }
}
