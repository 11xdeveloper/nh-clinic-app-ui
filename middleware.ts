import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ["/login"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // If no session and trying to access protected route
  if (!sessionToken && !isPublicPath) {
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }

  // If has session and trying to access login page
  if (sessionToken && isPublicPath) {
    const url = new URL("/dashboard", request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
}
