import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { PRIVATE_RE } from "@/lib/utils";

/**
 * Runs before every page request.
 * Private routes without a session cookie go to /login and come back afterwards.
 * A valid cookie always passes, so reloading a private page never bounces a signed-in user to login.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PRIVATE_RE.test(pathname) && !getSessionCookie(request)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname + search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)"],
};
