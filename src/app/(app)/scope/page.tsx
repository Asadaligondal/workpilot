import { PageHeader } from "@/components/page-header"
import { ScopeClient, GenerateScopeButton } from "./scope-client"
import { getScope } from "./actions"

export default async function ScopePage() {
  let scope: Awaited<ReturnType<typeof getScope>> = null
  try {
    scope = await getScope()
  } catch {
    scope = null
  }

  return (
    <>
      <PageHeader
        title="Scope & Tasks"
        description="Implementation scope documents and task breakdowns"
        actions={<GenerateScopeButton />}
      />
      <div className="flex-1 p-6">
        <ScopeClient scope={scope} />
      </div>
    </>
  )
}
