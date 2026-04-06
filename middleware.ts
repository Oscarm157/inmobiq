import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes that require authentication
const PROTECTED_ROUTES = ["/perfil", "/exportar", "/admin"]

// Routes that require admin role (subset of protected)
const ADMIN_ROUTES = ["/admin"]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do NOT add any logic between createServerClient and getUser
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect to login if accessing protected routes without auth
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("redirectedFrom", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Fetch profile for role + active checks (only if user is logged in and on protected/admin route)
  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  )
  if (user && (isProtected || isAdminRoute)) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single()

    // Block deactivated users
    if (profile && profile.is_active === false) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/login"
      loginUrl.searchParams.set("error", "account_disabled")
      return NextResponse.redirect(loginUrl)
    }

    // Admin-only routes: check role
    if (isAdminRoute && profile?.role !== "admin") {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = "/"
      return NextResponse.redirect(homeUrl)
    }
  }

  // Redirect logged-in users away from /login
  if (pathname === "/login" && user) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = "/"
    return NextResponse.redirect(homeUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
