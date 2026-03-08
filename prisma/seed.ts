import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const industryTemplates = [
  {
    industry: "Healthcare / Medical Practices",
    name: "Healthcare & Medical",
    description: "Templates for medical practices, clinics, and healthcare providers",
    departments: ["Clinical", "Administration", "Billing", "Patient Services", "Compliance"],
    roles: ["Physician", "Nurse", "Medical Assistant", "Receptionist", "Billing Specialist", "Practice Manager"],
    workflows: [
      { name: "Patient Intake", trigger: "New patient appointment", frequency: "Daily" },
      { name: "Insurance Verification", trigger: "Scheduled appointment", frequency: "Daily" },
      { name: "Claims Submission", trigger: "Visit completed", frequency: "Weekly" },
      { name: "Referral Processing", trigger: "Referral received", frequency: "As needed" },
    ],
    painPoints: ["Manual data entry", "Insurance denials", "Appointment no-shows", "HIPAA compliance", "Prior authorization delays"],
    benchmarks: { avgClaimCycleDays: 30, noShowRate: 0.15, patientSatisfactionTarget: 4.5 },
  },
  {
    industry: "Financial Services / Accounting",
    name: "Financial Services & Accounting",
    description: "Templates for accounting firms, bookkeepers, and financial advisors",
    departments: ["Tax", "Audit", "Advisory", "Compliance", "Client Services"],
    roles: ["CPA", "Tax Associate", "Auditor", "Bookkeeper", "Financial Advisor", "Compliance Officer"],
    workflows: [
      { name: "Tax Return Preparation", trigger: "Client documents received", frequency: "Seasonal" },
      { name: "Month-End Close", trigger: "Calendar", frequency: "Monthly" },
      { name: "Client Onboarding", trigger: "New engagement", frequency: "As needed" },
      { name: "Reconciliation", trigger: "Bank statement received", frequency: "Monthly" },
    ],
    painPoints: ["Manual reconciliation", "Document gathering", "Deadline pressure", "Regulatory changes", "Client communication"],
    benchmarks: { avgCloseDays: 5, billableUtilization: 0.75, clientRetention: 0.92 },
  },
  {
    industry: "Legal Services",
    name: "Legal Services",
    description: "Templates for law firms and legal practitioners",
    departments: ["Litigation", "Corporate", "Real Estate", "Compliance", "Administration"],
    roles: ["Partner", "Associate", "Paralegal", "Legal Assistant", "Office Manager"],
    workflows: [
      { name: "Client Intake", trigger: "New matter", frequency: "As needed" },
      { name: "Document Review", trigger: "Discovery received", frequency: "Per case" },
      { name: "Billing & Time Entry", trigger: "Month end", frequency: "Monthly" },
      { name: "Contract Drafting", trigger: "Engagement signed", frequency: "Per matter" },
    ],
    painPoints: ["Manual time tracking", "Document management", "Billing disputes", "Compliance deadlines", "Client intake bottlenecks"],
    benchmarks: { avgBillableHours: 1600, realizationRate: 0.88, matterCycleDays: 180 },
  },
  {
    industry: "Marketing / Creative Agencies",
    name: "Marketing & Creative Agencies",
    description: "Templates for marketing agencies and creative studios",
    departments: ["Creative", "Account Management", "Strategy", "Production", "Operations"],
    roles: ["Creative Director", "Account Manager", "Designer", "Copywriter", "Project Manager", "Analyst"],
    workflows: [
      { name: "Campaign Brief", trigger: "New project", frequency: "Per campaign" },
      { name: "Creative Review", trigger: "Draft submitted", frequency: "Per deliverable" },
      { name: "Client Approval", trigger: "Review ready", frequency: "Per milestone" },
      { name: "Reporting", trigger: "Campaign end", frequency: "Monthly" },
    ],
    painPoints: ["Scope creep", "Revision rounds", "Asset management", "Client feedback delays", "Resource allocation"],
    benchmarks: { avgProjectCycle: 21, revisionRounds: 3, clientSatisfaction: 4.2 },
  },
  {
    industry: "eCommerce / Retail",
    name: "eCommerce & Retail",
    description: "Templates for online stores and retail operations",
    departments: ["Merchandising", "Operations", "Customer Service", "Marketing", "Finance"],
    roles: ["Merchandiser", "Operations Manager", "Customer Support", "Marketing Specialist", "Inventory Analyst"],
    workflows: [
      { name: "Order Fulfillment", trigger: "Order placed", frequency: "Daily" },
      { name: "Inventory Replenishment", trigger: "Stock threshold", frequency: "Weekly" },
      { name: "Returns Processing", trigger: "Return request", frequency: "Daily" },
      { name: "Vendor PO", trigger: "Reorder point", frequency: "Weekly" },
    ],
    painPoints: ["Inventory accuracy", "Returns handling", "Multi-channel sync", "Seasonal demand", "Shipping costs"],
    benchmarks: { orderFulfillmentHours: 24, returnRate: 0.08, inventoryAccuracy: 0.98 },
  },
  {
    industry: "Construction / Trades",
    name: "Construction & Trades",
    description: "Templates for contractors and trade businesses",
    departments: ["Field Operations", "Estimating", "Project Management", "Safety", "Administration"],
    roles: ["Project Manager", "Superintendent", "Estimator", "Foreman", "Safety Officer", "Office Admin"],
    workflows: [
      { name: "Bid Preparation", trigger: "RFP received", frequency: "Per bid" },
      { name: "Daily Log", trigger: "Site visit", frequency: "Daily" },
      { name: "Subcontractor Management", trigger: "Award", frequency: "Per project" },
      { name: "Change Order", trigger: "Scope change", frequency: "As needed" },
    ],
    painPoints: ["Manual timesheets", "Change order tracking", "Subcontractor coordination", "Material delays", "Documentation"],
    benchmarks: { bidWinRate: 0.25, avgProjectMargin: 0.12, safetyIncidentRate: 0.02 },
  },
  {
    industry: "Real Estate",
    name: "Real Estate",
    description: "Templates for real estate agents and brokerages",
    departments: ["Sales", "Property Management", "Marketing", "Operations"],
    roles: ["Agent", "Broker", "Property Manager", "Transaction Coordinator", "Marketing Coordinator"],
    workflows: [
      { name: "Lead Follow-Up", trigger: "Inquiry received", frequency: "Daily" },
      { name: "Transaction Coordination", trigger: "Contract signed", frequency: "Per deal" },
      { name: "Listing Management", trigger: "Listing agreement", frequency: "Per listing" },
      { name: "Closing Checklist", trigger: "Under contract", frequency: "Per transaction" },
    ],
    painPoints: ["Lead management", "Document tracking", "Scheduling showings", "Commission splits", "Compliance"],
    benchmarks: { avgDaysOnMarket: 30, conversionRate: 0.03, transactionCycle: 45 },
  },
  {
    industry: "Professional Services / Consulting",
    name: "Professional Services & Consulting",
    description: "Templates for consulting firms and professional services",
    departments: ["Delivery", "Sales", "Operations", "Talent", "Finance"],
    roles: ["Consultant", "Project Lead", "Account Executive", "Operations Manager", "Recruiter"],
    workflows: [
      { name: "Project Kickoff", trigger: "SOW signed", frequency: "Per project" },
      { name: "Timesheet & Expense", trigger: "Week end", frequency: "Weekly" },
      { name: "Client Reporting", trigger: "Sprint/month end", frequency: "Bi-weekly" },
      { name: "Resource Allocation", trigger: "New demand", frequency: "Weekly" },
    ],
    painPoints: ["Timesheet compliance", "Resource utilization", "Knowledge management", "Client reporting", "Expense approval"],
    benchmarks: { utilizationTarget: 0.80, projectMargin: 0.25, clientRetention: 0.90 },
  },
  {
    industry: "Manufacturing",
    name: "Manufacturing",
    description: "Templates for manufacturing and production operations",
    departments: ["Production", "Quality", "Supply Chain", "Maintenance", "Planning"],
    roles: ["Production Manager", "Quality Inspector", "Supply Chain Analyst", "Maintenance Tech", "Planner"],
    workflows: [
      { name: "Production Scheduling", trigger: "Order received", frequency: "Daily" },
      { name: "Quality Inspection", trigger: "Batch complete", frequency: "Per batch" },
      { name: "Maintenance Work Order", trigger: "Equipment issue", frequency: "As needed" },
      { name: "Inventory Count", trigger: "Cycle count schedule", frequency: "Weekly" },
    ],
    painPoints: ["Production downtime", "Quality defects", "Supply chain disruptions", "Manual data collection", "Changeover time"],
    benchmarks: { oee: 0.75, defectRate: 0.01, onTimeDelivery: 0.95 },
  },
  {
    industry: "Food & Beverage / Restaurants",
    name: "Food & Beverage / Restaurants",
    description: "Templates for restaurants and food service businesses",
    departments: ["Front of House", "Back of House", "Management", "Procurement"],
    roles: ["Manager", "Server", "Chef", "Host", "Prep Cook", "Purchasing"],
    workflows: [
      { name: "Inventory Count", trigger: "End of day/week", frequency: "Daily" },
      { name: "Vendor Ordering", trigger: "Par level", frequency: "Weekly" },
      { name: "Staff Scheduling", trigger: "Weekly planning", frequency: "Weekly" },
      { name: "Daily Sales Report", trigger: "Close of business", frequency: "Daily" },
    ],
    painPoints: ["Inventory waste", "Labor scheduling", "Vendor coordination", "Cash handling", "Health compliance"],
    benchmarks: { foodCostPct: 0.30, laborCostPct: 0.32, tableTurnTime: 45 },
  },
]

async function main() {
  for (const template of industryTemplates) {
    const existing = await prisma.industryTemplate.findFirst({
      where: { industry: template.industry },
    })
    if (existing) {
      await prisma.industryTemplate.update({
        where: { id: existing.id },
        data: {
          name: template.name,
          description: template.description,
          departments: template.departments,
          roles: template.roles,
          workflows: template.workflows,
          painPoints: template.painPoints,
          benchmarks: template.benchmarks,
        },
      })
    } else {
      await prisma.industryTemplate.create({
        data: {
          industry: template.industry,
          name: template.name,
          description: template.description,
          departments: template.departments,
          roles: template.roles,
          workflows: template.workflows,
          painPoints: template.painPoints,
          benchmarks: template.benchmarks,
        },
      })
    }
  }
  console.log(`Seeded ${industryTemplates.length} industry templates`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
