import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import {
  GitBranchIcon,
  LightbulbIcon,
  DollarSignIcon,
  PlusIcon,
  PlayIcon,
  FileDownIcon,
  ClockIcon,
} from "lucide-react"
import Link from "next/link"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

const typeBadgeClass: Record<string, string> = {
  AUTOMATE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  AUGMENT: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  OPTIMIZE: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  NO_CHANGE: "bg-muted text-muted-foreground",
}

function ScoreBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(value * 100)))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", className)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default async function DashboardPage() {
  let workflowCount = 0
  let opportunityCount = 0
  let estimatedSavings = 0
  let topOpportunities: Awaited<
    ReturnType<typeof prisma.opportunity.findMany<{ include: { workflow: true } }>>
  > = []

  try {
    const workspaceId = await getActiveWorkspaceId()
    if (workspaceId) {
      const [workflows, opportunities, top] = await Promise.all([
        prisma.workflow.count({ where: { workspaceId } }),
        prisma.opportunity.count({ where: { workspaceId } }),
        prisma.opportunity.findMany({
          where: { workspaceId },
          include: { workflow: true },
          orderBy: [{ roiScore: "desc" }, { impactScore: "desc" }],
          take: 5,
        }),
      ])
      workflowCount = workflows
      opportunityCount = opportunities
      topOpportunities = top

      const savingsResult = await prisma.opportunity.aggregate({
        where: { workspaceId },
        _sum: { roiScore: true },
      })
      const roiSum = savingsResult._sum.roiScore ?? 0
      estimatedSavings = Math.round(roiSum * 100)
    }
  } catch (err) {
    console.error("Dashboard data load:", err)
  }

  const auditStatus =
    workflowCount === 0
      ? "Not Started"
      : opportunityCount === 0
        ? "In Progress"
        : "Complete"

  const hasData = workflowCount > 0 || opportunityCount > 0

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your operations audit"
        actions={
          <div className="flex gap-2">
            <Link href="/workflows/new">
              <Button variant="outline" size="sm">
                <PlusIcon className="mr-1 h-4 w-4" />
                Add Workflow
              </Button>
            </Link>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <PlayIcon className="mr-1 h-4 w-4" />
              Run Analysis
            </Button>
            <Button variant="outline" size="sm">
              <FileDownIcon className="mr-1 h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />
      <div className="flex-1 space-y-6 p-6">
        {!hasData ? (
          <EmptyState
            icon={<GitBranchIcon className="h-6 w-6" />}
            title="No workflows yet"
            description="Start by adding your business workflows. Describe how your team works today and we'll identify automation opportunities."
            action={
              <Link href="/workflows/new">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <PlusIcon className="mr-1 h-4 w-4" />
                  Add Your First Workflow
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* Status cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Audit Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auditStatus}</div>
                  <p className="text-xs text-muted-foreground">
                    {auditStatus === "Not Started"
                      ? "Add workflows to begin"
                      : auditStatus === "In Progress"
                        ? "Run analysis to find opportunities"
                        : "Opportunities identified"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Workflows
                  </CardTitle>
                  <GitBranchIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{workflowCount}</div>
                  <p className="text-xs text-muted-foreground">Mapped processes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Opportunities
                  </CardTitle>
                  <LightbulbIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{opportunityCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Identified improvements
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Est. Savings
                  </CardTitle>
                  <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${estimatedSavings.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Per month</p>
                </CardContent>
              </Card>
            </div>

            {/* Top 5 Opportunities */}
            {topOpportunities.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">Top 5 Opportunities</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {topOpportunities.map((opp) => {
                    const impact = opp.impactScore ?? 0
                    const roi = opp.roiScore ?? 0
                    return (
                      <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                        <Card className="transition-colors hover:bg-muted/50">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium leading-tight">{opp.title}</h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0",
                                  typeBadgeClass[opp.type] ?? ""
                                )}
                              >
                                {opp.type.replace("_", " ")}
                              </Badge>
                            </div>
                            {opp.workflow && (
                              <p className="text-xs text-muted-foreground">
                                {opp.workflow.name}
                              </p>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div>
                              <div className="mb-0.5 flex justify-between text-xs">
                                <span>Impact</span>
                                <span>{Math.round(impact * 100)}%</span>
                              </div>
                              <ScoreBar value={impact} className="bg-emerald-500" />
                            </div>
                            <div>
                              <div className="mb-0.5 flex justify-between text-xs">
                                <span>ROI</span>
                                <span>{Math.round(roi * 100)}%</span>
                              </div>
                              <ScoreBar value={roi} className="bg-indigo-500" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Activity placeholder */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ClockIcon className="h-10 w-10" />
                    <p className="text-sm">Recent activity will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  )
}
