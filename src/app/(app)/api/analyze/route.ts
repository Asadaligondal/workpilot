import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { runAnalysisPipeline } from "@/lib/ai/analysis-engine"

export async function POST(request: Request) {
  try {
    let body: { workspaceId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    const { workspaceId } = body
    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "workspaceId is required in request body" },
        { status: 400 }
      )
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      )
    }

    const startTime = Date.now()
    const result = await runAnalysisPipeline(workspaceId)
    const latencyMs = Date.now() - startTime

    await prisma.modelRun.create({
      data: {
        workspaceId,
        promptVersion: "v1",
        tokensUsed: result.tokenUsage?.total ?? null,
        latencyMs,
        cost: null,
      },
    })

    for (const opp of result.opportunities) {
      const type = opp.type
      await prisma.opportunity.create({
        data: {
          workspaceId,
          workflowId: opp.workflowId ?? null,
          type: opp.type,
          title: opp.title,
          currentState: opp.currentState ?? null,
          recommendedState: opp.recommendedState ?? null,
          toolingSuggestion: opp.toolingSuggestion ?? null,
          implementationApproach: opp.implementationApproach ?? null,
          expectedImpact: opp.expectedImpact ?? null,
          risks: opp.risks ?? null,
          technicalNotes: opp.technicalNotes ?? null,
          confidenceScore: opp.confidenceScore ?? null,
          impactScore: opp.impactScore ?? null,
          effortScore: opp.effortScore ?? null,
          costScore: opp.costScore ?? null,
          urgencyScore: opp.urgencyScore ?? null,
          roiScore: opp.roiScore ?? null,
          automationScore: opp.automationScore ?? null,
          complexityScore: opp.complexityScore ?? null,
          quadrant: opp.quadrant ?? null,
          status: "NEW",
        },
      })
    }

    return NextResponse.json({
      success: true,
      executiveSummary: result.package.executiveSummary,
      opportunities: result.opportunities,
      roadmapSuggestions: result.package.roadmapSuggestions,
      budgetRanges: result.package.budgetRanges,
      tokenUsage: result.tokenUsage,
      latencyMs,
    })
  } catch (err) {
    console.error("POST /api/analyze:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    )
  }
}
