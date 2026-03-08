import { notFound } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getOpportunity, approveOpportunity, dismissOpportunity } from "../actions"
import { OpportunityDetailClient } from "./opportunity-detail-client"
import { CheckIcon, XIcon, MapPinIcon, GitBranchIcon } from "lucide-react"
import type { OpportunityStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

const typeBadgeClass: Record<string, string> = {
  AUTOMATE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  AUGMENT: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  OPTIMIZE: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  NO_CHANGE: "bg-muted text-muted-foreground",
}

function ScoreBar({
  label,
  value,
  className,
}: {
  label: string
  value: number | null
  className?: string
}) {
  const pct = value != null ? Math.round(value * 100) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", className)}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  )
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let opportunity: Awaited<ReturnType<typeof getOpportunity>> = null

  try {
    opportunity = await getOpportunity(id)
  } catch (err) {
    console.error("Opportunity detail load:", err)
  }

  if (!opportunity) notFound()

  const confidence = opportunity.confidenceScore != null
    ? Math.round(opportunity.confidenceScore * 100)
    : 0

  return (
    <>
      <PageHeader
        title={opportunity.title}
        description={opportunity.workflow?.name}
        actions={
          <div className="flex items-center gap-2">
            <form action={approveOpportunity}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <CheckIcon className="mr-1 h-4 w-4" />
                Approve
              </Button>
            </form>
            <form action={dismissOpportunity}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit" variant="outline" size="sm">
                <XIcon className="mr-1 h-4 w-4" />
                Dismiss
              </Button>
            </form>
            <Button variant="outline" size="sm">
              <MapPinIcon className="mr-1 h-4 w-4" />
              Add to Roadmap
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - main content */}
          <div className="space-y-6 lg:col-span-2">
            {opportunity.currentState && (
              <Card>
                <CardHeader>
                  <CardTitle>Current State</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{opportunity.currentState}</p>
                </CardContent>
              </Card>
            )}
            {opportunity.recommendedState && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Future State</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{opportunity.recommendedState}</p>
                </CardContent>
              </Card>
            )}
            {opportunity.toolingSuggestion && (
              <Card>
                <CardHeader>
                  <CardTitle>Tooling Suggestion</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{opportunity.toolingSuggestion}</p>
                </CardContent>
              </Card>
            )}
            {opportunity.implementationApproach && (
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Approach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{opportunity.implementationApproach}</p>
                </CardContent>
              </Card>
            )}
            {opportunity.expectedImpact && (
              <Card>
                <CardHeader>
                  <CardTitle>Expected Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{opportunity.expectedImpact}</p>
                </CardContent>
              </Card>
            )}
            {opportunity.risks && (
              <Card>
                <CardHeader>
                  <CardTitle>Risks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{opportunity.risks}</p>
                </CardContent>
              </Card>
            )}
            {opportunity.technicalNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Technical Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{opportunity.technicalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBar
                  label="Impact"
                  value={opportunity.impactScore}
                  className="bg-emerald-500"
                />
                <ScoreBar
                  label="Effort"
                  value={opportunity.effortScore}
                  className="bg-amber-500"
                />
                <ScoreBar
                  label="ROI"
                  value={opportunity.roiScore}
                  className="bg-indigo-500"
                />
                <ScoreBar
                  label="Cost"
                  value={opportunity.costScore}
                  className="bg-rose-500"
                />
                <ScoreBar
                  label="Urgency"
                  value={opportunity.urgencyScore}
                  className="bg-orange-500"
                />
                <ScoreBar
                  label="Automation"
                  value={opportunity.automationScore}
                  className="bg-violet-500"
                />
                <ScoreBar
                  label="Complexity"
                  value={opportunity.complexityScore}
                  className="bg-slate-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunity.quadrant && (
                  <div>
                    <p className="text-xs text-muted-foreground">Quadrant</p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {opportunity.quadrant.replace("_", " ")}
                    </Badge>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="mt-1 font-medium">{confidence}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <OpportunityDetailClient
                    opportunityId={id}
                    currentStatus={opportunity.status}
                  />
                </div>
                {opportunity.workflow && (
                  <div>
                    <p className="text-xs text-muted-foreground">Linked Workflow</p>
                    <Link
                      href={`/workflows/${opportunity.workflow.id}`}
                      className="mt-1 flex items-center gap-2 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      <GitBranchIcon className="h-4 w-4" />
                      {opportunity.workflow.name}
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
