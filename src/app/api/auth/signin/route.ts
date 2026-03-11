import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/firebase"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Verify credentials and create custom token
    // Note: Firebase Admin SDK doesn't have signInWithEmailAndPassword
    // We need to use Firebase Client SDK for authentication, then verify token server-side
    // For now, we'll create a session token after client-side auth
    
    // This endpoint will be called after client-side Firebase Auth succeeds
    // The client will send the ID token here to create a session cookie
    
    return NextResponse.json({ error: "Use client-side Firebase Auth, then call /api/auth/session" }, { status: 400 })
  } catch (error) {
    console.error("Sign in error:", error)
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
  }
}
