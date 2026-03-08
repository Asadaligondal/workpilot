/**
 * Prompts for the WorkPilot AI Analysis Pipeline
 * Each stage has a detailed prompt with examples for structured extraction.
 */

// ─── Stage A: Normalize ────────────────────────────────────────

export const STAGE_A_NORMALIZE_SYSTEM = `You are a business process analyst. Extract structured entities from business profile and workflow data.
Output valid JSON only. Be precise and comprehensive.`;

export const STAGE_A_NORMALIZE_USER = (profileJson: string, workflowsJson: string) => `
Extract structured entities from the following business profile and workflow data.

## Business Profile
${profileJson}

## Workflows
${workflowsJson}

## Output JSON Schema
Return a single JSON object with these keys:
- departments: array of { id, name, headCount?, manager? }
- roles: array of { id, departmentId, title, responsibilities?, toolsUsed? }
- tools: array of { name, category?, monthlyBudget?, satisfaction? }
- steps: array of { id, workflowId, order, name, description?, actorRoleId?, toolUsed?, inputType?, outputType?, timeMinutes?, isManual?, isBottleneck? }
- bottlenecks: array of { stepId, workflowId, description, severity }
- kpis: array of { name, metric, target?, unit }

Example output structure:
{
  "departments": [{"id": "dept1", "name": "Sales", "headCount": 5, "manager": "Jane Doe"}],
  "roles": [{"id": "role1", "departmentId": "dept1", "title": "Account Executive", "responsibilities": "Lead qualification"}],
  "tools": [{"name": "Salesforce", "category": "CRM", "monthlyBudget": 150}],
  "steps": [{"id": "step1", "workflowId": "wf1", "order": 0, "name": "Qualify lead", "isManual": true, "isBottleneck": false}],
  "bottlenecks": [{"stepId": "step2", "workflowId": "wf1", "description": "Manual data entry delays", "severity": "high"}],
  "kpis": [{"name": "Lead response time", "metric": "hours", "target": 4, "unit": "hours"}]
}
`;

// ─── Stage B: Classify ──────────────────────────────────────────

export const STAGE_B_CLASSIFY_SYSTEM = `You are a workflow classifier. Tag each workflow with one or more categories.
Categories: sales, support, finance, hiring, scheduling, reporting, fulfillment, compliance, document_processing.
Output valid JSON only.`;

export const STAGE_B_CLASSIFY_USER = (normalizedJson: string) => `
Classify each workflow in the normalized data. Assign one primary category and optionally secondary categories.

## Normalized Data
${normalizedJson}

## Output JSON Schema
Return a single JSON object:
- workflows: array of { workflowId, primaryCategory, secondaryCategories[] }

Categories (pick from): sales, support, finance, hiring, scheduling, reporting, fulfillment, compliance, document_processing

Example:
{
  "workflows": [
    {"workflowId": "wf1", "primaryCategory": "sales", "secondaryCategories": ["document_processing"]},
    {"workflowId": "wf2", "primaryCategory": "support", "secondaryCategories": []}
  ]
}
`;

// ─── Stage C: Detect Candidates ─────────────────────────────────

export const STAGE_C_DETECT_SYSTEM = `You are an automation opportunity detector. For each workflow step, evaluate boolean flags indicating automation potential.
Output valid JSON only. Be conservative: only set true when clearly applicable.`;

export const STAGE_C_DETECT_USER = (normalizedJson: string, classifiedJson: string) => `
For each workflow step, evaluate these boolean flags:
- repetitive: Step is repeated frequently with similar inputs
- rules_based: Step follows clear, deterministic rules
- document_heavy: Step involves reading/writing/processing documents
- delay_prone: Step causes or is subject to delays
- data_entry: Step involves manual data entry
- approval_heavy: Step involves multiple approvals or sign-offs
- communication_heavy: Step involves emails, calls, or messaging
- knowledge_heavy: Step requires expert knowledge or judgment

## Normalized Data
${normalizedJson}

## Classified Workflows
${classifiedJson}

## Output JSON Schema
Return a single JSON object:
- steps: array of { stepId, workflowId, repetitive, rules_based, document_heavy, delay_prone, data_entry, approval_heavy, communication_heavy, knowledge_heavy }

Example:
{
  "steps": [
    {"stepId": "step1", "workflowId": "wf1", "repetitive": true, "rules_based": true, "document_heavy": false, "delay_prone": true, "data_entry": true, "approval_heavy": false, "communication_heavy": false, "knowledge_heavy": false}
  ]
}
`;

// ─── Stage D: Decide Intervention ──────────────────────────────

export const STAGE_D_DECIDE_SYSTEM = `You are an automation strategist. For each workflow, decide the best intervention type.
Options: no_change, optimize_manually, automate_with_rules, augment_with_ai, replace_tool, build_custom_app.
Output valid JSON only.`;

export const STAGE_D_DECIDE_USER = (candidatesJson: string) => `
For each workflow, decide the best intervention:
- no_change: Workflow is efficient; no action needed
- optimize_manually: Improve process design without automation
- automate_with_rules: Use rules-based automation (workflows, RPA)
- augment_with_ai: Add AI assistance (chatbots, document extraction)
- replace_tool: Replace fragmented tools with better solution
- build_custom_app: Build custom application for unique needs

## Candidate Detection Results
${candidatesJson}

## Output JSON Schema
Return a single JSON object:
- workflows: array of { workflowId, intervention, rationale }

Example:
{
  "workflows": [
    {"workflowId": "wf1", "intervention": "automate_with_rules", "rationale": "Highly repetitive data entry with clear rules"}
  ]
}
`;

// ─── Stage E: Score ─────────────────────────────────────────────

export const STAGE_E_SCORE_SYSTEM = `You are a business analyst. Compute numeric scores (0-1) for each workflow opportunity.
Output valid JSON only. Scores must be between 0 and 1.`;

export const STAGE_E_SCORE_USER = (decisionsJson: string) => `
For each workflow with intervention other than no_change, compute these scores (0-1 scale):
- repetition: How repetitive is the work?
- timeWaste: How much time is wasted on manual tasks?
- errorRisk: How high is the risk of human error?
- dataStructure: How well-structured is the data?
- toolFragmentation: How fragmented are the tools?
- roi: Expected return on investment

Also compute:
- complexityScore: Technical complexity (0=simple, 1=complex)
- impactScore: Business impact (0=low, 1=high)
- effortScore: Implementation effort (0=low, 1=high)
- costScore: Cost to implement (0=low, 1=high)
- urgencyScore: How urgent is the change? (0=low, 1=high)
- roiScore: ROI potential (0=low, 1=high)
- confidenceScore: Confidence in recommendation (0=low, 1=high)

Determine quadrant:
- quick_win: High impact, low effort
- strategic: High impact, high effort
- optional: Low impact, low effort
- deprioritize: Low impact, high effort

## Decision Results
${decisionsJson}

## Output JSON Schema
Return a single JSON object:
- opportunities: array of { workflowId, repetition, timeWaste, errorRisk, dataStructure, toolFragmentation, roi, automationScore, complexityScore, impactScore, effortScore, costScore, urgencyScore, roiScore, confidenceScore, quadrant }
Compute automationScore = (repetition * 0.2) + (timeWaste * 0.2) + (errorRisk * 0.15) + (dataStructure * 0.15) + (toolFragmentation * 0.1) + (roi * 0.2)

Example:
{
  "opportunities": [
    {"workflowId": "wf1", "repetition": 0.9, "timeWaste": 0.8, "errorRisk": 0.7, "dataStructure": 0.85, "toolFragmentation": 0.6, "roi": 0.9, "automationScore": 0.72, "complexityScore": 0.3, "impactScore": 0.85, "effortScore": 0.2, "costScore": 0.15, "urgencyScore": 0.7, "roiScore": 0.9, "confidenceScore": 0.85, "quadrant": "quick_win"}
  ]
}
`;

// ─── Stage F: Package ───────────────────────────────────────────

export const STAGE_F_PACKAGE_SYSTEM = `You are an executive advisor. Generate executive summary, per-opportunity recommendations, roadmap suggestions, and budget ranges.
Output valid JSON only. Be concise and actionable.`;

export const STAGE_F_PACKAGE_USER = (scoredJson: string) => `
Generate final packaged output for the scored opportunities.

## Scored Workflows
${scoredJson}

## Output JSON Schema
Return a single JSON object:
- executiveSummary: string (2-4 paragraphs summarizing findings)
- recommendations: array of { workflowId, recommendation }
- roadmapSuggestions: array of string (phased implementation suggestions)
- budgetRanges: { low: string, medium: string, high: string } OR { quickWins: string, strategic: string, optional: string }

Example:
{
  "executiveSummary": "Analysis identified 5 automation opportunities across sales and support. Three are quick wins with high ROI...",
  "recommendations": [
    {"workflowId": "wf1", "recommendation": "Implement RPA for lead data entry. Expected impact: Save 15 hrs/week. Risks: Integration complexity."}
  ],
  "roadmapSuggestions": ["Phase 1: Quick wins (4-6 weeks)", "Phase 2: Strategic initiatives (3-6 months)"],
  "budgetRanges": {"low": "$5K-$15K", "medium": "$15K-$50K", "high": "$50K+"}
}
`;

// Pipeline prompt functions (used by analysis-engine)
export function STAGE_A_PROMPT(inputJson: string): string {
  return `${STAGE_A_NORMALIZE_SYSTEM}\n\nExtract structured entities from the following. Return valid JSON only.\n\n## Input\n${inputJson}\n\n## Output: departments, roles, tools, steps, bottlenecks, kpis`;
}
export function STAGE_B_PROMPT(normalizedJson: string): string {
  return `${STAGE_B_CLASSIFY_SYSTEM}\n\n${STAGE_B_CLASSIFY_USER(normalizedJson)}`;
}
export function STAGE_C_PROMPT(normalizedJson: string, classifiedJson: string): string {
  return `${STAGE_C_DETECT_SYSTEM}\n\n${STAGE_C_DETECT_USER(normalizedJson, classifiedJson)}`;
}
export function STAGE_D_PROMPT(normalizedJson: string, candidatesJson: string): string {
  return `${STAGE_D_DECIDE_SYSTEM}\n\nNormalized: ${normalizedJson}\n\nCandidates: ${candidatesJson}\n\nOutput: workflows array with workflowId, intervention, rationale`;
}
export function STAGE_E_PROMPT(inputJson: string): string {
  return `${STAGE_E_SCORE_SYSTEM}\n\n${STAGE_E_SCORE_USER(inputJson)}`;
}
export function STAGE_F_PROMPT(inputJson: string): string {
  return `${STAGE_F_PACKAGE_SYSTEM}\n\n${STAGE_F_PACKAGE_USER(inputJson)}`;
}
