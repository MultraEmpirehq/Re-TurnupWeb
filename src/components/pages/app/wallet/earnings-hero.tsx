"use client";

import { VendorCurrencyEarnings } from "@/hooks/use-vendor-wallet";
import { Amount, HideAmountsButton } from "@/components/pages/app/wallet/amount";
import useHideAmounts from "@/stores/hide-amounts-store";
import { format, isToday, isTomorrow } from "date-fns";
import React, { memo } from "react";

/** When the next payout reaches their bank, in plain words. */
const settlementDay = (date: string | null) => {
  if (!date) return "Soon";
  const day = new Date(date);
  if (isToday(day)) return "Today";
  if (isTomorrow(day)) return "Tomorrow";
  return format(day, "d MMM");
};

const Figure = ({
  label,
  value,
  money = true,
}: {
  label: string;
  value: string;
  /** Hidden with the other amounts. */
  money?: boolean;
}) => (
  <div className="min-w-0 rounded-2xl bg-white/10 px-3 py-3 sm:px-4">
    <p className="text-xs text-white/70">{label}</p>
    <p className="mt-1 truncate text-base font-bold sm:text-lg">{money ? <Amount value={value} /> : value}</p>
  </div>
);

/**
 * The organiser's earnings for the period at a glance, with what's reached
 * their bank and (Flutterwave) what's on its way.
 */
const EarningsHero = ({
  totals,
  periodLabel,
  onItsWay,
}: {
  totals: VendorCurrencyEarnings;
  periodLabel: string;
  /** Flutterwave payouts not paid yet; Stripe organisers see Stripe's own. */
  onItsWay?: { amount: string; nextDate: string | null } | null;
}) => {
  const hidden = useHideAmounts((state) => state.hidden);
  const [whole, fraction] = totals.earnings.formatted.withCurrency.split(".");
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-secondary-800 via-secondary-600 to-primary-500 p-6 text-white shadow-[0_24px_60px_rgba(5,119,250,0.28)] md:p-7">
      <div aria-hidden className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10" />
      <div aria-hidden className="absolute right-24 -bottom-24 size-56 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-white/75">Your earnings · {periodLabel}</p>
          <HideAmountsButton
            label={false}
            className="-mt-1 -mr-1 p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          />
        </div>
        <p className="mt-2 text-4xl leading-none font-extrabold tracking-tight md:text-[2.75rem]">
          {hidden ? (
            <Amount value="" />
          ) : (
            <>
              {whole}
              {fraction && <span className="text-2xl text-white/60">.{fraction}</span>}
            </>
          )}
        </p>
        <p className="mt-3 text-sm text-white/80">
          From <Amount value={totals.sales.formatted.withCurrency} /> in ticket sales ·{" "}
          {totals.ticketsSold.toLocaleString()} ticket{totals.ticketsSold === 1 ? "" : "s"}
          {totals.eventsCount > 0 &&
            ` across ${totals.eventsCount} event${totals.eventsCount === 1 ? "" : "s"}`}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <Figure label="Paid to your bank" value={totals.paidDirect.formatted.withCurrency} />
          {onItsWay && (
            <>
              <Figure label="On its way" value={onItsWay.amount} />
              <Figure
                label="Next payout"
                value={settlementDay(onItsWay.nextDate)}
                money={false}
              />
            </>
          )}
          {totals.owed.amount > 0 && (
            <Figure label="Owed by Turnupz" value={totals.owed.formatted.withCurrency} />
          )}
        </div>
      </div>
    </section>
  );
};

export default memo(EarningsHero);
