/**
 * Type definitions
 */

export type ReportType = "EXECUTIVE_SUMMARY" | "FULL_AUDIT" | "TECHNICAL_ANNEX"

export type OpportunityType = "AUTOMATE" | "AUGMENT" | "OPTIMIZE" | "NO_CHANGE"

export type OpportunityStatus = "NEW" | "REVIEWED" | "APPROVED" | "DISMISSED"

export type WorkflowStatus = "DRAFT" | "ANALYZED" | "APPROVED"

export type Report = {
  id: string
  workspaceId: string
  type: ReportType
  format: string
  fileUrl: string | null
  content: Record<string, unknown> | null
  generatedAt: Date | { toDate: () => Date } | { seconds: number; nanoseconds: number }
  createdAt: Date | { toDate: () => Date } | { seconds: number; nanoseconds: number }
}

export type Opportunity = {
  id: string
  workspaceId: string
  workflowId: string | null
  type: OpportunityType
  title: string
  currentState: string | null
  recommendedState: string | null
  toolingSuggestion: string | null
  implementationApproach: string | null
  expectedImpact: string | null
  risks: string | null
  technicalNotes: string | null
  confidenceScore: number | null
  impactScore: number | null
  effortScore: number | null
  costScore: number | null
  urgencyScore: number | null
  roiScore: number | null
  automationScore: number | null
  complexityScore: number | null
  status: OpportunityStatus
  createdAt: Date | { toDate: () => Date } | { seconds: number; nanoseconds: number }
  updatedAt: Date | { toDate: () => Date } | { seconds: number; nanoseconds: number }
}

export type Workflow = {
  id: string
  workspaceId: string
  name: string
  departmentId: string | null
  description: string | null
  trigger: string | null
  frequency: string | null
  status: WorkflowStatus
  automationPotentialScore: number | null
  owner: string | null
  createdAt: Date | { toDate: () => Date } | { seconds: number; nanoseconds: number }
  updatedAt: Date | { toDate: () => Date } | { seconds: number; nanoseconds: number }
}
