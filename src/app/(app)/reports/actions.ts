"use server"

import { prisma } from "@/lib/prisma"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { logAudit } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import type { ReportType } from "@prisma/client"

export async function getReports() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return []

    const reports = await prisma.report.findMany({
      where: { workspaceId },
      orderBy: { generatedAt: "desc" },
    })
    return reports
  } catch (err) {
    console.error("getReports:", err)
    return []
  }
}

export async function getReport(id: string) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return null

    const report = await prisma.report.findFirst({
      where: { id, workspaceId },
    })
    return report
  } catch (err) {
    console.error("getReport:", err)
    return null
  }
}

function buildReportContent(
  data: {
    companyName: string
    businessProfile: unknown
    workflows: unknown[]
    opportunities: unknown[]
    roadmaps: unknown[]
    budgetEstimates: unknown[]
  },
  type: ReportType
): { html: string; json: Record<string, unknown> } {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const coverHtml = `
    <div class="report-cover">
      <h1>${data.companyName || "Company"} - Audit Report</h1>
      <p class="report-date">${date}</p>
      <p class="report-type">${type.replace(/_/g, " ")}</p>
    </div>
  `

  let sectionsHtml = ""

  if (type === "EXECUTIVE_SUMMARY") {
    const topOpps = (data.opportunities as { title?: string; roiScore?: number }[]).slice(0, 5)
    const totalBudget = (data.budgetEstimates as { oneTimeCost?: number; recurringMonthlyCost?: number }[]).reduce(
      (sum, b) => sum + (b.oneTimeCost || 0) + (b.recurringMonthlyCost || 0) * 12,
      0
    )
    sectionsHtml = `
      <section class="report-section">
        <h2>Overview</h2>
        <p>This executive summary provides a high-level view of the automation audit for ${data.companyName || "your organization"}.</p>
        <p>Workflows analyzed: ${(data.workflows as unknown[]).length} | Opportunities identified: ${(data.opportunities as unknown[]).length}</p>
      </section>
      <section class="report-section">
        <h2>Top Opportunities</h2>
        <ul>
          ${topOpps.map((o) => `<li>${o.title || "Opportunity"}${o.roiScore ? ` (ROI: ${o.roiScore})` : ""}</li>`).join("")}
        </ul>
      </section>
      <section class="report-section">
        <h2>ROI Summary</h2>
        <p>Estimated total investment: $${totalBudget.toLocaleString()}</p>
      </section>
      <section class="report-section">
        <h2>Roadmap Overview</h2>
        <p>${(data.roadmaps as unknown[]).length} roadmap(s) defined with phased implementation.</p>
      </section>
    `
  } else if (type === "FULL_AUDIT") {
    const workflowsHtml = (data.workflows as { name?: string; description?: string }[]).map(
      (w) => `
        <div class="workflow-detail">
          <h3>${w.name || "Workflow"}</h3>
          <p>${w.description || "No description"}</p>
        </div>
      `
    ).join("")
    const oppsHtml = (data.opportunities as { title?: string; type?: string; expectedImpact?: string }[]).map(
      (o) => `
        <div class="opportunity-detail">
          <h3>${o.title || "Opportunity"}</h3>
          <p><strong>Type:</strong> ${o.type || "N/A"}</p>
          <p>${o.expectedImpact || ""}</p>
        </div>
      `
    ).join("")
    sectionsHtml = `
      <section class="report-section">
        <h2>Business Profile</h2>
        <pre>${JSON.stringify(data.businessProfile, null, 2)}</pre>
      </section>
      <section class="report-section">
        <h2>Workflows</h2>
        ${workflowsHtml}
      </section>
      <section class="report-section">
        <h2>Opportunities</h2>
        ${oppsHtml}
      </section>
      <section class="report-section">
        <h2>Budget</h2>
        <pre>${JSON.stringify(data.budgetEstimates, null, 2)}</pre>
      </section>
    `
  } else {
    const workflowsHtml = (data.workflows as { name?: string; description?: string }[]).map(
      (w) => `
        <div class="workflow-spec">
          <h3>${w.name || "Workflow"}</h3>
          <p>${w.description || "No description"}</p>
        </div>
      `
    ).join("")
    sectionsHtml = `
      <section class="report-section">
        <h2>Workflow Specifications</h2>
        ${workflowsHtml}
      </section>
      <section class="report-section">
        <h2>Integration Notes</h2>
        <p>Technical integration requirements and API considerations for automation implementation.</p>
      </section>
      <section class="report-section">
        <h2>Data Requirements</h2>
        <p>Data schema and format requirements for workflow automation.</p>
      </section>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .report-cover { text-align: center; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #e5e7eb; }
        .report-date { color: #6b7280; }
        .report-type { text-transform: capitalize; font-weight: 600; color: #4f46e5; }
        .report-section { margin: 1.5rem 0; }
        .report-section h2 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #1f2937; }
        .workflow-detail, .opportunity-detail, .workflow-spec { margin: 1rem 0; padding: 1rem; background: #f9fafb; border-radius: 0.5rem; }
        pre { overflow-x: auto; font-size: 0.875rem; }
      </style>
    </head>
    <body>
      ${coverHtml}
      ${sectionsHtml}
    </body>
    </html>
  `

  return {
    html,
    json: {
      companyName: data.companyName,
      reportType: type,
      generatedAt: new Date().toISOString(),
      sections: type,
    },
  }
}

export async function generateReport(
  type: ReportType,
  format: string
) {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return { success: false, error: "No active workspace" }
    const [businessProfile, workflows, opportunities, roadmaps, budgetEstimates] =
      await Promise.all([
        prisma.businessProfile.findFirst({ where: { workspaceId } }),
        prisma.workflow.findMany({
          where: { workspaceId },
          include: { steps: true },
        }),
        prisma.opportunity.findMany({ where: { workspaceId } }),
        prisma.roadmap.findMany({
          where: { workspaceId },
          include: { phases: { include: { items: true } } },
        }),
        prisma.budgetEstimate.findMany({ where: { workspaceId } }),
      ])

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    })

    const { html, json } = buildReportContent(
      {
        companyName: workspace?.name || businessProfile?.companyName || "Company",
        businessProfile,
        workflows,
        opportunities,
        roadmaps,
        budgetEstimates,
      },
      type
    )

    const report = await prisma.report.create({
      data: {
        workspaceId,
        type,
        format: format || "pdf",
        content: json as object,
        fileUrl: null,
      },
    })

    await prisma.report.update({
      where: { id: report.id },
      data: {
        content: {
          ...json,
          html,
          format,
        } as object,
      },
    })

    const user = await import("@/lib/auth").then((m) => m.requireUser())
    await logAudit({
      workspaceId,
      userId: user.id,
      action: "report.generated",
      entity: "Report",
      entityId: report.id,
      details: { type, format },
    })

    revalidatePath("/reports")
    revalidatePath(`/reports/${report.id}`)
    return { success: true, id: report.id }
  } catch (err) {
    console.error("generateReport:", err)
    return { success: false, error: String(err) }
  }
}
