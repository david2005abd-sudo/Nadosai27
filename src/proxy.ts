import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ENABLED } from "@/lib/constants";

const PROTECTED_PREFIXES = ["/app", "/admin"];
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

function copySupabaseState(target: NextResponse, source: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie.name, cookie.value);
  }
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
  return target;
}

function isAuthOrAppPath(path: string): boolean {
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(path) || path.startsWith("/auth/");
  return isProtected || isAuthPage;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (!AUTH_ENABLED) {
    if (isAuthOrAppPath(path)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        for (const [name, value] of Object.entries(headers ?? {})) {
          if (value) response.headers.set(name, value);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as { sub?: string; app_metadata?: { role?: string } } | undefined;

  if (claims?.sub) {
    const isAdmin = claims.app_metadata?.role === "admin";
    if ((path === "/admin" || path.startsWith("/admin/")) && !isAdmin) {
      return copySupabaseState(NextResponse.redirect(new URL("/app", request.url)), response);
    }
    if (AUTH_PAGES.includes(path)) {
      return copySupabaseState(NextResponse.redirect(new URL("/app", request.url)), response);
    }
    return response;
  }

  if (isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return copySupabaseState(NextResponse.redirect(loginUrl), response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
