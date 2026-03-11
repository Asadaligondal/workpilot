"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    cta: "Coming Soon",
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
    cta: "Coming Soon",
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
    cta: "Coming Soon",
    highlighted: true,
  },
] as const

type BillingClientProps = {
  subscription: SubscriptionData
}

export function BillingClient({ subscription }: BillingClientProps) {
  const currentPlan = subscription.plan.toLowerCase()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the <strong>{subscription.plan}</strong> plan.
            {subscription.currentPeriodEnd && (
              <> Your subscription renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.</>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan
          return (
            <Card
              key={plan.id}
              className={plan.highlighted && !isCurrent ? "ring-2 ring-indigo-600" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isCurrent && <Badge variant="secondary">Current</Badge>}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-indigo-600">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || plan.cta === "Coming Soon"}
                >
                  {isCurrent ? plan.cta : plan.cta}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
