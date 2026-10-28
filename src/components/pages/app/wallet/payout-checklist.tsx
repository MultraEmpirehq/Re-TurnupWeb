"use client";

import { ROUTES } from "@/lib/variables";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

type TStep = { label: string; done: boolean; hint?: string; href?: string };

/**
 * What stands between an organiser and their first paid sale: verified, paid
 * out to their bank, then ready. Shown until everything's done, so nobody
 * finds a missing step by a buyer's checkout failing.
 */
const PayoutChecklist = ({
  verified,
  payoutsReady,
  payoutsHint,
  currency,
}: {
  verified: boolean;
  payoutsReady: boolean;
  /** What to do next for payouts (e.g. "Finish with Stripe below"). */
  payoutsHint?: string;
  /** The currency they can sell in once ready. */
  currency?: string;
}) => {
  if (verified && payoutsReady) return null;
  const steps: TStep[] = [
    {
      label: "Get verified",
      done: verified,
      hint: verified ? undefined : "Your verification needs to be approved before you can sell.",
      href: verified ? undefined : ROUTES.VENDOR_VERIFICATION.href,
    },
    {
      label: "Set up payouts",
      done: payoutsReady,
      hint: payoutsReady ? undefined : payoutsHint,
    },
    {
      label: "Sell paid tickets",
      done: false,
      hint: currency
        ? `Price your tickets in ${currency}, the currency you're paid in.`
        : "Once payouts are set up, price your tickets in the currency you're paid in.",
    },
  ];
  return (
    <section className="rounded-[1.5rem] border border-primary-100 bg-primary-50/50 p-5">
      <p className="text-sm font-bold tracking-[0.18em] text-primary-700 uppercase">
        Before your first paid sale
      </p>
      <ol className="mt-3 space-y-3">
        {steps.map((step) => (
          <li key={step.label} className="flex items-start gap-3">
            {step.done ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="mt-0.5 size-5 shrink-0 text-secondary-300" />
            )}
            <span>
              <span
                className={cn(
                  "block font-semibold",
                  step.done ? "text-secondary-500 line-through" : "text-secondary-950",
                )}
              >
                {step.href ? (
                  <Link href={step.href} className="hover:underline">
                    {step.label}
                  </Link>
                ) : (
                  step.label
                )}
              </span>
              {step.hint && <span className="block text-sm text-secondary-500">{step.hint}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default memo(PayoutChecklist);
