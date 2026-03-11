import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { JobPostsClient, GenerateJobPostDialog } from "./job-posts-client"
import { getJobPosts } from "./actions"
import { BriefcaseIcon } from "lucide-react"

export default async function JobPostsPage() {
  let jobPosts: any[] = []
  try {
    jobPosts = await getJobPosts() as any[]
  } catch {
    jobPosts = []
  }

  return (
    <>
      <PageHeader
        title="Job Posts"
        description="Generate job descriptions for implementation roles"
        actions={<GenerateJobPostDialog />}
      />
      <div className="flex-1 p-6">
        {jobPosts.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIcon className="h-6 w-6" />}
            title="No job posts yet"
            description="Generate Upwork-style job descriptions from your opportunities and roadmap."
            action={<GenerateJobPostDialog />}
          />
        ) : (
          <JobPostsClient jobPosts={jobPosts} />
        )}
      </div>
    </>
  )
}
