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
      className="pointer-events-auto mx-auto w-full max-w-3xl rounded-2xl bg-secondary-950 px-4 py-3.5 text-white shadow-[0_18px_50px_rgba(1,12,25,0.35)] sm:px-5"
    >
      {!customising ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Cookie className="size-5 shrink-0 text-primary-300" aria-hidden />
            <p id="cookie-choice-title" className="text-sm leading-5 text-white/85">
              We use cookies to keep you signed in, and count visits if you allow it. No ads.{" "}
              <SiteLink href="/cookie-policy" className="font-semibold text-white underline underline-offset-2">
                Learn more
              </SiteLink>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setCustomising(true)}
              className="px-2 text-sm font-semibold text-white/70 hover:text-white"
            >
              Manage
            </button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 rounded-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white sm:flex-none"
              onClick={() => choose(false)}
            >
              Essential only
            </Button>
            <Button size="sm" className="flex-1 rounded-full px-5 sm:flex-none" onClick={() => choose(true)}>
              Accept
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p id="cookie-choice-title" className="text-sm font-semibold">Cookie settings</p>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>
              Essential <span className="text-white/55">· sign-in and checkout</span>
            </span>
            <span className="text-xs font-semibold text-white/55">Always on</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>
              Visitor counting <span className="text-white/55">· anonymous</span>
            </span>
            <Switch checked={counting} onCheckedChange={setCounting} aria-label="Visitor counting" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCustomising(false)}
              className="px-2 text-sm font-semibold text-white/70 hover:text-white"
            >
              Back
            </button>
            <Button size="sm" className="rounded-full px-5" onClick={() => choose(counting)}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* The page stays in view, but can't be used until the choice is made. */}
      {blocking && <div aria-hidden className="fixed inset-0 z-[10000]" />}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[10001] p-3 sm:p-6">{panel}</div>
    </>
  );
};

export default memo(CookieGate);
