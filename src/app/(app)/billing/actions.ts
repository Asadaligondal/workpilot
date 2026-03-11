"use server"

import { getActiveWorkspaceId } from "@/lib/workspace"
import { findFirst, where } from "@/lib/firestore-helpers"
import { db } from "@/lib/firebase"

export type SubscriptionData = {
  plan: string
  status: string
  currentPeriodEnd: Date | null
}

export async function getCurrentSubscription(): Promise<
  | { ok: true; subscription: SubscriptionData }
  | { ok: false; error: string }
> {
  try {
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) {
      return { ok: false, error: "No active workspace" }
    }

    const subscriptionDoc = await db.collection("subscriptions").doc(workspaceId).get()
    
    if (!subscriptionDoc.exists) {
      return {
        ok: true,
        subscription: {
          plan: "free",
          status: "active",
          currentPeriodEnd: null,
        },
      }
    }

    const subscription = subscriptionDoc.data()
    const periodEnd = subscription?.currentPeriodEnd
    const currentPeriodEnd = periodEnd
      ? (periodEnd instanceof Date 
          ? periodEnd 
          : (periodEnd as any)?.toDate?.() || null)
      : null
    
    return {
      ok: true,
      subscription: {
        plan: subscription?.plan || "free",
        status: subscription?.status || "active",
        currentPeriodEnd,
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
