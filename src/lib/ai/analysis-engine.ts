import OpenAI from "openai"
import { z } from "zod"
import type { AnalysisResult, OpportunityOutput, PipelineInput } from "./types"
import {
  STAGE_A_PROMPT,
  STAGE_B_PROMPT,
  STAGE_C_PROMPT,
  STAGE_D_PROMPT,
  STAGE_E_PROMPT,
  STAGE_F_PROMPT,
} from "./prompts"

const StageASchema = z.object({
  departments: z.array(z.object({ id: z.string(), name: z.string() })),
  roles: z.array(z.object({ id: z.string(), title: z.string(), departmentId: z.string() })),
  tools: z.array(z.object({ id: z.string(), name: z.string(), category: z.string().optional() })),
  steps: z.array(
    z.object({
      id: z.string(),
      workflowId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      toolUsed: z.string().optional(),
      timeMinutes: z.number().optional(),
      isManual: z.boolean().optional(),
    })
  ),
  bottlenecks: z.array(
    z.object({ stepId: z.string(), description: z.string(), severity: z.string() })
  ),
  kpis: z.array(z.object({ name: z.string(), metric: z.string().optional() })),
})

const StageBSchema = z.object({
  workflows: z.array(
    z.object({
      workflowId: z.string(),
      categories: z.array(
        z.enum([
          "sales",
          "support",
          "finance",
          "hiring",
          "scheduling",
          "reporting",
          "fulfillment",
          "compliance",
          "document_processing",
        ])
      ),
    })
  ),
})

const StageCSchema = z.object({
  workflows: z.array(
    z.object({
      workflowId: z.string(),
      steps: z.array(
        z.object({
          stepId: z.string(),
          repetitive: z.boolean(),
          rules_based: z.boolean(),
          document_heavy: z.boolean(),
          delay_prone: z.boolean(),
          data_entry: z.boolean(),
          approval_heavy: z.boolean(),
          communication_heavy: z.boolean(),
          knowledge_heavy: z.boolean(),
        })
      ),
    })
  ),
})

const StageDSchema = z.object({
  workflows: z.array(
    z.object({
      workflowId: z.string(),
      intervention: z.enum([
        "no_change",
        "optimize_manually",
        "automate_with_rules",
        "augment_with_ai",
        "replace_tool",
        "build_custom_app",
      ]),
      rationale: z.string().optional(),
    })
  ),
})

const StageESchema = z.object({
  opportunities: z.array(
    z.object({
      workflowId: z.string(),
      repetition: z.number(),
      timeWaste: z.number(),
      errorRisk: z.number(),
      dataStructure: z.number(),
      toolFragmentation: z.number(),
      roi: z.number(),
      automationScore: z.number(),
      complexityScore: z.number(),
      impactScore: z.number(),
      effortScore: z.number(),
      costScore: z.number(),
      urgencyScore: z.number(),
      roiScore: z.number(),
      confidenceScore: z.number(),
      quadrant: z.enum(["quick_win", "strategic", "optional", "deprioritize"]),
    })
  ),
})

const StageFSchema = z.object({
  executiveSummary: z.string(),
  recommendations: z.array(
    z.object({
      workflowId: z.string(),
      recommendation: z.string(),
    })
  ),
  roadmapSuggestions: z.array(z.string()),
  budgetRanges: z.object({
    low: z.string(),
    medium: z.string(),
    high: z.string(),
  }),
})

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key || key.trim() === "") return null
  return new OpenAI({ apiKey: key })
}

function createMockResult(workspaceId: string, workflowIds: string[]): AnalysisResult {
  const opportunities: OpportunityOutput[] = workflowIds.map((workflowId, i) => ({
    workflowId,
    type: (["AUTOMATE", "AUGMENT", "OPTIMIZE", "NO_CHANGE"] as const)[i % 4],
    title: `Opportunity ${i + 1}: Workflow improvement`,
    currentState: "Manual process with multiple steps",
    recommendedState: "Streamlined automated workflow",
    toolingSuggestion: "Consider workflow automation tools",
    implementationApproach: "Phase 1: Document current state. Phase 2: Pilot automation.",
    expectedImpact: "Reduce manual effort by 30-50%",
    risks: "Change management, training required",
    technicalNotes: "API integrations may be needed",
    confidenceScore: 0.75,
    impactScore: 0.7,
    effortScore: 0.5,
    costScore: 0.6,
    urgencyScore: 0.6,
    roiScore: 0.7,
    automationScore: 0.65,
    complexityScore: 0.5,
    quadrant: (["quick_win", "strategic", "optional", "deprioritize"] as const)[i % 4],
  }))

  return {
    workspaceId,
    normalized: { departments: [], roles: [], tools: [], steps: [], bottlenecks: [], kpis: [] },
    classified: [],
    candidates: [],
    interventions: [],
    scores: [],
    package: {
      executiveSummary: "Demo analysis completed. Set OPENAI_API_KEY to run full AI-powered analysis.",
      perOpportunityRecommendations: [],
      roadmapSuggestions: ["Q1: Pilot 1-2 workflows", "Q2: Scale successful pilots"],
      budgetRanges: { low: "$5K-15K", mid: "$15K-50K", high: "$50K+" },
    },
    opportunities,
    tokenUsage: { prompt: 0, completion: 0, total: 0 },
  }
}

function mapInterventionToType(
  intervention: string
): "AUTOMATE" | "AUGMENT" | "OPTIMIZE" | "NO_CHANGE" {
  switch (intervention) {
    case "automate_with_rules":
    case "build_custom_app":
      return "AUTOMATE"
    case "augment_with_ai":
      return "AUGMENT"
    case "optimize_manually":
    case "replace_tool":
      return "OPTIMIZE"
    case "no_change":
    default:
      return "NO_CHANGE"
  }
}

export async function runAnalysisPipeline(workspaceId: string): Promise<AnalysisResult> {
  const startTime = Date.now()
  let totalPromptTokens = 0
  let totalCompletionTokens = 0

  const client = getOpenAIClient()

  const { prisma } = await import("@/lib/prisma")

  const [businessProfile, workflows] = await Promise.all([
    prisma.businessProfile.findUnique({ where: { workspaceId } }),
    prisma.workflow.findMany({
      where: { workspaceId },
      include: {
        steps: { orderBy: { order: "asc" }, include: { actorRole: true } },
        painPoints: true,
        department: true,
      },
    }),
  ])

  const input: PipelineInput = {
    businessProfile: businessProfile
      ? {
          companyName: businessProfile.companyName,
          industry: businessProfile.industry,
          subIndustry: businessProfile.subIndustry,
          teamSize: businessProfile.teamSize,
          growthStage: businessProfile.growthStage,
          mainPainPoints: businessProfile.mainPainPoints as string[] | undefined,
          goals: businessProfile.goals as string[] | undefined,
          constraints: businessProfile.constraints as Record<string, string> | undefined,
        }
      : null,
    workflows: workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      trigger: w.trigger,
      frequency: w.frequency,
      departmentName: w.department?.name,
      steps: w.steps.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        actorRole: s.actorRole?.title,
        toolUsed: s.toolUsed,
        timeMinutes: s.timeMinutes,
        isManual: s.isManual,
        isBottleneck: s.isBottleneck,
      })),
      painPoints: w.painPoints.map((p) => ({
        type: p.type,
        severity: p.severity,
        description: p.description,
      })),
    })),
  }

  const workflowIds = workflows.map((w) => w.id)
  if (workflowIds.length === 0) {
    return createMockResult(workspaceId, [])
  }

  if (!client) {
    return createMockResult(workspaceId, workflowIds)
  }

  try {
    const inputJson = JSON.stringify(input, null, 2)

    const stageAPrompt = STAGE_A_PROMPT(inputJson)
    const stageARes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: stageAPrompt }],
      response_format: { type: "json_object" },
    })
    const stageAUsage = stageARes.usage
    if (stageAUsage) {
      totalPromptTokens += stageAUsage.prompt_tokens
      totalCompletionTokens += stageAUsage.completion_tokens
    }
    const stageAContent = stageARes.choices[0]?.message?.content
    if (!stageAContent) throw new Error("Stage A: Empty response")
    const stageAParsed = StageASchema.parse(JSON.parse(stageAContent))

    const stageBPrompt = STAGE_B_PROMPT(JSON.stringify(stageAParsed, null, 2))
    const stageBRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: stageBPrompt }],
      response_format: { type: "json_object" },
    })
    const stageBUsage = stageBRes.usage
    if (stageBUsage) {
      totalPromptTokens += stageBUsage.prompt_tokens
      totalCompletionTokens += stageBUsage.completion_tokens
    }
    const stageBContent = stageBRes.choices[0]?.message?.content
    if (!stageBContent) throw new Error("Stage B: Empty response")
    const stageBParsed = StageBSchema.parse(JSON.parse(stageBContent))

    const stageCPrompt = STAGE_C_PROMPT(
      JSON.stringify(stageAParsed, null, 2),
      JSON.stringify(stageBParsed, null, 2)
    )
    const stageCRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: stageCPrompt }],
      response_format: { type: "json_object" },
    })
    const stageCUsage = stageCRes.usage
    if (stageCUsage) {
      totalPromptTokens += stageCUsage.prompt_tokens
      totalCompletionTokens += stageCUsage.completion_tokens
    }
    const stageCContent = stageCRes.choices[0]?.message?.content
    if (!stageCContent) throw new Error("Stage C: Empty response")
    const stageCParsed = StageCSchema.parse(JSON.parse(stageCContent))

    const stageDPrompt = STAGE_D_PROMPT(
      JSON.stringify(stageAParsed, null, 2),
      JSON.stringify(stageCParsed, null, 2)
    )
    const stageDRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: stageDPrompt }],
      response_format: { type: "json_object" },
    })
    const stageDUsage = stageDRes.usage
    if (stageDUsage) {
      totalPromptTokens += stageDUsage.prompt_tokens
      totalCompletionTokens += stageDUsage.completion_tokens
    }
    const stageDContent = stageDRes.choices[0]?.message?.content
    if (!stageDContent) throw new Error("Stage D: Empty response")
    const stageDParsed = StageDSchema.parse(JSON.parse(stageDContent))

    const stageEInput = {
      normalized: stageAParsed,
      classified: stageBParsed,
      candidates: stageCParsed,
      interventions: stageDParsed,
    }
    const stageEPrompt = STAGE_E_PROMPT(JSON.stringify(stageEInput, null, 2))
    const stageERes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: stageEPrompt }],
      response_format: { type: "json_object" },
    })
    const stageEUsage = stageERes.usage
    if (stageEUsage) {
      totalPromptTokens += stageEUsage.prompt_tokens
      totalCompletionTokens += stageEUsage.completion_tokens
    }
    const stageEContent = stageERes.choices[0]?.message?.content
    if (!stageEContent) throw new Error("Stage E: Empty response")
    const stageEParsed = StageESchema.parse(JSON.parse(stageEContent))

    const stageFInput = {
      normalized: stageAParsed,
      interventions: stageDParsed,
      scores: stageEParsed,
    }
    const stageFPrompt = STAGE_F_PROMPT(JSON.stringify(stageFInput, null, 2))
    const stageFRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: stageFPrompt }],
      response_format: { type: "json_object" },
    })
    const stageFUsage = stageFRes.usage
    if (stageFUsage) {
      totalPromptTokens += stageFUsage.prompt_tokens
      totalCompletionTokens += stageFUsage.completion_tokens
    }
    const stageFContent = stageFRes.choices[0]?.message?.content
    if (!stageFContent) throw new Error("Stage F: Empty response")
    const stageFParsed = StageFSchema.parse(JSON.parse(stageFContent))

    const interventionMap = new Map(
      stageDParsed.workflows.map((w) => [w.workflowId, w.intervention])
    )
    const scoreMap = new Map(
      stageEParsed.opportunities.map((o) => [o.workflowId, o])
    )
    const recMap = new Map(
      stageFParsed.recommendations.map((r) => [r.workflowId, r.recommendation])
    )

    const workflowNameMap = new Map(workflows.map((w) => [w.id, w.name]))

    const opportunities: AnalysisResult["opportunities"] = workflowIds.map((workflowId) => {
      const intervention = interventionMap.get(workflowId) ?? "no_change"
      const scores = scoreMap.get(workflowId)
      const recommendation = recMap.get(workflowId) ?? ""
      const workflowName = workflowNameMap.get(workflowId) ?? "Workflow"

      return {
        workflowId,
        type: mapInterventionToType(intervention),
        title: `${workflowName}: ${intervention.replace(/_/g, " ")}`,
        currentState: "As documented in workflow",
        recommendedState: recommendation ? recommendation.slice(0, 500) : undefined,
        toolingSuggestion: undefined,
        implementationApproach: undefined,
        expectedImpact: undefined,
        risks: undefined,
        technicalNotes: undefined,
        confidenceScore: scores?.confidenceScore,
        impactScore: scores?.impactScore,
        effortScore: scores?.effortScore,
        costScore: scores?.costScore,
        urgencyScore: scores?.urgencyScore,
        roiScore: scores?.roiScore,
        automationScore: scores?.automationScore,
        complexityScore: scores?.complexityScore,
        quadrant: scores?.quadrant,
      }
    })

    const budgetRanges = {
      low: stageFParsed.budgetRanges.low ?? stageFParsed.budgetRanges.quickWins ?? "$5K-15K",
      mid: stageFParsed.budgetRanges.medium ?? stageFParsed.budgetRanges.strategic ?? "$15K-50K",
      high: stageFParsed.budgetRanges.high ?? stageFParsed.budgetRanges.optional ?? "$50K+",
    }

    return {
      workspaceId,
      normalized: { departments: [], roles: [], tools: [], steps: [], bottlenecks: [], kpis: [] },
      classified: [],
      candidates: [],
      interventions: [],
      scores: [],
      package: {
        executiveSummary: stageFParsed.executiveSummary,
        perOpportunityRecommendations: stageFParsed.recommendations.map((r) => ({
          workflowId: r.workflowId,
          recommendation: r.recommendation,
        })),
        roadmapSuggestions: stageFParsed.roadmapSuggestions,
        budgetRanges,
      },
      opportunities: opportunities.map((o) => ({
        workflowId: o.workflowId,
        type: o.type,
        title: o.title,
        currentState: o.currentState,
        recommendedState: o.recommendedState,
        toolingSuggestion: o.toolingSuggestion,
        implementationApproach: o.implementationApproach,
        expectedImpact: o.expectedImpact,
        risks: o.risks,
        technicalNotes: o.technicalNotes,
        confidenceScore: o.confidenceScore,
        impactScore: o.impactScore,
        effortScore: o.effortScore,
        costScore: o.costScore,
        urgencyScore: o.urgencyScore,
        roiScore: o.roiScore,
        automationScore: o.automationScore,
        complexityScore: o.complexityScore,
        quadrant: o.quadrant,
      })),
      tokenUsage: {
        prompt: totalPromptTokens,
        completion: totalCompletionTokens,
        total: totalPromptTokens + totalCompletionTokens,
      },
    }
  } catch (err) {
    console.error("runAnalysisPipeline:", err)
    return createMockResult(workspaceId, workflowIds)
  }
}
