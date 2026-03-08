import { PageHeader } from "@/components/page-header"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { getBudgetEstimates } from "../roadmap/actions"
import { getOpportunities } from "../opportunities/actions"
import { BudgetContent } from "./budget-content"

function buildMockEstimates(opportunityCount: number) {
  const scale = Math.min(1.5, Math.max(0.5, opportunityCount * 0.1))
  return [
    { id: "mock-1", category: "SaaS Tools", itemName: "Automation platform", oneTimeCost: 0, recurringMonthlyCost: Math.round(150 * scale), notes: "Mock" },
    { id: "mock-2", category: "SaaS Tools", itemName: "Integration tools", oneTimeCost: 0, recurringMonthlyCost: Math.round(80 * scale), notes: null },
    { id: "mock-3", category: "Engineering", itemName: "Implementation", oneTimeCost: Math.round(5000 * scale * Math.max(1, opportunityCount * 0.3)), recurringMonthlyCost: 0, notes: null },
    { id: "mock-4", category: "Engineering", itemName: "Technical setup", oneTimeCost: Math.round(2000 * scale), recurringMonthlyCost: 0, notes: null },
    { id: "mock-5", category: "Agency", itemName: "Consulting & design", oneTimeCost: Math.round(3000 * scale), recurringMonthlyCost: 0, notes: null },
    { id: "mock-6", category: "Maintenance", itemName: "Ongoing support", oneTimeCost: 0, recurringMonthlyCost: Math.round(200 * scale), notes: null },
  ]
}

export default async function BudgetPage() {
  const workspaceId = await getActiveWorkspaceId()
  const [estimates, opportunities] = workspaceId
    ? await Promise.all([
        getBudgetEstimates(workspaceId),
        getOpportunities(),
      ])
    : [[], []]

  const displayEstimates =
    estimates.length > 0
      ? estimates.map((e) => ({
          id: e.id,
          category: e.category,
          itemName: e.itemName,
          oneTimeCost: e.oneTimeCost,
          recurringMonthlyCost: e.recurringMonthlyCost,
          notes: e.notes,
        }))
      : buildMockEstimates(opportunities.length)

  const displayOpportunities = opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    roiScore: o.roiScore,
    impactScore: o.impactScore,
    effortScore: o.effortScore,
  }))

  return (
    <>
      <PageHeader
        title="Budget & ROI"
        description="Cost estimates and return on investment projections"
      />
      <div className="flex-1 p-6">
        <BudgetContent
          estimates={displayEstimates}
          opportunities={displayOpportunities}
          workspaceId={workspaceId}
          isMockData={estimates.length === 0}
        />
      </div>
    </>
  )
}
