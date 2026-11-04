"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import SiteLink from "@/components/ui/site-link";
import { getVisitorCountingConsent, setVisitorCountingConsent } from "@/lib/visitor-id";
import { CONSENT_PARAM } from "@/lib/domains";
import { X } from "lucide-react";
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

  const primary =
    "h-11 flex-1 rounded-lg bg-primary text-sm font-bold tracking-wide text-white uppercase hover:bg-primary/90";

  const panel = (
    <div
      role="dialog"
      aria-modal={blocking}
      aria-labelledby="cookie-choice-title"
      className="pointer-events-auto mx-auto flex max-h-[min(78vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-secondary-950 text-white shadow-[0_24px_60px_rgba(1,12,25,0.45)] ring-1 ring-white/10"
    >
      <div className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-6">
        <h2 id="cookie-choice-title" className="text-base font-bold tracking-[0.12em] uppercase">
          {customising ? "Cookie settings" : "Cookie notice"}
        </h2>
        <button
          type="button"
          onClick={() => choose(false)}
          aria-label="Close and use essential cookies only"
          className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {!customising ? (
        <div className="space-y-5 px-5 pt-3 pb-5 sm:px-6">
          <p className="text-sm leading-6 text-white/80">
            We use cookies to keep you signed in and the site working. With your OK we
            also count visits, anonymously, to see what&apos;s working. No ads, and nothing
            sold to anyone. You can change this any time in Cookie settings, and read more
            in our{" "}
            <SiteLink href="/cookie-policy" className="font-semibold text-white underline underline-offset-2">
              Cookie Policy
            </SiteLink>
            .
          </p>
          <div className="flex gap-3">
            <Button className={primary} onClick={() => choose(true)}>
              Accept all
            </Button>
            <Button className={primary} onClick={() => choose(false)}>
              Reject all
            </Button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setCustomising(true)}
              className="text-sm font-semibold tracking-wide text-white uppercase underline underline-offset-4 hover:text-white/80"
            >
              Cookie settings
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pt-3 pb-4 text-sm leading-6 text-white/80 sm:px-6">
            <p>
              Cookies are small files a site keeps in your browser. Some are needed for
              Turnupz to work; the one below is your choice. Blocking the essential ones in
              your browser stops sign-in from working.
            </p>
            <div className="rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-white">Essential</p>
                <span className="text-xs font-semibold text-white/55">Always on</span>
              </div>
              <p className="mt-1 text-white/65">
                Keep you signed in, remember your settings and keep checkout secure.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="cookie-counting" className="font-semibold text-white">
                  Visitor counting
                </label>
                <Switch id="cookie-counting" checked={counting} onCheckedChange={setCounting} />
              </div>
              <p className="mt-1 text-white/65">
                A random number, not your name, so we can count visits and see which pages
                help. Never used for ads.
              </p>
            </div>
            <SiteLink href="/cookie-policy" className="inline-block font-semibold text-white underline underline-offset-2">
              Read the Cookie Policy
            </SiteLink>
          </div>
          <div className="space-y-2.5 border-t border-white/10 px-5 py-4 sm:px-6">
            <Button className={`${primary} w-full`} onClick={() => choose(true)}>
              Allow all
            </Button>
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-lg border-white/25 bg-transparent text-sm font-bold tracking-wide text-white uppercase hover:bg-white/10 hover:text-white"
                onClick={() => choose(false)}
              >
                Reject all
              </Button>
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-lg border-white/25 bg-transparent text-sm font-bold tracking-wide text-white uppercase hover:bg-white/10 hover:text-white"
                onClick={() => choose(counting)}
              >
                Save choices
              </Button>
            </div>
          </div>
        </>
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
