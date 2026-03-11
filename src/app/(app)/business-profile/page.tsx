import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { findFirst, findMany, where, orderBy } from "@/lib/firestore-helpers"
import { CompanyForm } from "./company-form"
import { OrgStructure } from "./org-structure"
import { ToolStack } from "./tool-stack"
import { ConstraintsForm } from "./constraints-form"

export const dynamic = "force-dynamic"

async function getBusinessProfileData() {
  try {
    const workspaceId = await getActiveWorkspaceId()
    console.log("[BP] Loading business profile for workspaceId:", workspaceId)
    if (!workspaceId) {
      console.log("[BP] No workspaceId found in cookie!")
      return {
        profile: null,
        departments: [],
        toolStackItems: [],
        constraints: null,
      }
    }

    const [profile, departments, toolStackItems] = await Promise.all([
      findFirst("businessProfiles", [where("workspaceId", "==", workspaceId)]),
      findMany("departments", [
        where("workspaceId", "==", workspaceId),
        orderBy("name", "asc"),
      ]),
      findMany("toolStackItems", [
        where("workspaceId", "==", workspaceId),
        orderBy("name", "asc"),
      ]),
    ])
    console.log("[BP] Profile found:", profile ? JSON.stringify({ id: profile.id, companyName: profile.companyName, workspaceId: profile.workspaceId }) : "NULL")

    // Get roles for each department
    const departmentsWithRoles = await Promise.all(
      departments.map(async (dept: any) => {
        const roles = await findMany("teamRoles", [
          where("departmentId", "==", dept.id),
        ])
        return { ...dept, roles }
      })
    )

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
      departments: departmentsWithRoles.map((d: any) => ({
        id: d.id,
        name: d.name,
        headCount: d.headCount,
        manager: d.manager ?? "",
        roles: d.roles.map((r: any) => ({
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
      toolStackItems: toolStackItems.map((t: any) => ({
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
  const workspaceId = await getActiveWorkspaceId()
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
                <CompanyForm key={workspaceId} initialData={data.profile ?? undefined} />
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
                <OrgStructure key={workspaceId} initialDepartments={data.departments} />
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
                <ToolStack key={workspaceId} initialItems={data.toolStackItems} />
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
                <ConstraintsForm key={workspaceId} initialData={data.constraints ?? undefined} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
