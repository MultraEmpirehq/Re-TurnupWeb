"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import SiteLink from "@/components/ui/site-link";
import { getVisitorCountingConsent, setVisitorCountingConsent } from "@/lib/visitor-id";
import { CONSENT_PARAM } from "@/lib/domains";
import { Cookie } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { memo, useEffect, useState } from "react";

/** Readable before choosing, so people can see what they're agreeing to. */
const READABLE_FIRST = ["/cookie-policy", "/privacy-policy", "/terms"];

/** Fired by "Cookie settings" links to ask again. */
export const OPEN_COOKIE_CHOICE = "turnupz:cookie-choice";

/**
 * The cookie choice, before anything else on the site: essential cookies only,
 * or those plus visitor counting. Until it's made the site can't be used,
 * except the policies themselves. A choice made on the other Turnupz domain
 * arrives in the link (see siteHref) so it's only asked once.
 */
const CookieGate = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [customising, setCustomising] = useState(false);
  const [counting, setCounting] = useState(true);

  useEffect(() => {
    // Carried over from the other domain: save it and tidy the address.
    const url = new URL(window.location.href);
    const carried = url.searchParams.get(CONSENT_PARAM);
    if (carried === "1" || carried === "0") {
      setVisitorCountingConsent(carried === "1");
      url.searchParams.delete(CONSENT_PARAM);
      window.history.replaceState(window.history.state, "", url.toString());
    }
    setOpen(getVisitorCountingConsent() === null);
    const reopen = () => {
      setCounting(getVisitorCountingConsent() ?? true);
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_CHOICE, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_CHOICE, reopen);
  }, []);

  const readable = READABLE_FIRST.some((path) => pathname === path);
  const blocking = open && !readable;

  // Nothing behind it scrolls while it's waiting for an answer.
  useEffect(() => {
    if (!blocking) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [blocking]);

  if (!open) return null;

  const choose = (countVisits: boolean) => {
    setVisitorCountingConsent(countVisits);
    setOpen(false);
    setCustomising(false);
  };

  const panel = (
    <div
      role="dialog"
      aria-modal={blocking}
      aria-labelledby="cookie-choice-title"
      className="pointer-events-auto mx-auto w-full max-w-5xl rounded-3xl border border-secondary-100 bg-white p-5 shadow-[0_-12px_48px_rgba(15,23,42,0.18)] sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary-50 text-secondary-600">
            <Cookie className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="cookie-choice-title" className="text-base font-bold text-secondary-950">
              Before you continue: cookies on Turnupz
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              We use a few essential cookies to keep you signed in, keep your tickets and
              bookings secure, and remember your settings. With your permission we also count
              visits, using a random number that doesn&apos;t identify you, to see which pages
              help people find events. We never use advertising cookies or sell your data.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Read our{" "}
              <SiteLink href="/cookie-policy" className="font-semibold text-secondary-600 underline">
                Cookie Policy
              </SiteLink>{" "}
              and{" "}
              <SiteLink href="/privacy-policy" className="font-semibold text-secondary-600 underline">
                Privacy Policy
              </SiteLink>
              . You can change your choice any time from Cookie settings at the bottom of the page.
            </p>
          </div>
        </div>
        {!customising && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <Button variant="ghost" className="rounded-full" onClick={() => setCustomising(true)}>
              Customise
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => choose(false)}>
              Essential only
            </Button>
            <Button className="rounded-full px-6" onClick={() => choose(true)}>
              Accept all
            </Button>
          </div>
        )}
      </div>

      {customising && (
        <div className="mt-5 space-y-3 border-t border-secondary-100 pt-5">
          <div className="flex items-start justify-between gap-4 rounded-2xl bg-secondary-50/60 p-4">
            <div>
              <p className="text-sm font-semibold text-secondary-950">Essential</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Signing in, checkout, your tickets and your settings. The site doesn&apos;t work
                without these, so they&apos;re always on.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Always on
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-secondary-100 p-4">
            <div>
              <p className="text-sm font-semibold text-secondary-950">Visitor counting</p>
              <p className="text-xs leading-5 text-muted-foreground">
                A random number, kept on your device, so we can count visits and see which pages
                work. It doesn&apos;t identify you and is never shared with advertisers.
              </p>
            </div>
            <Switch checked={counting} onCheckedChange={setCounting} aria-label="Visitor counting" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setCustomising(false)}>
              Back
            </Button>
            <Button className="rounded-full px-6" onClick={() => choose(counting)}>
              Save my choice
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* The page stays in view, but can't be used until the choice is made. */}
      {blocking && <div aria-hidden className="fixed inset-0 z-[10000] bg-secondary-950/15" />}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[10001] p-3 sm:p-5">{panel}</div>
    </>
  );
};

export default memo(CookieGate);
