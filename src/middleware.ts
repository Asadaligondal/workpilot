import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const exactPublicRoutes = new Set(["/"])

const prefixPublicRoutes = [
  "/features",
  "/solutions",
  "/pricing",
  "/sample-reports",
  "/about",
  "/contact",
  "/blog",
  "/legal",
  "/sign-in",
  "/sign-up",
  "/api/auth",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("firebase-auth-token")?.value

  const isPublicRoute =
    exactPublicRoutes.has(pathname) ||
    prefixPublicRoutes.some((route) => pathname.startsWith(route))

  if (!isPublicRoute && !token) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
