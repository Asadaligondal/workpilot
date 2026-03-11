import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SettingsForm } from "./settings-form"

async function getWorkspace() {
  try {
    const { getActiveWorkspace } = await import("@/lib/workspace")
    return await getActiveWorkspace()
  } catch {
    return null
  }
}

export default async function SettingsPage() {
  const workspace = await getWorkspace() as any

  return (
    <>
      <PageHeader title="Settings" description="Manage your workspace" />
      <div className="flex-1 p-6">
        <Tabs defaultValue="workspace" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="workspace">
            <Card>
              <CardHeader>
                <CardTitle>Workspace Settings</CardTitle>
                <CardDescription>
                  Update your workspace name and industry
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workspace ? (
                  <SettingsForm
                    name={workspace.name ?? ""}
                    industry={workspace.industry ?? ""}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No active workspace. Create one from the sidebar to get started.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage who has access to this workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                      O
                    </div>
                    <div>
                      <div className="text-sm font-medium">You</div>
                      <div className="text-xs text-muted-foreground">
                        Workspace owner
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">Owner</Badge>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Email address" className="flex-1" />
                  <Select defaultValue="MEMBER">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">Invite</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium capitalize">
                      {workspace?.subscription?.plan ?? "Free"} Plan
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Basic audit features with limited exports
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    Upgrade
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      name: "Growth",
                      price: "$49/mo",
                      features: "Multiple audits, branded exports",
                    },
                    {
                      name: "Agency",
                      price: "$149/mo",
                      features: "Multi-client, white-label reports",
                    },
                    {
                      name: "Enterprise",
                      price: "Custom",
                      features: "SSO, custom templates, integrations",
                    },
                  ].map((plan) => (
                    <div
                      key={plan.name}
                      className="rounded-lg border p-4 text-center"
                    >
                      <div className="font-semibold">{plan.name}</div>
                      <div className="mt-1 text-2xl font-bold text-indigo-600">
                        {plan.price}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {plan.features}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>AI & Export Preferences</CardTitle>
                <CardDescription>
                  Configure how the AI analysis works and reports are exported
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Default Export Format</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Audit Depth</Label>
                  <Select defaultValue="standard">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">Quick Scan</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="deep">Deep Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
