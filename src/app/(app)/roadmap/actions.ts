"use server"

import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"
import OpenAI from "openai"
import { findFirst, findMany, findUnique, where, create, deleteRecord, toPlain } from "@/lib/firestore-helpers"

const PHASE_CONFIG = [
  { name: "Quick Wins", order: 1, quadrants: ["quick_win"] },
  { name: "Core Improvements", order: 2, quadrants: ["optional"] },
  { name: "Strategic Initiatives", order: 3, quadrants: ["strategic", "deprioritize"] },
] as const

export async function getRoadmap(workspaceId: string) {
  try {
    const roadmaps = await findMany("roadmaps", [
      where("workspaceId", "==", workspaceId),
    ])
    const roadmap = roadmaps.sort((a: any, b: any) => {
      const aTime = a.updatedAt?._seconds ?? a.updatedAt?.seconds ?? 0
      const bTime = b.updatedAt?._seconds ?? b.updatedAt?.seconds ?? 0
      return bTime - aTime
    })[0] ?? null
    if (!roadmap) return null

    const phases = await findMany("roadmapPhases", [
      where("roadmapId", "==", roadmap.id),
    ])
    const sortedPhases = phases.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))

    const phasesWithItems = await Promise.all(
      sortedPhases.map(async (phase: any) => {
        const items = await findMany("roadmapItems", [where("phaseId", "==", phase.id)])
        const itemsWithOpportunities = await Promise.all(
          items.map(async (item: any) => {
            const opportunity = item.opportunityId
              ? await findUnique("opportunities", item.opportunityId)
              : null
            return {
              ...item,
              opportunity: opportunity
                ? { id: opportunity.id, title: opportunity.title ?? "", type: opportunity.type ?? "" }
                : null,
            }
          })
        )
        return { ...phase, items: itemsWithOpportunities }
      })
    )

    return toPlain({ ...roadmap, phases: phasesWithItems })
  } catch (err) {
    console.error("getRoadmap:", err)
    return null
  }
}

export async function generateRoadmap(workspaceId: string) {
  try {
    const opportunities = await findMany("opportunities", [
      where("workspaceId", "==", workspaceId),
    ])

    opportunities.sort((a: any, b: any) => {
      const aRoi = a.roiScore ?? 0
      const bRoi = b.roiScore ?? 0
      if (aRoi !== bRoi) return bRoi - aRoi
      const aImpact = a.impactScore ?? 0
      const bImpact = b.impactScore ?? 0
      if (aImpact !== bImpact) return bImpact - aImpact
      return (a.effortScore ?? 0) - (b.effortScore ?? 0)
    })

    const opportunitiesWithWorkflows = await Promise.all(
      opportunities.map(async (opp: any) => {
        const workflow = opp.workflowId
          ? await findUnique("workflows", opp.workflowId)
          : null
        return { ...opp, workflow: workflow ? { name: workflow.name } : null }
      })
    )

    if (opportunitiesWithWorkflows.length === 0) {
      return { success: false, error: "No opportunities found. Run an AI analysis first." }
    }

    let groupedByPhase: Map<number, typeof opportunitiesWithWorkflows> = new Map()
    const openaiKey = process.env.OPENAI_API_KEY

    if (openaiKey) {
      try {
        const client = new OpenAI({ apiKey: openaiKey })
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a roadmap planner. Given a list of opportunities with quadrant (quick_win, strategic, optional, deprioritize), assign each to a phase:
- Phase 1 (Quick Wins): quick_win quadrant, high ROI, low effort
- Phase 2 (Core Improvements): optional quadrant, medium priority
- Phase 3 (Strategic Initiatives): strategic or deprioritize quadrant
Return a JSON object: { "assignments": [{ "opportunityId": "...", "phase": 1|2|3, "estimatedWeeks": number, "requiredRoles": ["role1","role2"] }] }`,
            },
            {
              role: "user",
              content: JSON.stringify(
                opportunitiesWithWorkflows.map((o) => ({
                  id: o.id,
                  title: o.title,
                  quadrant: o.quadrant,
                  roiScore: o.roiScore,
                  effortScore: o.effortScore,
                  impactScore: o.impactScore,
                }))
              ),
            },
          ],
          response_format: { type: "json_object" },
        })
        const parsed = JSON.parse(
          response.choices[0]?.message?.content ?? "{}"
        ) as {
          assignments?: Array<{
            opportunityId: string
            phase: number
            estimatedWeeks?: number
            requiredRoles?: string[]
          }>
        }
        if (parsed.assignments) {
          groupedByPhase = new Map()
          for (const a of parsed.assignments) {
            const phase = Math.min(3, Math.max(1, a.phase))
            if (!groupedByPhase.has(phase)) groupedByPhase.set(phase, [])
            const opp = opportunitiesWithWorkflows.find((o) => o.id === a.opportunityId)
            if (opp) groupedByPhase.get(phase)!.push(opp)
          }
        }
      } catch (aiErr) {
        console.warn("OpenAI unavailable, using mock grouping:", aiErr)
      }
    }

    if (groupedByPhase.size === 0) {
      for (const opp of opportunitiesWithWorkflows) {
        const phase =
          opp.quadrant === "quick_win"
            ? 1
            : opp.quadrant === "optional"
              ? 2
              : 3
        if (!groupedByPhase.has(phase)) groupedByPhase.set(phase, [])
        groupedByPhase.get(phase)!.push(opp)
      }
    }

    const oppToPhase = new Map<string, number>()
    for (const [phase, opps] of groupedByPhase) {
      for (const o of opps) oppToPhase.set(o.id, phase)
    }
    for (const opp of opportunitiesWithWorkflows) {
      if (!oppToPhase.has(opp.id)) oppToPhase.set(opp.id, 3)
    }

    const existing = await findFirst("roadmaps", [
      where("workspaceId", "==", workspaceId),
    ])
    if (existing) {
      const existingPhases = await findMany("roadmapPhases", [
        where("roadmapId", "==", existing.id),
      ])
      for (const phase of existingPhases) {
        const items = await findMany("roadmapItems", [where("phaseId", "==", phase.id)])
        for (const item of items) {
          await deleteRecord("roadmapItems", item.id)
        }
        await deleteRecord("roadmapPhases", phase.id)
      }
      await deleteRecord("roadmaps", existing.id)
    }

    const roadmap = await create("roadmaps", {
      workspaceId,
      name: "Implementation Roadmap",
      status: "draft",
    })

    for (const config of PHASE_CONFIG) {
      const phaseOpps = opportunitiesWithWorkflows.filter(
        (o) => oppToPhase.get(o.id) === config.order
      )
      const totalWeeks = phaseOpps.reduce(
        (sum, o) => sum + (o.effortScore ? Math.ceil(2 + o.effortScore * 4) : 2),
        0
      )
      const phase = await create("roadmapPhases", {
        roadmapId: roadmap.id,
        name: config.name,
        order: config.order,
        startWeek: 1,
        durationWeeks: totalWeeks || 2,
        description: `${config.name} phase`,
      })

      for (const opp of phaseOpps) {
        const weeks = opp.effortScore ? Math.ceil(2 + opp.effortScore * 4) : 2
        const roles = opp.implementationApproach
          ? ["Engineer", "Product"]
          : ["Engineer"]
        await create("roadmapItems", {
          phaseId: phase.id,
          opportunityId: opp.id,
          estimatedWeeks: weeks,
          requiredRoles: roles,
        })
      }
    }

    revalidatePath("/roadmap")
    revalidatePath("/budget")
    return { success: true, id: roadmap.id }
  } catch (err) {
    console.error("generateRoadmap:", err)
    return { success: false, error: String(err) }
  }
}

export async function getBudgetEstimates(workspaceId: string) {
  try {
    const estimates = await findMany("budgetEstimates", [
      where("workspaceId", "==", workspaceId),
    ])
    estimates.sort((a: any, b: any) => {
      const catCmp = (a.category ?? "").localeCompare(b.category ?? "")
      if (catCmp !== 0) return catCmp
      return (a.itemName || "").localeCompare(b.itemName || "")
    })
    return toPlain(estimates)
  } catch (err) {
    console.error("getBudgetEstimates:", err)
    return []
  }
}

export async function generateBudgetEstimates(workspaceId: string) {
  try {
    const [opportunities, roadmaps] = await Promise.all([
      findMany("opportunities", [where("workspaceId", "==", workspaceId)]),
      findMany("roadmaps", [where("workspaceId", "==", workspaceId)]),
    ])

    const opportunitiesWithWorkflows = await Promise.all(
      opportunities.map(async (opp: any) => {
        const workflow = opp.workflowId
          ? await findUnique("workflows", opp.workflowId)
          : null
        return { ...opp, workflow: workflow ? { name: workflow.name } : null }
      })
    )

    const existing = await findMany("budgetEstimates", [
      where("workspaceId", "==", workspaceId),
    ])
    for (const est of existing) {
      await deleteRecord("budgetEstimates", est.id)
    }

    const estimates: Array<{
      category: string
      itemName: string
      oneTimeCost: number | null
      recurringMonthlyCost: number | null
      notes: string | null
    }> = []

    if (opportunitiesWithWorkflows.length > 0) {
      const avgScore =
        opportunitiesWithWorkflows.reduce((s, o) => s + (o.roiScore ?? 0), 0) /
        opportunitiesWithWorkflows.length
      const scale = Math.min(1.5, Math.max(0.5, avgScore))

      estimates.push(
        {
          category: "SaaS Tools",
          itemName: "Automation platform subscription",
          oneTimeCost: 0,
          recurringMonthlyCost: Math.round(150 * scale),
          notes: "Based on opportunity count",
        },
        {
          category: "SaaS Tools",
          itemName: "Integration tools",
          oneTimeCost: 0,
          recurringMonthlyCost: Math.round(80 * scale),
          notes: null,
        },
        {
          category: "Engineering",
          itemName: "Implementation development",
          oneTimeCost: Math.round(5000 * scale * opportunitiesWithWorkflows.length * 0.3),
          recurringMonthlyCost: 0,
          notes: `${opportunitiesWithWorkflows.length} opportunities`,
        },
        {
          category: "Engineering",
          itemName: "Technical setup",
          oneTimeCost: Math.round(2000 * scale),
          recurringMonthlyCost: 0,
          notes: null,
        },
        {
          category: "Agency",
          itemName: "Consulting & design",
          oneTimeCost: Math.round(3000 * scale),
          recurringMonthlyCost: 0,
          notes: "Optional",
        },
        {
          category: "Maintenance",
          itemName: "Ongoing support",
          oneTimeCost: 0,
          recurringMonthlyCost: Math.round(200 * scale),
          notes: null,
        }
      )
    } else {
      estimates.push(
        { category: "SaaS Tools", itemName: "Automation platform", oneTimeCost: 0, recurringMonthlyCost: 150, notes: "Placeholder" },
        { category: "Engineering", itemName: "Implementation", oneTimeCost: 5000, recurringMonthlyCost: 0, notes: "Placeholder" },
        { category: "Agency", itemName: "Consulting", oneTimeCost: 3000, recurringMonthlyCost: 0, notes: "Placeholder" },
        { category: "Maintenance", itemName: "Support", oneTimeCost: 0, recurringMonthlyCost: 200, notes: "Placeholder" }
      )
    }

    const roadmap = roadmaps.length > 0 ? roadmaps[0] : null
    for (const e of estimates) {
      await create("budgetEstimates", {
        workspaceId,
        roadmapId: roadmap?.id ?? null,
        category: e.category,
        itemName: e.itemName,
        oneTimeCost: e.oneTimeCost,
        recurringMonthlyCost: e.recurringMonthlyCost,
        notes: e.notes,
      })
    }

    revalidatePath("/budget")
    return { success: true }
  } catch (err) {
    console.error("generateBudgetEstimates:", err)
    return { success: false, error: String(err) }
  }
}
