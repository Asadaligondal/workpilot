import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { CompanyForm } from "./company-form"
import { OrgStructure } from "./org-structure"
import { ToolStack } from "./tool-stack"
import { ConstraintsForm } from "./constraints-form"

async function getBusinessProfileData() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) {
      return {
        profile: null,
        departments: [],
        toolStackItems: [],
        constraints: null,
      }
    }

    const [profile, departments, toolStackItems] = await Promise.all([
      prisma.businessProfile.findUnique({
        where: { workspaceId },
      }),
      prisma.department.findMany({
        where: { workspaceId },
        include: { roles: true },
        orderBy: { name: "asc" },
      }),
      prisma.toolStackItem.findMany({
        where: { workspaceId },
        orderBy: { name: "asc" },
      }),
    ])

    const locations =
      profile?.locations != null
        ? typeof profile.locations === "string"
          ? profile.locations
          : Array.isArray(profile.locations)
            ? (profile.locations as string[]).join(", ")
            : (profile.locations as Record<string, string>)?.value ?? ""
        : ""

    const constraints =
      profile?.constraints != null && typeof profile.constraints === "object"
        ? (profile.constraints as {
            complianceNotes?: string
            budgetConstraints?: string
            timelineConstraints?: string
            technicalLimitations?: string
          })
        : null

    return {
      profile: profile
        ? {
            companyName: profile.companyName ?? "",
            website: profile.website ?? "",
            industry: profile.industry ?? "",
            subIndustry: profile.subIndustry ?? "",
            teamSize: profile.teamSize ?? "",
            growthStage: profile.growthStage ?? "",
            operatingHours: profile.operatingHours ?? "",
            locations,
          }
        : null,
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        headCount: d.headCount,
        manager: d.manager ?? "",
        roles: d.roles.map((r) => ({
          id: r.id,
          title: r.title,
          responsibilities: r.responsibilities ?? "",
          toolsUsed: Array.isArray(r.toolsUsed)
            ? (r.toolsUsed as string[]).join(", ")
            : typeof r.toolsUsed === "string"
              ? r.toolsUsed
              : "",
        })),
      })),
      toolStackItems: toolStackItems.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category ?? "",
        monthlyBudget: t.monthlyBudget,
        satisfaction: t.satisfaction,
        notes: t.notes ?? "",
      })),
      constraints: constraints
        ? {
            complianceNotes: constraints.complianceNotes ?? "",
            budgetConstraints: constraints.budgetConstraints ?? "",
            timelineConstraints: constraints.timelineConstraints ?? "",
            technicalLimitations: constraints.technicalLimitations ?? "",
          }
        : null,
    }
  } catch {
    return {
      profile: null,
      departments: [],
      toolStackItems: [],
      constraints: null,
    }
  }
}

export default async function BusinessProfilePage() {
  const data = await getBusinessProfileData()

  return (
    <>
      <PageHeader
        title="Business Profile"
        description="Your company details, team structure, and tool stack"
      />
      <div className="flex-1 p-6">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company">Company Details</TabsTrigger>
            <TabsTrigger value="org">Org Structure</TabsTrigger>
            <TabsTrigger value="tools">Tool Stack</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>
                  Basic information about your company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyForm initialData={data.profile ?? undefined} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="org">
            <Card>
              <CardHeader>
                <CardTitle>Organization Structure</CardTitle>
                <CardDescription>
                  Departments, roles, and team structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrgStructure initialDepartments={data.departments} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle>Tool Stack</CardTitle>
                <CardDescription>
                  Software and tools your team uses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ToolStack initialItems={data.toolStackItems} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="constraints">
            <Card>
              <CardHeader>
                <CardTitle>Constraints</CardTitle>
                <CardDescription>
                  Compliance, budget, timeline, and technical constraints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConstraintsForm initialData={data.constraints ?? undefined} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
