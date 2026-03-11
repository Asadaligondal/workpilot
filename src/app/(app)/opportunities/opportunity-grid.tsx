"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { OpportunityType } from "@/types"

type OpportunityWithWorkflow = {
  id: string
  title: string
  type: OpportunityType
  impactScore: number | null
  effortScore: number | null
  roiScore: number | null
  quadrant: string | null
  confidenceScore: number | null
  workflow: { id: string; name: string } | null
}

const typeBadgeClass: Record<string, string> = {
  AUTOMATE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  AUGMENT: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  OPTIMIZE: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  NO_CHANGE: "bg-muted text-muted-foreground",
}

function ScoreBar({ value, className }: { value: number | null; className?: string }) {
  const pct = value != null ? Math.round(value * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", className)}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
}

function OpportunityCard({ opp }: { opp: OpportunityWithWorkflow }) {
  const impact = opp.impactScore ?? 0
  const effort = opp.effortScore ?? 0
  const roi = opp.roiScore ?? 0
  const confidence = opp.confidenceScore != null ? Math.round(opp.confidenceScore * 100) : 0

  return (
    <Link href={`/opportunities/${opp.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-tight">{opp.title}</h3>
            <Badge
              variant="outline"
              className={cn("shrink-0", typeBadgeClass[opp.type] ?? "")}
            >
              {opp.type.replace("_", " ")}
            </Badge>
          </div>
          {opp.workflow && (
            <p className="text-xs text-muted-foreground">{opp.workflow.name}</p>
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
              <span>Effort</span>
              <span>{Math.round(effort * 100)}%</span>
            </div>
            <ScoreBar value={effort} className="bg-amber-500" />
          </div>
          <div>
            <div className="mb-0.5 flex justify-between text-xs">
              <span>ROI</span>
              <span>{Math.round(roi * 100)}%</span>
            </div>
            <ScoreBar value={roi} className="bg-indigo-500" />
          </div>
          <div className="flex items-center justify-between pt-1">
            {opp.quadrant && (
              <span className="text-xs text-muted-foreground capitalize">
                {opp.quadrant.replace("_", " ")}
              </span>
            )}
            <span className="text-xs font-medium">{confidence}% confidence</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function OpportunityGrid({
  opportunities,
  viewMode,
}: {
  opportunities: OpportunityWithWorkflow[]
  viewMode: "grid" | "table"
}) {
  const router = useRouter()

  if (viewMode === "table") {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Effort</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead>Quadrant</TableHead>
              <TableHead>Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow
                key={opp.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/opportunities/${opp.id}`)}
              >
                  <TableCell className="font-medium">{opp.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {opp.workflow?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        typeBadgeClass[opp.type] ?? ""
                      )}
                    >
                      {opp.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ScoreBar
                        value={opp.impactScore}
                        className="w-16 bg-emerald-500"
                      />
                      <span className="text-xs">
                        {opp.impactScore != null
                          ? Math.round(opp.impactScore * 100)
                          : 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ScoreBar
                        value={opp.effortScore}
                        className="w-16 bg-amber-500"
                      />
                      <span className="text-xs">
                        {opp.effortScore != null
                          ? Math.round(opp.effortScore * 100)
                          : 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ScoreBar
                        value={opp.roiScore}
                        className="w-16 bg-indigo-500"
                      />
                      <span className="text-xs">
                        {opp.roiScore != null
                          ? Math.round(opp.roiScore * 100)
                          : 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {opp.quadrant?.replace("_", " ") ?? "—"}
                  </TableCell>
                  <TableCell>
                    {opp.confidenceScore != null
                      ? Math.round(opp.confidenceScore * 100)
                      : 0}
                    %
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {opportunities.map((opp) => (
        <OpportunityCard key={opp.id} opp={opp} />
      ))}
    </div>
  )
}
