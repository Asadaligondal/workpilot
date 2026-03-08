/**
 * AI Analysis Engine - Type definitions for the 6-stage pipeline
 */

// ─── Workflow Categories (Stage B) ───────────────────────────────────────────
export type WorkflowCategory =
  | "sales"
  | "support"
  | "finance"
  | "hiring"
  | "scheduling"
  | "reporting"
  | "fulfillment"
  | "compliance"
  | "document_processing"

// ─── Step Candidate Flags (Stage C) ───────────────────────────────────────────
export interface StepCandidateFlags {
  repetitive: boolean
  rules_based: boolean
  document_heavy: boolean
  delay_prone: boolean
  data_entry: boolean
  approval_heavy: boolean
  communication_heavy: boolean
  knowledge_heavy: boolean
}

// ─── Intervention Types (Stage D) ────────────────────────────────────────────
export type InterventionType =
  | "no_change"
  | "optimize_manually"
  | "automate_with_rules"
  | "augment_with_ai"
  | "replace_tool"
  | "build_custom_app"

// ─── Quadrant (Stage E) ───────────────────────────────────────────────────────
export type QuadrantType = "quick_win" | "strategic" | "optional" | "deprioritize"

// ─── Stage A Output: Normalized Entities ────────────────────────────────────
export interface NormalizedEntities {
  departments: string[]
  roles: string[]
  tools: string[]
  steps: Array<{ workflowId: string; stepId: string; name: string; description?: string }>
  bottlenecks: Array<{ workflowId: string; stepId?: string; description: string }>
  kpis: string[]
}

// ─── Stage B Output: Classified Workflows ────────────────────────────────────
export interface ClassifiedWorkflow {
  workflowId: string
  categories: WorkflowCategory[]
  primaryCategory: WorkflowCategory
}

// ─── Stage C Output: Step Candidates ─────────────────────────────────────────
export interface StepCandidate {
  workflowId: string
  stepId: string
  flags: StepCandidateFlags
}

// ─── Stage D Output: Intervention Decision ──────────────────────────────────
export interface InterventionDecision {
  workflowId: string
  intervention: InterventionType
  rationale: string
}

// ─── Stage E Output: Scores ──────────────────────────────────────────────────
export interface WorkflowScores {
  workflowId: string
  automationScore: number
  complexityScore: number
  impactScore: number
  effortScore: number
  costScore: number
  urgencyScore: number
  roiScore: number
  confidenceScore: number
  quadrant: QuadrantType
  /** Raw factors used in automationScore formula */
  factors: {
    repetition: number
    timeWaste: number
    errorRisk: number
    dataStructure: number
    toolFragmentation: number
    roi: number
  }
}

// ─── Stage F Output: Package ─────────────────────────────────────────────────
export interface PackageOutput {
  executiveSummary: string
  perOpportunityRecommendations: Array<{
    workflowId: string
    recommendation: string
  }>
  roadmapSuggestions: string[]
  budgetRanges: {
    low: string
    mid: string
    high: string
  }
}

// ─── Pipeline Input (from DB) ────────────────────────────────────────────────
export interface PipelineInput {
  businessProfile: {
    companyName?: string | null
    industry?: string | null
    subIndustry?: string | null
    teamSize?: string | null
    growthStage?: string | null
    mainPainPoints?: unknown
    goals?: unknown
    constraints?: unknown
  } | null
  workflows: Array<{
    id: string
    name: string
    description?: string | null
    trigger?: string | null
    frequency?: string | null
    departmentName?: string | null
    steps: Array<{
      id: string
      name: string
      description?: string | null
      actorRole?: string | null
      toolUsed?: string | null
      timeMinutes?: number | null
      isManual?: boolean
      isBottleneck?: boolean
    }>
    painPoints: Array<{ type: string; severity: string; description?: string | null }>
  }>
}

export interface BusinessProfileInput {
  companyName?: string | null
  website?: string | null
  industry?: string | null
  subIndustry?: string | null
  teamSize?: string | null
  growthStage?: string | null
  mainPainPoints?: unknown
  goals?: unknown
  operatingHours?: string | null
  locations?: unknown
  constraints?: unknown
}

export interface WorkflowStepInput {
  id: string
  order: number
  name: string
  description?: string | null
  actorRole?: { title: string } | null
  toolUsed?: string | null
  inputType?: string | null
  outputType?: string | null
  timeMinutes?: number | null
  isManual?: boolean
  isBottleneck?: boolean
}

export interface WorkflowInput {
  id: string
  name: string
  description?: string | null
  trigger?: string | null
  frequency?: string | null
  department?: { name: string } | null
  steps: WorkflowStepInput[]
  painPoints?: Array<{ type: string; severity: string; description?: string | null }>
}

// ─── Full Analysis Result ────────────────────────────────────────────────────
export interface AnalysisResult {
  workspaceId: string
  normalized: NormalizedEntities
  classified: ClassifiedWorkflow[]
  candidates: StepCandidate[]
  interventions: InterventionDecision[]
  scores: WorkflowScores[]
  package: PackageOutput
  opportunities: OpportunityOutput[]
  tokenUsage?: { prompt: number; completion: number; total: number }
}

// ─── Opportunity Output (for DB) ─────────────────────────────────────────────
export interface OpportunityOutput {
  workflowId: string
  type: "AUTOMATE" | "AUGMENT" | "OPTIMIZE" | "NO_CHANGE"
  title: string
  currentState?: string
  recommendedState?: string
  toolingSuggestion?: string
  implementationApproach?: string
  expectedImpact?: string
  risks?: string
  technicalNotes?: string
  confidenceScore?: number
  impactScore?: number
  effortScore?: number
  costScore?: number
  urgencyScore?: number
  roiScore?: number
  automationScore?: number
  complexityScore?: number
  quadrant?: string
}
