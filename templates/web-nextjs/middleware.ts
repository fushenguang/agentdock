import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { NextResponse, type NextRequest } from "next/server";

export const routing = defineRouting({
  locales: ["en", "zh"],
  defaultLocale: "en",
});

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment !== undefined) {
    const isLocaleLike = /^[a-z]{2}(?:-[A-Z]{2})?$/.test(firstSegment);
    const isSupportedLocale = routing.locales.includes(firstSegment as "en" | "zh");

    // Normalize unknown locale-like prefixes: /fr/hello -> /en/hello.
    if (isLocaleLike && !isSupportedLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${routing.defaultLocale}/${segments.slice(1).join("/")}`.replace(/\/$/, "");
      return NextResponse.redirect(url);
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except Next.js internals and static files.
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
