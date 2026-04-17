import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PATHS = ["/login"];

function stripLocale(pathname: string): {
  locale: string | null;
  rest: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  if (maybeLocale && routing.locales.includes(maybeLocale as never)) {
    return { locale: maybeLocale, rest: "/" + segments.slice(1).join("/") };
  }
  return { locale: null, rest: pathname };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static / internal / api / auth routes.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Let next-intl handle locale negotiation / redirects first.
  const intlResponse = intlMiddleware(req);

  // If intl middleware returned a redirect, honor it (it may be adding the
  // locale prefix). Otherwise, continue with auth gating.
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const { locale, rest } = stripLocale(pathname);
  const effectiveLocale = locale ?? routing.defaultLocale;

  const isPublic = PUBLIC_PATHS.some(
    (p) => rest === p || rest.startsWith(p + "/"),
  );

  if (!isPublic) {
    // Check session cookie presence cheaply in middleware. We rely on the
    // Auth.js session cookie existing; real validation happens in server
    // components / actions via auth().
    const sessionCookie =
      req.cookies.get("authjs.session-token") ??
      req.cookies.get("__Secure-authjs.session-token");
    if (!sessionCookie) {
      const url = req.nextUrl.clone();
      url.pathname = `/${effectiveLocale}/login`;
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return intlResponse;
}

export const config = {
  // Match all paths except Next internals, static files, and auth API.
  matcher: ["/((?!_next|api/auth|.*\\..*).*)"],
};
