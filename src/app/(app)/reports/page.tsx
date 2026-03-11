import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { GenerateReportDialog, ReportsClient } from "./reports-client"
import { getReports } from "./actions"
import { FileTextIcon } from "lucide-react"

export default async function ReportsPage() {
  let reports: Awaited<ReturnType<typeof getReports>> = []
  try {
    reports = await getReports()
  } catch {
    reports = []
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate and download audit reports"
        actions={<GenerateReportDialog />}
      />
      <div className="flex-1 p-6">
        {reports.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon className="h-6 w-6" />}
            title="No reports yet"
            description="Generate executive summaries, full audit reports, or technical annexes from your workspace data."
            action={<GenerateReportDialog />}
          />
        ) : (
          <ReportsClient reports={reports as any} />
        )}
      </div>
    </>
  )
}
