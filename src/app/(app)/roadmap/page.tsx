import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapIcon } from "lucide-react"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { getRoadmap } from "./actions"
import { GenerateRoadmapButton } from "./generate-roadmap-button"

export default async function RoadmapPage() {
  const workspaceId = await getActiveWorkspaceId()
  const roadmap = workspaceId ? await getRoadmap(workspaceId) : null

  return (
    <>
      <PageHeader
        title="Roadmap"
        description="Phased implementation plan for your improvements"
        actions={
          <GenerateRoadmapButton workspaceId={workspaceId} />
        }
      />
      <div className="flex-1 p-6">
        {!roadmap ? (
          <EmptyState
            icon={<MapIcon className="h-6 w-6" />}
            title="No roadmap yet"
            description="Generate a roadmap from your opportunities to see a phased implementation plan."
            action={
              workspaceId && (
                <GenerateRoadmapButton workspaceId={workspaceId} />
              )
            }
          />
        ) : (
          <div className="space-y-8">
            {/* Phase columns */}
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((order) => {
                const phase = roadmap.phases.find((p) => p.order === order)
                const phaseName =
                  order === 1
                    ? "Quick Wins"
                    : order === 2
                      ? "Core Improvements"
                      : "Strategic Initiatives"
                const colorClass =
                  order === 1
                    ? "border-emerald-200 dark:border-emerald-900"
                    : order === 2
                      ? "border-indigo-200 dark:border-indigo-900"
                      : "border-amber-200 dark:border-amber-900"

                return (
                  <Card
                    key={order}
                    className={`flex flex-col ${colorClass} border-2`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Phase {order}: {phase?.name ?? phaseName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      {phase?.items?.length ? (
                        phase.items.map((item) => (
                          <Card
                            key={item.id}
                            className="border bg-card p-3 shadow-sm"
                          >
                            <p className="font-medium">
                              {item.opportunity?.title ?? "Untitled"}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.estimatedWeeks && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.estimatedWeeks}w
                                </Badge>
                              )}
                              {Array.isArray(item.requiredRoles) &&
                                (item.requiredRoles as string[]).map((r) => (
                                  <Badge
                                    key={r}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {r}
                                  </Badge>
                                ))}
                            </div>
                          </Card>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No items in this phase
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Timeline / Gantt */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Timeline</h3>
              <div className="flex gap-2">
                {roadmap.phases
                  .sort((a, b) => a.order - b.order)
                  .map((phase) => {
                    const totalWeeks = phase.durationWeeks ?? 2
                    const maxWeeks = Math.max(
                      ...roadmap.phases.map((p) => p.durationWeeks ?? 2),
                      12
                    )
                    const widthPercent = (totalWeeks / maxWeeks) * 100
                    const colorClass =
                      phase.order === 1
                        ? "bg-emerald-500"
                        : phase.order === 2
                          ? "bg-indigo-500"
                          : "bg-amber-500"
                    return (
                      <div
                        key={phase.id}
                        className="flex flex-1 flex-col gap-1"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {phase.name}
                        </span>
                        <div className="h-8 w-full overflow-hidden rounded-lg bg-muted">
                          <div
                            className={`h-full rounded-lg ${colorClass} transition-all`}
                            style={{ width: `${Math.max(widthPercent, 10)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {totalWeeks} weeks
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
