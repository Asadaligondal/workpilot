import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  UsersIcon,
  BuildingIcon,
  GitBranchIcon,
  LightbulbIcon,
  FileTextIcon,
  CreditCardIcon,
  ActivityIcon,
} from "lucide-react"
import { requireUser, isAdmin } from "@/lib/auth"
import {
  getAdminStats,
  getRecentAuditLogs,
  getUsers,
} from "./actions"
import { AdminUserTable } from "./admin-user-table"

export default async function AdminPage() {
  let admin = false
  try {
    await requireUser()
    admin = await isAdmin()
  } catch {
    admin = false
  }

  if (!admin) {
    return (
      <>
        <PageHeader
          title="Admin"
          description="System-wide statistics and management"
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="max-w-md border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You do not have permission to access the admin panel. Contact
                an administrator if you believe this is an error.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    )
  }

  const [stats, logs, users] = await Promise.all([
    getAdminStats(),
    getRecentAuditLogs(20),
    getUsers(),
  ])

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: UsersIcon,
    },
    {
      label: "Total Workspaces",
      value: stats.totalWorkspaces,
      icon: BuildingIcon,
    },
    {
      label: "Total Workflows",
      value: stats.totalWorkflows,
      icon: GitBranchIcon,
    },
    {
      label: "Total Opportunities",
      value: stats.totalOpportunities,
      icon: LightbulbIcon,
    },
    {
      label: "Total Reports Generated",
      value: stats.totalReports,
      icon: FileTextIcon,
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: CreditCardIcon,
    },
  ]

  return (
    <>
      <PageHeader
        title="Admin"
        description="System-wide statistics and management"
      />
      <div className="flex-1 space-y-6 p-6">
        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-indigo-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <Icon className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <ActivityIcon className="h-5 w-5 text-indigo-600" />
            Recent Activity
          </h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Workspace</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No audit logs yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{log.workspace.name}</TableCell>
                        <TableCell>
                          {log.user?.name ?? log.user?.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-indigo-500/30 text-indigo-600">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.entity ? `${log.entity}${log.entityId ? ` #${log.entityId.slice(-6)}` : ""}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <UsersIcon className="h-5 w-5 text-indigo-600" />
            User Management
          </h2>
          <Card>
            <CardContent className="p-0">
              <AdminUserTable users={users} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
