import { NextRequest, NextResponse } from "next/server";
import { PREVIEW_COOKIE, isLaunched } from "@/lib/launch";

/**
 * Before launch, the home page goes to Coming soon (the rest of the site still
 * works, for links people already have and for the team). After launch, Coming
 * soon goes back to home. `/?preview=team` lets the team see the real home page
 * early; `/?preview=off` turns that off.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
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
  matcher: ["/", "/coming-soon", "/waitlist"],
};
