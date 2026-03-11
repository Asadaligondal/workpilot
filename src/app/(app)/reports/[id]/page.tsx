import { notFound } from "next/navigation"
import { getReport } from "../actions"
import { ReportViewer } from "./report-viewer"

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ download?: string }>
}) {
  const { id } = await params
  const { download } = await searchParams

  const report = await getReport(id) as any
  if (!report) notFound()

  return (
    <ReportViewer
      report={report}
      initialDownload={download === "1"}
    />
  )
}
