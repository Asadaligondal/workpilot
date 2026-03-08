import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { OpportunityFilters } from "./opportunity-filters"
import { OpportunityGrid } from "./opportunity-grid"
import { getOpportunities } from "./actions"
import { LightbulbIcon } from "lucide-react"

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; quadrant?: string; search?: string; view?: string }>
}) {
  const params = await searchParams
  const filters = {
    type: params.type ?? "all",
    status: params.status ?? "all",
    quadrant: params.quadrant ?? "all",
    search: params.search ?? "",
  }
  const viewMode = (params.view ?? "grid") === "table" ? "table" : "grid"

  let opportunities: Awaited<ReturnType<typeof getOpportunities>> = []
  try {
    opportunities = await getOpportunities(filters)
  } catch {
    opportunities = []
  }

  return (
    <>
      <PageHeader
        title="Opportunities"
        description="Automation, augmentation, and optimization opportunities"
      />
      <div className="flex-1 flex flex-col p-6">
        <div className="mb-4">
          <OpportunityFilters />
        </div>
        {opportunities.length === 0 ? (
          <EmptyState
            icon={<LightbulbIcon className="h-6 w-6" />}
            title="No opportunities yet"
            description="Run an AI analysis on your workflows to discover automation and optimization opportunities."
          />
        ) : (
          <OpportunityGrid opportunities={opportunities} viewMode={viewMode} />
        )}
      </div>
    </>
  )
}
