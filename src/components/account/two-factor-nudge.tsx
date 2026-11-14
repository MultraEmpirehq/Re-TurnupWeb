"use client";

import { getData } from "@/api";
import { Button } from "@/components/ui/button";
import Notice from "@/components/ui/notice";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useState } from "react";

const SNOOZE_DAYS = 30;
const snoozeKey = (userId: string) => `turnupz-two-factor-nudge:${userId}`;

const snoozed = (userId: string) => {
  try {
    const until = Number(window.localStorage.getItem(snoozeKey(userId)));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
};

/**
 * A nudge to turn on two-factor sign-in, for anyone who hasn't: on the admin
 * overview, the organiser dashboard and the attendee profile. "Not now" hides
 * it for 30 days on this browser. Gone once it's on.
 */
const TwoFactorNudge = ({
  className,
  gap = "1.5rem",
}: {
  className?: string;
  /** The page's gap between sections (its space-y), folded away with the card. */
  gap?: string;
}) => {
  const user = useUserStore((state) => state.userDetails);
  const [hidden, setHidden] = useState(true);
  // "Not now" folds the card away so what's below slides up, then removes it.
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (user?.id) setHidden(snoozed(user.id));
  }, [user?.id]);
  // If a browser doesn't report the end of the fold, remove it anyway.
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => setHidden(true), 450);
    return () => window.clearTimeout(timer);
  }, [closing]);

  const { data } = useQuery({
    queryKey: ["two-factor"],
    queryFn: async () =>
      (await getData<{ enabled: boolean }>("/account/two-factor")).data?.data ??
      null,
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  if (!user?.id || hidden || !data || data.enabled) return null;

  const role = user.role;
  const settings =
    role === EUserRoles.USER
      ? "/profile/settings#two-factor"
      : "/app/settings#two-factor";
  const why =
    role === EUserRoles.ADMIN
      ? "Your admin account can refund money and change other people's accounts. A code from your phone at sign-in means a stolen password isn't enough."
      : role === EUserRoles.VENDOR
        ? "Your account holds your events, sales and payouts. A code from your phone at sign-in means a stolen password isn't enough."
        : "A code from your phone at sign-in means a stolen password isn't enough to get into your tickets and orders.";

  return (
    <div
      aria-hidden={closing || undefined}
      className="grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none"
      style={{
        gridTemplateRows: closing ? "0fr" : "1fr",
        opacity: closing ? 0 : 1,
        // Takes one section gap with it, so nothing jumps when it's removed.
        marginBottom: closing ? `calc(-1 * ${gap})` : 0,
      }}
      onTransitionEnd={(event) => {
        if (
          closing &&
          event.target === event.currentTarget &&
          event.propertyName === "grid-template-rows"
        ) {
          setHidden(true);
        }
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <Notice
          tone="info"
          icon={ShieldCheck}
          title="Protect your account with two-factor sign-in"
          className={className}
          action={
            <div className="flex flex-wrap gap-2">
              <Button asChild className="h-10 rounded-full px-5">
                <Link href={settings}>Turn it on</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-full px-4"
                onClick={() => {
                  try {
                    window.localStorage.setItem(
                      snoozeKey(user.id),
                      String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000),
                    );
                  } catch {
                    // Private browsing: it shows again next visit.
                  }
                  // Reduced motion: no transition to wait for.
                  if (
                    window.matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                  )
                    setHidden(true);
                  else setClosing(true);
                }}
              >
                Not now
              </Button>
            </div>
          }
        >
          <p>{why} It takes a minute and works with any authenticator app.</p>
        </Notice>
      </div>
    </div>
  );
};

export default memo(TwoFactorNudge);
