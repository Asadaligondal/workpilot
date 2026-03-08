import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { WorkflowsTable } from "./workflows-table"
import { getWorkflows } from "./actions"
import { GitBranchIcon, PlusIcon } from "lucide-react"
import Link from "next/link"

export default async function WorkflowsPage() {
  let workflows: Awaited<ReturnType<typeof getWorkflows>> = []
  try {
    workflows = await getWorkflows()
  } catch {
    workflows = []
  }

  return (
    <>
      <PageHeader
        title="Workflows"
        description="Map and manage your business workflows"
        actions={
          <Link href="/workflows/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <PlusIcon className="mr-1 h-4 w-4" />
              Add Workflow
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-6">
        {workflows.length === 0 ? (
          <EmptyState
            icon={<GitBranchIcon className="h-6 w-6" />}
            title="No workflows yet"
            description="Add workflows manually, use an industry template, or upload existing SOPs."
            action={
              <Link href="/workflows/new">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <PlusIcon className="mr-1 h-4 w-4" />
                  Add Workflow
                </Button>
              </Link>
            }
          />
        ) : (
          <WorkflowsTable workflows={workflows} />
        )}
      </div>
    </>
  )
}
