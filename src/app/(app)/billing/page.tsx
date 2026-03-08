import { PageHeader } from "@/components/page-header"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { getCurrentSubscription } from "./actions"
import { BillingClient } from "./billing-client"

export default async function BillingPage() {
  const workspaceId = await getActiveWorkspaceId()
  const result = await getCurrentSubscription()

  const subscription = result.ok
    ? result.subscription
    : {
        plan: "free",
        status: "active",
        currentPeriodEnd: null,
        stripeCustomerId: null,
      }
  const hasStripeCustomer = !!subscription.stripeCustomerId

  return (
    <>
      <PageHeader
        title="Billing"
        description="Manage your subscription and billing"
      />
      <div className="flex-1 p-6">
        {!result.ok && (
          <p className="mb-4 text-sm text-amber-600">{result.error}</p>
        )}
        <BillingClient
          subscription={subscription}
          hasStripeCustomer={hasStripeCustomer}
        />
      </div>
    </>
  )
}
