import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildContentSecurityPolicy, createNonce } from "@/lib/security/csp";
import { supabaseFetch } from "@/lib/supabase/fetch";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/callback"];

export async function proxy(request: NextRequest) {
  // Next.js reads the nonce from the request's CSP header and applies it to its own scripts.
  const csp = buildContentSecurityPolicy(createNonce(), process.env.NODE_ENV !== "production");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);
  const withCsp = <T extends NextResponse>(res: T): T => {
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  let response = withCsp(NextResponse.next({ request: { headers: requestHeaders } }));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: supabaseFetch,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll: ((cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Forward refreshed auth cookies to the server render, not just to the browser.
          requestHeaders.set("cookie", request.headers.get("cookie") ?? "");
          response = withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }) satisfies SetAllCookies,
      },
    },
  );

  let userKnown = true;
  let hasUser = false;
  try {
    const { data } = await supabase.auth.getUser();
    hasUser = Boolean(data.user);
  } catch {
    // Supabase temporarily unreachable: fall through to the page-level guards.
    userKnown = false;
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (userKnown && !hasUser && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return withCsp(
        NextResponse.json({ error: "Authentication required." }, { status: 401 }),
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return withCsp(NextResponse.redirect(loginUrl));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // File downloads end in the stored file name (".png", ".jpg"...), which the pattern above
    // skips; they still need the session refresh and the security headers.
    "/api/files/:path*",
  ],
};
