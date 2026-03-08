"use server"

import { prisma } from "@/lib/prisma"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { revalidatePath } from "next/cache"
import OpenAI from "openai"

const PHASE_CONFIG = [
  { name: "Quick Wins", order: 1, quadrants: ["quick_win"] },
  { name: "Core Improvements", order: 2, quadrants: ["optional"] },
  { name: "Strategic Initiatives", order: 3, quadrants: ["strategic", "deprioritize"] },
] as const

export async function getRoadmap(workspaceId: string) {
  try {
    const roadmap = await prisma.roadmap.findFirst({
      where: { workspaceId },
      include: {
        phases: {
          orderBy: { order: "asc" },
          include: {
            items: {
              include: {
                opportunity: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })
    return roadmap
  } catch (err) {
    console.error("getRoadmap:", err)
    return null
  }
}

export async function generateRoadmap(workspaceId: string) {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { workspaceId },
      include: { workflow: { select: { name: true } } },
      orderBy: [
        { roiScore: "desc" },
        { impactScore: "desc" },
        { effortScore: "asc" },
      ],
    })

    if (opportunities.length === 0) {
      return { success: false, error: "No opportunities found. Run an AI analysis first." }
    }

    let groupedByPhase: Map<number, typeof opportunities> = new Map()
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
                opportunities.map((o) => ({
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
            const opp = opportunities.find((o) => o.id === a.opportunityId)
            if (opp) groupedByPhase.get(phase)!.push(opp)
          }
        }
      } catch (aiErr) {
        console.warn("OpenAI unavailable, using mock grouping:", aiErr)
      }
    }

    if (groupedByPhase.size === 0) {
      for (const opp of opportunities) {
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
    for (const opp of opportunities) {
      if (!oppToPhase.has(opp.id)) oppToPhase.set(opp.id, 3)
    }

    const existing = await prisma.roadmap.findFirst({
      where: { workspaceId },
    })
    if (existing) {
      await prisma.roadmapItem.deleteMany({
        where: { phase: { roadmapId: existing.id } },
      })
      await prisma.roadmapPhase.deleteMany({ where: { roadmapId: existing.id } })
      await prisma.roadmap.delete({ where: { id: existing.id } })
    }

    const roadmap = await prisma.roadmap.create({
      data: {
        workspaceId,
        name: "Implementation Roadmap",
        status: "draft",
      },
    })

    for (const config of PHASE_CONFIG) {
      const phaseOpps = opportunities.filter(
        (o) => oppToPhase.get(o.id) === config.order
      )
      const totalWeeks = phaseOpps.reduce(
        (sum, o) => sum + (o.effortScore ? Math.ceil(2 + o.effortScore * 4) : 2),
        0
      )
      const phase = await prisma.roadmapPhase.create({
        data: {
          roadmapId: roadmap.id,
          name: config.name,
          order: config.order,
          startWeek: 1,
          durationWeeks: totalWeeks || 2,
          description: `${config.name} phase`,
        },
      })

      let weekOffset = 0
      for (const opp of phaseOpps) {
        const weeks = opp.effortScore ? Math.ceil(2 + opp.effortScore * 4) : 2
        const roles = opp.implementationApproach
          ? ["Engineer", "Product"]
          : ["Engineer"]
        await prisma.roadmapItem.create({
          data: {
            phaseId: phase.id,
            opportunityId: opp.id,
            estimatedWeeks: weeks,
            requiredRoles: roles,
          },
        })
        weekOffset += weeks
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
    const estimates = await prisma.budgetEstimate.findMany({
      where: { workspaceId },
      orderBy: [{ category: "asc" }, { itemName: "asc" }],
    })
    return estimates
  } catch (err) {
    console.error("getBudgetEstimates:", err)
    return []
  }
}

export async function generateBudgetEstimates(workspaceId: string) {
  try {
    const [opportunities, roadmap] = await Promise.all([
      prisma.opportunity.findMany({
        where: { workspaceId },
        include: { workflow: { select: { name: true } } },
      }),
      prisma.roadmap.findFirst({
        where: { workspaceId },
        orderBy: { updatedAt: "desc" },
      }),
    ])

    const existing = await prisma.budgetEstimate.findMany({
      where: { workspaceId },
    })
    if (existing.length > 0) {
      await prisma.budgetEstimate.deleteMany({ where: { workspaceId } })
    }

    const categories = [
      "SaaS Tools",
      "Engineering",
      "Agency",
      "Maintenance",
    ] as const

    const estimates: Array<{
      category: string
      itemName: string
      oneTimeCost: number | null
      recurringMonthlyCost: number | null
      notes: string | null
    }> = []

    if (opportunities.length > 0) {
      const avgScore =
        opportunities.reduce((s, o) => s + (o.roiScore ?? 0), 0) /
        opportunities.length
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
          oneTimeCost: Math.round(5000 * scale * opportunities.length * 0.3),
          recurringMonthlyCost: 0,
          notes: `${opportunities.length} opportunities`,
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
        {
          category: "SaaS Tools",
          itemName: "Automation platform",
          oneTimeCost: 0,
          recurringMonthlyCost: 150,
          notes: "Placeholder",
        },
        {
          category: "Engineering",
          itemName: "Implementation",
          oneTimeCost: 5000,
          recurringMonthlyCost: 0,
          notes: "Placeholder",
        },
        {
          category: "Agency",
          itemName: "Consulting",
          oneTimeCost: 3000,
          recurringMonthlyCost: 0,
          notes: "Placeholder",
        },
        {
          category: "Maintenance",
          itemName: "Support",
          oneTimeCost: 0,
          recurringMonthlyCost: 200,
          notes: "Placeholder",
        }
      )
    }

    await prisma.budgetEstimate.createMany({
      data: estimates.map((e) => ({
        workspaceId,
        roadmapId: roadmap?.id ?? null,
        category: e.category,
        itemName: e.itemName,
        oneTimeCost: e.oneTimeCost,
        recurringMonthlyCost: e.recurringMonthlyCost,
        notes: e.notes,
      })),
    })

    revalidatePath("/budget")
    return { success: true }
  } catch (err) {
    console.error("generateBudgetEstimates:", err)
    return { success: false, error: String(err) }
  }
}
