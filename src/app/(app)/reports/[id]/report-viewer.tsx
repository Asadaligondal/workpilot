"use client"

import { useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { DownloadIcon } from "lucide-react"
import type { Report } from "@/types"

type ReportWithContent = Report & { content: unknown }

export function ReportViewer({
  report,
  initialDownload = false,
}: {
  report: ReportWithContent
  initialDownload?: boolean
}) {
  const content = report.content as { html?: string } | null
  const html = content?.html ?? ""

  const typeLabel = report.type.replace(/_/g, " ")
  const generatedAt = report.generatedAt instanceof Date 
    ? report.generatedAt 
    : (report.generatedAt as any)?.toDate?.() || new Date(report.generatedAt as any)
  const filename = `report-${typeLabel.toLowerCase().replace(/\s+/g, "-")}-${generatedAt.toISOString().slice(0, 10)}.txt`

  const handleDownload = useCallback(() => {
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [html, filename])

  useEffect(() => {
    if (initialDownload && html) {
      handleDownload()
    }
  }, [initialDownload, html, handleDownload])

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {typeLabel} Report
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
        >
          <DownloadIcon className="mr-1 h-4 w-4" />
          Download
        </Button>
      </div>
      <div
        className="prose prose-sm max-w-none rounded-lg border bg-card p-6 dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
