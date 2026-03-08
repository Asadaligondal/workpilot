"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { generateBudgetEstimates } from "../roadmap/actions"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

type BudgetEstimate = {
  id: string
  category: string
  itemName: string
  oneTimeCost: number | null
  recurringMonthlyCost: number | null
  notes: string | null
}

type Opportunity = {
  id: string
  title: string
  roiScore: number | null
  impactScore: number | null
  effortScore: number | null
}

type BudgetContentProps = {
  estimates: BudgetEstimate[]
  opportunities: Opportunity[]
  workspaceId: string | null
  isMockData?: boolean
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function BudgetContent({
  estimates,
  opportunities,
  workspaceId,
  isMockData = false,
}: BudgetContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [manualHours, setManualHours] = useState(80)
  const [hourlyCost, setHourlyCost] = useState(50)
  const [errorRateCost, setErrorRateCost] = useState(500)

  const totals = useMemo(() => {
    const oneTime = estimates.reduce((s, e) => s + (e.oneTimeCost ?? 0), 0)
    const monthly = estimates.reduce((s, e) => s + (e.recurringMonthlyCost ?? 0), 0)
    return {
      totalImplementation: oneTime,
      monthlyRecurring: monthly,
      totalFirstYear: oneTime + monthly * 12,
    }
  }, [estimates])

  const roi = useMemo(() => {
    const hoursSaved = manualHours * 0.3
    const fteEquivalent = hoursSaved / 160
    const monthlySavings = hoursSaved * hourlyCost + errorRateCost * 0.5
    const annualSavings = monthlySavings * 12
    const paybackMonths = totals.totalImplementation / monthlySavings || 0
    const roi12 = totals.totalImplementation
      ? ((annualSavings - totals.totalFirstYear) / totals.totalImplementation) * 100
      : 0
    return {
      hoursSaved,
      fteEquivalent,
      monthlySavings,
      annualSavings,
      paybackMonths,
      roi12,
    }
  }, [manualHours, hourlyCost, errorRateCost, totals])

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      cost: i === 0 ? totals.totalImplementation / 12 + totals.monthlyRecurring : totals.monthlyRecurring,
      savings: roi.monthlySavings,
    }))
  }, [totals, roi.monthlySavings])

  const maxVal = Math.max(
    ...monthlyData.flatMap((d) => [d.cost, d.savings]),
    1
  )

  const opportunityRoi = useMemo(() => {
    return opportunities.map((o) => {
      const score = o.roiScore ?? 0.5
      const estSavings = (score * 2000) + 500
      const estCost = (o.effortScore ?? 0.5) * 3000
      return {
        title: o.title,
        estimatedSavings: estSavings,
        estimatedCost: estCost,
        roi: estCost ? (estSavings / estCost) * 100 : 0,
      }
    })
  }, [opportunities])

  const handleGenerateEstimates = () => {
    if (!workspaceId) return
    startTransition(async () => {
      const result = await generateBudgetEstimates(workspaceId)
      if (result?.success) router.refresh()
    })
  }

  return (
    <Tabs defaultValue="budget" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="budget">Budget Estimator</TabsTrigger>
        <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
      </TabsList>

      <TabsContent value="budget" className="space-y-6">
        {estimates.length === 0 && !isMockData ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                No budget estimates yet. Generate from your opportunities.
              </p>
              {workspaceId && (
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={isPending}
                  onClick={handleGenerateEstimates}
                >
                  {isPending ? "Generating…" : "Generate Budget Estimates"}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {isMockData && workspaceId && (
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Showing estimated values. Generate to save official budget estimates.
                </p>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={isPending}
                  onClick={handleGenerateEstimates}
                >
                  {isPending ? "Generating…" : "Generate Budget Estimates"}
                </Button>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">One-time</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimates.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.category}</TableCell>
                    <TableCell>{e.itemName}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(e.oneTimeCost ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(e.recurringMonthlyCost ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Implementation Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(totals.totalImplementation)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Monthly Recurring Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totals.monthlyRecurring)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total First Year Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totals.totalFirstYear)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="roi" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="manual-hours">Current manual hours/month</Label>
            <Input
              id="manual-hours"
              type="number"
              min={0}
              value={manualHours}
              onChange={(e) => setManualHours(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourly-cost">Hourly cost ($)</Label>
            <Input
              id="hourly-cost"
              type="number"
              min={0}
              value={hourlyCost}
              onChange={(e) => setHourlyCost(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="error-cost">Error rate cost/month ($)</Label>
            <Input
              id="error-cost"
              type="number"
              min={0}
              value={errorRateCost}
              onChange={(e) => setErrorRateCost(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hours Saved/Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {roi.hoursSaved.toFixed(1)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                FTE Equivalent Recovered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {roi.fteEquivalent.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Cost Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(roi.monthlySavings)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Annual Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(roi.annualSavings)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Payback Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {roi.paybackMonths.toFixed(1)} months
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                12-Month ROI %
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {roi.roi12.toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Monthly Costs vs Savings (12 months)</h3>
          <div className="flex gap-2 items-end h-48">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5 justify-end h-40">
                  <div
                    className="w-full rounded-t bg-indigo-500/80"
                    style={{ height: `${(d.cost / maxVal) * 100}%`, minHeight: d.cost ? 4 : 0 }}
                  />
                  <div
                    className="w-full rounded-t bg-emerald-500/80"
                    style={{ height: `${(d.savings / maxVal) * 100}%`, minHeight: d.savings ? 4 : 0 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">M{d.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-indigo-500" /> Cost
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500" /> Savings
            </span>
          </div>
        </div>

        {opportunityRoi.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Per-opportunity ROI breakdown</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead className="text-right">Est. Savings</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                  <TableHead className="text-right">ROI %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunityRoi.map((o, i) => (
                  <TableRow key={i}>
                    <TableCell>{o.title}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(o.estimatedSavings)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(o.estimatedCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={o.roi >= 100 ? "default" : "secondary"}>
                        {o.roi.toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
