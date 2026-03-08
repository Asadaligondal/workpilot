import { PageHeader } from "@/components/page-header"
import { ProposalsClient, GenerateProposalDialog } from "./proposals-client"
import { getProposals } from "./actions"

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ proposal?: string }>
}) {
  let proposals: Awaited<ReturnType<typeof getProposals>> = []
  try {
    proposals = await getProposals()
  } catch {
    proposals = []
  }

  const { proposal: initialProposalId } = await searchParams

  return (
    <>
      <PageHeader
        title="Proposals"
        description="Generate client-facing proposals from your audit"
        actions={<GenerateProposalDialog />}
      />
      <div className="flex-1 p-6">
        <ProposalsClient
          proposals={proposals}
          initialProposalId={initialProposalId}
        />
      </div>
    </>
  )
}
