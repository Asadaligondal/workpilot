import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret?.trim()) {
    console.warn("STRIPE_WEBHOOK_SECRET is not set. Skipping webhook processing.")
    return NextResponse.json({ received: true })
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    )
  }

  let event: Stripe.Event
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    )
  }

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature"
    console.error("Stripe webhook signature verification failed:", message)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const workspaceId = session.client_reference_id ?? session.metadata?.workspaceId
        const subscriptionId = session.subscription as string | null

        if (!workspaceId) {
          console.warn("checkout.session.completed: no workspaceId in session")
          break
        }

        let customerId: string | null =
          typeof session.customer === "string"
            ? session.customer
            : (session.customer as Stripe.Customer)?.id ?? null
        let plan = (session.metadata?.plan as string) ?? "starter"

        let currentPeriodEnd: Date | null = null
        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
          currentPeriodEnd = new Date(subscription.current_period_end * 1000)
          const price = subscription.items.data[0]?.price
          if (price?.product) {
            const product = await getStripe().products.retrieve(price.product as string)
            const name = (product.name ?? "").toLowerCase()
            if (name.includes("enterprise")) plan = "enterprise"
            else if (name.includes("professional")) plan = "professional"
            else if (name.includes("starter")) plan = "starter"
          }
        }

        if (!customerId && session.customer_details?.email) {
          const customers = await getStripe().customers.list({
            email: session.customer_details.email,
            limit: 1,
          })
          customerId = customers.data[0]?.id ?? null
        }

        await prisma.subscription.upsert({
          where: { workspaceId },
          create: {
            workspaceId,
            plan,
            status: "active",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            currentPeriodEnd,
          },
          update: {
            plan,
            status: "active",
            stripeCustomerId: customerId ?? undefined,
            stripeSubscriptionId: subscriptionId ?? undefined,
            currentPeriodEnd: subscriptionId
              ? new Date((await getStripe().subscriptions.retrieve(subscriptionId)).current_period_end * 1000)
              : undefined,
          },
        })
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id
        const customerId = subscription.customer as string

        const dbSub = await prisma.subscription.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscriptionId },
              { stripeCustomerId: customerId },
            ],
          },
        })

        if (!dbSub) {
          console.warn("customer.subscription.updated: no matching subscription in DB")
          break
        }

        const price = subscription.items.data[0]?.price
        let plan = dbSub.plan
        if (price?.product) {
          const product = await getStripe().products.retrieve(price.product as string)
          const name = (product.name ?? "").toLowerCase()
          if (name.includes("enterprise")) plan = "enterprise"
          else if (name.includes("professional")) plan = "professional"
          else if (name.includes("starter")) plan = "starter"
        }

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            plan,
            status: subscription.status === "active" ? "active" : subscription.status,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        const dbSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        })

        if (!dbSub) {
          console.warn("customer.subscription.deleted: no matching subscription in DB")
          break
        }

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            plan: "free",
            status: "canceled",
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
          },
        })
        break
      }

      default:
        // Unhandled event type
        break
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
