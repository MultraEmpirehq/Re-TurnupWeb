import { NextRequest, NextResponse } from "next/server";
import { PREVIEW_COOKIE, isLaunched } from "@/lib/launch";
import {
  APP_HOSTS,
  APP_ORIGIN,
  COMPANY_HOSTS,
  COMPANY_ORIGIN,
  domainFor,
  isOnBoth,
} from "@/lib/domains";

const elsewhere = (request: NextRequest, origin: string, pathname: string) => {
  const target = new URL(`${pathname}${request.nextUrl.search}`, origin);
  return NextResponse.redirect(target, 308);
};

/**
 * Sends a page asked for on the wrong domain to the right one (see
 * lib/domains), or null to carry on here.
 */
const domainRedirect = (request: NextRequest) => {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;
  const onCompany = COMPANY_HOSTS.includes(host);
  const onApp = APP_HOSTS.includes(host);
  if ((!onCompany && !onApp) || isOnBoth(pathname)) return null;
  // The product's front door is Explore; the company's is its home page.
  if (onApp && pathname === "/") return NextResponse.redirect(new URL("/explore", request.url), 307);
  const belongs = domainFor(pathname);
  if (belongs === "company" && onApp) return elsewhere(request, COMPANY_ORIGIN, pathname);
  if (belongs === "app" && onCompany) return elsewhere(request, APP_ORIGIN, pathname);
  return null;
};

/**
 * Before launch, the home page goes to Coming soon (the rest of the site still
 * works, for links people already have and for the team). After launch, Coming
 * soon goes back to home. `/?preview=team` lets the team see the real home page
 * early; `/?preview=off` turns that off.
 */
export function proxy(request: NextRequest) {
  const moved = domainRedirect(request);
  if (moved) return moved;

  const { pathname, searchParams } = request.nextUrl;
  // Only the home page and the waitlist pages wait for launch.
  if (pathname !== "/" && pathname !== "/coming-soon" && pathname !== "/waitlist") {
    return NextResponse.next();
  }
  const launched = isLaunched();

  if (pathname === "/coming-soon" || pathname === "/waitlist") {
    if (launched) return NextResponse.redirect(new URL("/", request.url));
    if (pathname === "/waitlist") {
      const target = new URL("/coming-soon", request.url);
      const ref = searchParams.get("ref");
      if (ref) target.searchParams.set("ref", ref);
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  // Home only from here.
  const preview = searchParams.get("preview");
  if (preview === "team") {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(PREVIEW_COOKIE, "1", {
      maxAge: 60 * 60 * 24 * 60,
      sameSite: "lax",
    });
    return response;
  }
  if (preview === "off") {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete(PREVIEW_COOKIE);
    return response;
  }
  if (launched || request.cookies.get(PREVIEW_COOKIE)?.value === "1") {
    return NextResponse.next();
  }
  // Keep ?ref= (where they came from) on the way.
  const target = new URL("/coming-soon", request.url);
  const ref = searchParams.get("ref");
  if (ref) target.searchParams.set("ref", ref);
  return NextResponse.redirect(target, 307);
}

export const config = {
  // Every page (for the domain split); not Next's own files or static files.
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
