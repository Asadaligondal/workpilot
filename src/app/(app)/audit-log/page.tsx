import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { getAuditLogs } from "@/lib/audit"
import { ClipboardListIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const PAGE_SIZE = 25

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const workspaceId = await getActiveWorkspaceId()
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  if (!workspaceId) {
    return (
      <>
        <PageHeader
          title="Audit Log"
          description="View activity history for your workspace"
        />
        <div className="flex-1 p-6">
          <EmptyState
            icon={<ClipboardListIcon className="h-6 w-6" />}
            title="No workspace selected"
            description="Select or create a workspace to view audit logs."
          />
        </div>
      </>
    )
  }

  const { logs, hasMore } = await getAuditLogs(workspaceId, page)

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="View activity history for your workspace"
      />
      <div className="flex-1 p-6">
        {logs.length === 0 ? (
          <EmptyState
            icon={<ClipboardListIcon className="h-6 w-6" />}
            title="No audit logs yet"
            description="Activity in your workspace will appear here."
          />
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-foreground">Date/Time</TableHead>
                  <TableHead className="text-foreground">User</TableHead>
                  <TableHead className="text-foreground">Action</TableHead>
                  <TableHead className="text-foreground">Entity</TableHead>
                  <TableHead className="text-foreground">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-border">
                    <TableCell className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {log.user?.name ?? log.user?.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-indigo-600">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.entity ? (
                        <span className="text-muted-foreground">
                          {log.entity}
                          {log.entityId && (
                            <span className="ml-1 text-xs">({log.entityId})</span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.details && typeof log.details === "object" ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {JSON.stringify(log.details)}
                        </code>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasMore && (
              <div className="flex justify-center border-t border-border p-4">
                <Link href={`/audit-log?page=${page + 1}`}>
                  <Button variant="outline" className="text-indigo-600 hover:text-indigo-700">
                    Load More
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
