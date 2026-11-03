import React, { memo } from "react";

/** Turnupz's fee on a paid ticket, as on the pricing page. */
const FEE_PERCENT = 4;

/** An example ticket in each currency, in major units. */
const EXAMPLE_PRICE: Record<string, number> = { NGN: 10_000, CAD: 100 };

/** How one ticket's payment is split between the organiser and Turnupz. */
const SplitExplainer = ({ currency }: { currency: string }) => {
  const price = EXAMPLE_PRICE[currency] ?? 100;
  const money = (amount: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      currencyDisplay: currency === "NGN" ? "narrowSymbol" : "symbol",
      maximumFractionDigits: amount % 1 ? 2 : 0,
    }).format(amount);
  const fee = (price * FEE_PERCENT) / 100;
  return (
    <section className="rounded-[1.5rem] bg-secondary-50 p-6">
      <h2 className="text-base font-bold text-secondary-800">
        How a {money(price)} ticket is split
      </h2>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full" aria-hidden>
        <div className="bg-secondary-500" style={{ width: `${100 - FEE_PERCENT}%` }} />
        <div className="ml-0.5 flex-1 bg-primary-500" />
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-secondary-800">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-secondary-500" />
          You · <b>{money(price - fee)}</b>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary-500" />
          Turnupz ({FEE_PERCENT}%) · <b>{money(fee)}</b>
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-secondary-700/80">
        Split as the buyer pays. Your share never sits with Turnupz.
      </p>
    </section>
  );
};

export default memo(SplitExplainer);
