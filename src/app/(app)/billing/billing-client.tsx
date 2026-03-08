"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createCheckoutSession, createBillingPortalSession } from "./actions"
import type { SubscriptionData } from "./actions"

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    features: [
      "Basic audit features",
      "Limited exports",
      "1 workspace",
      "Community support",
    ],
    cta: "Current",
    highlighted: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    period: "/mo",
    features: [
      "Multiple audits",
      "Branded exports",
      "Up to 3 workspaces",
      "Email support",
    ],
    cta: "Upgrade",
    highlighted: true,
  },
  {
    id: "professional",
    name: "Professional",
    price: "$149",
    period: "/mo",
    features: [
      "Multi-client management",
      "White-label reports",
      "Unlimited workspaces",
      "Priority support",
    ],
    cta: "Upgrade",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$399",
    period: "/mo",
    features: [
      "SSO & advanced security",
      "Custom templates",
      "API integrations",
      "Dedicated success manager",
    ],
    cta: "Upgrade",
    highlighted: true,
  },
] as const

type BillingClientProps = {
  subscription: SubscriptionData
  hasStripeCustomer: boolean
}

export function BillingClient({ subscription, hasStripeCustomer }: BillingClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const currentPlan = subscription.plan.toLowerCase()

  async function handleUpgrade(planId: string) {
    if (planId === "free") return

    startTransition(async () => {
      const result = await createCheckoutSession(planId)
      if (result.ok) {
        router.push(result.url)
      } else {
        alert(result.error)
      }
    })
  }

  async function handleManageBilling() {
    startTransition(async () => {
      const result = await createBillingPortalSession()
      if (result.ok) {
        router.push(result.url)
      } else {
        alert(result.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      {subscription.currentPeriodEnd && (
        <p className="text-sm text-muted-foreground">
          Current billing period ends:{" "}
          {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
            dateStyle: "long",
          })}
        </p>
      )}

      {hasStripeCustomer && (
        <Button
          variant="outline"
          onClick={handleManageBilling}
          disabled={isPending}
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          Manage billing & subscription
        </Button>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const isDowngrade = ["starter", "professional", "enterprise"].indexOf(currentPlan) > ["starter", "professional", "enterprise"].indexOf(plan.id)

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-shadow ${
                isCurrent
                  ? "ring-2 ring-indigo-600 shadow-lg"
                  : plan.highlighted
                    ? "border-indigo-200 hover:shadow-md"
                    : ""
              }`}
            >
              {isCurrent && (
                <div className="absolute right-3 top-3">
                  <Badge className="bg-indigo-600">Current</Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-indigo-600">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-indigo-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.id === "free" ? (
                  <Button variant="outline" disabled className="w-full">
                    {isCurrent ? "Current plan" : "Free forever"}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isPending || isCurrent}
                  >
                    {isCurrent ? "Current plan" : isDowngrade ? "Downgrade" : "Upgrade"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
