"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { generateReport } from "./actions"
import type { ReportType } from "@/types"
import {
  FileTextIcon,
  DownloadIcon,
  PlusIcon,
  Loader2Icon,
} from "lucide-react"
import Link from "next/link"

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "EXECUTIVE_SUMMARY", label: "Executive Summary" },
  { value: "FULL_AUDIT", label: "Full Audit" },
  { value: "TECHNICAL_ANNEX", label: "Technical Annex" },
]

const FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
]

type Report = {
  id: string
  type: ReportType
  format: string
  generatedAt: Date
}

function GenerateReportDialog({ showButton = true }: { showButton?: boolean }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ReportType>("EXECUTIVE_SUMMARY")
  const [format, setFormat] = useState("pdf")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateReport(type, format)
      if (result.success && result.id) {
        setOpen(false)
        window.location.href = `/reports/${result.id}`
      } else {
        setError(result.error || "Failed to generate report")
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showButton && (
        <DialogTrigger>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <PlusIcon className="mr-1 h-4 w-4" />
            Generate Report
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Report type</Label>
            <div className="flex flex-col gap-2">
              {REPORT_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                    type === t.value
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                      : "border-input hover:bg-muted"
                  )}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={t.value}
                    checked={type === t.value}
                    onChange={() => setType(t.value)}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="flex gap-4">
              {FORMATS.map((f) => (
                <label
                  key={f.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                    format === f.value
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                      : "border-input hover:bg-muted"
                  )}
                >
                  <input
                    type="radio"
                    name="format"
                    value={f.value}
                    checked={format === f.value}
                    onChange={() => setFormat(f.value)}
                    className="sr-only"
                  />
                  {f.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Report will be generated as text/HTML for download.
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReportsList({ reports }: { reports: Report[] }) {
  const typeLabel = (t: ReportType) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Badge variant="secondary">{typeLabel(r.type)}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(r.generatedAt).toLocaleDateString()}
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Link href={`/reports/${r.id}`}>
                  <Button variant="outline" size="sm">
                    <FileTextIcon className="mr-1 h-4 w-4" />
                    View
                  </Button>
                </Link>
                <a href={`/reports/${r.id}?download=1`}>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="mr-1 h-4 w-4" />
                    Download
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ReportsClient({
  reports,
  showGenerateButton = true,
}: {
  reports: Report[]
  showGenerateButton?: boolean
}) {
  if (reports.length > 0) {
    return <ReportsList reports={reports} />
  }
  return showGenerateButton ? <GenerateReportDialog showButton={true} /> : null
}

export { GenerateReportDialog }
