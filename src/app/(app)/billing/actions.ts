"use server"

import { prisma } from "@/lib/prisma"
import { getActiveWorkspaceId } from "@/lib/workspace"
import { requireUser } from "@/lib/auth"
import { getStripe } from "@/lib/stripe"

const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
}

export type SubscriptionData = {
  plan: string
  status: string
  currentPeriodEnd: Date | null
  stripeCustomerId: string | null
}

export async function getCurrentSubscription(): Promise<
  | { ok: true; subscription: SubscriptionData }
  | { ok: false; error: string }
> {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return { ok: false, error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment." }
    }

    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) {
      return { ok: false, error: "No active workspace" }
    }

    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
    })

    if (!subscription) {
      return {
        ok: true,
        subscription: {
          plan: "free",
          status: "active",
          currentPeriodEnd: null,
          stripeCustomerId: null,
        },
      }
    }

    return {
      ok: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        stripeCustomerId: subscription.stripeCustomerId,
      },
    }
  } catch (err) {
    console.error("getCurrentSubscription:", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load subscription",
    }
  }
}

export async function createCheckoutSession(
  plan: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return { ok: false, error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment." }
    }

    const priceId = PLAN_PRICE_IDS[plan.toLowerCase()]
    if (!priceId?.trim()) {
      return {
        ok: false,
        error: `Plan "${plan}" is not configured. Add STRIPE_PRICE_${plan.toUpperCase()} to your environment.`,
      }
    }

    const user = await requireUser()
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) {
      return { ok: false, error: "No active workspace" }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    let customerId: string | null = null
    const existing = await prisma.subscription.findUnique({
      where: { workspaceId },
    })
    if (existing?.stripeCustomerId) {
      customerId = existing.stripeCustomerId
    }

    const s = getStripe()
    const sessionParams: Parameters<typeof s.checkout.sessions.create>[0] = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/billing?success=true`,
      cancel_url: `${baseUrl}/billing?canceled=true`,
      client_reference_id: workspaceId,
      customer_email: customerId ? undefined : user.email,
      metadata: { workspaceId, plan: plan.toLowerCase() },
    }

    if (customerId) {
      sessionParams.customer = customerId
    }

    const session = await s.checkout.sessions.create(sessionParams)

    if (!session.url) {
      return { ok: false, error: "Failed to create checkout session" }
    }

    return { ok: true, url: session.url }
  } catch (err) {
    console.error("createCheckoutSession:", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create checkout session",
    }
  }
}

export async function createBillingPortalSession(): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return { ok: false, error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment." }
    }

    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) {
      return { ok: false, error: "No active workspace" }
    }

    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
    })

    if (!subscription?.stripeCustomerId) {
      return {
        ok: false,
        error: "No billing account found. Subscribe to a plan first.",
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    })

    if (!session.url) {
      return { ok: false, error: "Failed to create billing portal session" }
    }

    return { ok: true, url: session.url }
  } catch (err) {
    console.error("createBillingPortalSession:", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to open billing portal",
    }
  }
}
