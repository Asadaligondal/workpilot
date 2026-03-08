export interface WorkflowTemplateStep {
  name: string
  description?: string
  actorRole?: string
  toolUsed?: string
  timeMinutes?: number
  isManual?: boolean
  painPoints?: string
}

export interface WorkflowTemplate {
  industry: string
  name: string
  description: string
  steps: WorkflowTemplateStep[]
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    industry: "Sales",
    name: "Lead Handling",
    description: "From lead capture to qualification and handoff",
    steps: [
      { name: "Lead received", description: "Inbound lead from form or referral", actorRole: "Sales Rep", toolUsed: "CRM", timeMinutes: 5, isManual: true },
      { name: "Initial contact", description: "First outreach attempt", actorRole: "Sales Rep", toolUsed: "Email/Phone", timeMinutes: 15, isManual: true },
      { name: "Qualification", description: "BANT or similar qualification", actorRole: "Sales Rep", toolUsed: "CRM", timeMinutes: 20, isManual: true },
      { name: "Demo scheduling", description: "Book product demo", actorRole: "SDR", toolUsed: "Calendly", timeMinutes: 10, isManual: false },
      { name: "Demo delivery", description: "Product demonstration", actorRole: "AE", toolUsed: "Zoom", timeMinutes: 45, isManual: true },
      { name: "Handoff to AE", description: "Qualified lead handoff", actorRole: "SDR", toolUsed: "CRM", timeMinutes: 5, isManual: true },
    ],
  },
  {
    industry: "Support",
    name: "Customer Support",
    description: "Ticket triage, resolution, and escalation",
    steps: [
      { name: "Ticket received", description: "Customer submits support request", actorRole: "Support Agent", toolUsed: "Helpdesk", timeMinutes: 2, isManual: false },
      { name: "Triage", description: "Categorize and prioritize", actorRole: "Support Agent", toolUsed: "Helpdesk", timeMinutes: 5, isManual: true },
      { name: "Investigation", description: "Research and troubleshoot", actorRole: "Support Agent", toolUsed: "Internal docs", timeMinutes: 20, isManual: true },
      { name: "Resolution", description: "Respond and resolve", actorRole: "Support Agent", toolUsed: "Helpdesk", timeMinutes: 15, isManual: true },
      { name: "Escalation (if needed)", description: "Escalate to L2 or engineering", actorRole: "Support Lead", toolUsed: "Helpdesk", timeMinutes: 10, isManual: true },
    ],
  },
  {
    industry: "Finance",
    name: "Invoicing",
    description: "Invoice creation, approval, and delivery",
    steps: [
      { name: "Invoice creation", description: "Generate invoice from PO or contract", actorRole: "Accounts Receivable", toolUsed: "Accounting software", timeMinutes: 15, isManual: true },
      { name: "Approval", description: "Manager approval for large amounts", actorRole: "Finance Manager", toolUsed: "Approval workflow", timeMinutes: 5, isManual: true },
      { name: "Delivery", description: "Send invoice to customer", actorRole: "AR Clerk", toolUsed: "Email", timeMinutes: 2, isManual: false },
      { name: "Payment tracking", description: "Record and reconcile payment", actorRole: "AR Clerk", toolUsed: "Accounting software", timeMinutes: 10, isManual: true },
    ],
  },
  {
    industry: "Operations",
    name: "Scheduling",
    description: "Resource and appointment scheduling",
    steps: [
      { name: "Request received", description: "Scheduling request from client or internal", actorRole: "Coordinator", toolUsed: "Email/Form", timeMinutes: 5, isManual: true },
      { name: "Availability check", description: "Check calendars and resources", actorRole: "Coordinator", toolUsed: "Calendar", timeMinutes: 10, isManual: true },
      { name: "Booking", description: "Confirm and book slot", actorRole: "Coordinator", toolUsed: "Scheduling tool", timeMinutes: 5, isManual: false },
      { name: "Confirmation", description: "Send confirmation to all parties", actorRole: "Coordinator", toolUsed: "Email", timeMinutes: 2, isManual: false },
    ],
  },
  {
    industry: "HR",
    name: "Employee Onboarding",
    description: "New hire setup and orientation",
    steps: [
      { name: "Offer accepted", description: "Trigger onboarding workflow", actorRole: "HR", toolUsed: "HRIS", timeMinutes: 5, isManual: true },
      { name: "Paperwork", description: "I-9, W-4, benefits enrollment", actorRole: "HR", toolUsed: "DocuSign", timeMinutes: 30, isManual: true },
      { name: "IT setup", description: "Accounts, equipment, access", actorRole: "IT", toolUsed: "Identity management", timeMinutes: 45, isManual: true },
      { name: "Orientation", description: "Company intro and policies", actorRole: "HR", toolUsed: "LMS", timeMinutes: 60, isManual: true },
      { name: "Team intro", description: "Meet team and manager", actorRole: "Manager", toolUsed: "Calendar", timeMinutes: 30, isManual: true },
      { name: "First week check-in", description: "30-day check-in", actorRole: "Manager", toolUsed: "1:1", timeMinutes: 30, isManual: true },
    ],
  },
  {
    industry: "Finance",
    name: "Monthly Reporting",
    description: "Close books and produce reports",
    steps: [
      { name: "Data collection", description: "Gather data from all sources", actorRole: "Finance Analyst", toolUsed: "ERP", timeMinutes: 120, isManual: true },
      { name: "Reconciliation", description: "Reconcile accounts", actorRole: "Finance Analyst", toolUsed: "Spreadsheet", timeMinutes: 90, isManual: true },
      { name: "Report drafting", description: "Create P&L, balance sheet", actorRole: "Finance Analyst", toolUsed: "BI tool", timeMinutes: 60, isManual: true },
      { name: "Review", description: "Controller review", actorRole: "Controller", toolUsed: "BI tool", timeMinutes: 30, isManual: true },
      { name: "Distribution", description: "Share with stakeholders", actorRole: "Finance Analyst", toolUsed: "Email", timeMinutes: 10, isManual: false },
    ],
  },
]
