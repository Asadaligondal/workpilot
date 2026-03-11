import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/firebase"
import { cookies } from "next/headers"

/**
 * Create a session cookie from Firebase ID token.
 * Falls back to storing the raw ID token if session cookie creation fails
 * (e.g. when the token is older than 5 minutes).
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 })
    }

    const decodedToken = await auth.verifyIdToken(idToken)
    
    const expiresIn = 60 * 60 * 24 * 7 * 1000 // 7 days
    let tokenToStore: string

    try {
      tokenToStore = await auth.createSessionCookie(idToken, { expiresIn })
    } catch (cookieErr) {
      console.warn("Session cookie creation failed, storing ID token directly:", cookieErr)
      tokenToStore = idToken
    }

    const cookieStore = await cookies()
    cookieStore.set("firebase-auth-token", tokenToStore, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn / 1000,
      path: "/",
    })

    return NextResponse.json({ success: true, uid: decodedToken.uid })
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

/**
 * Sign out - clear session cookie
 */
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("firebase-auth-token")
  
  return NextResponse.json({ success: true })
}
