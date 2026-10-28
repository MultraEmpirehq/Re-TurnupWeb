"use client";

import { FEE_LABEL, formatNaira, ticketFee } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import React, { memo, useId, useState } from "react";

const PRESETS = [2000, 5000, 15000, 50000];

/**
 * Try a ticket price and a crowd size and see who pays what. The fee comes off
 * each ticket: buyers pay the ticket price and the organiser gets the rest.
 */
const FeeCalculator = () => {
  const [price, setPrice] = useState(5000);
  const [quantity, setQuantity] = useState(200);
  const priceId = useId();
  const quantityId = useId();

  const fee = ticketFee(price);
  const buyerPays = price;
  const youGetEach = price - fee;
  const youGetTotal = youGetEach * quantity;

  return (
    <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_80px_-40px_rgba(2,6,23,0.45)] ring-1 ring-black/5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-8 p-6 sm:p-10">
        <div className="space-y-3">
          <label htmlFor={priceId} className="flex items-baseline justify-between gap-4">
            <span className="font-semibold text-secondary-950">Ticket price</span>
            <span className="text-2xl font-bold text-secondary-950 tabular-nums">
              {price ? formatNaira(price) : "Free"}
            </span>
          </label>
          <input
            id={priceId}
            type="range"
            min={0}
            max={100000}
            step={500}
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex flex-wrap gap-2">
            {[0, ...PRESETS].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPrice(preset)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                  price === preset
                    ? "border-secondary-950 bg-secondary-950 text-white"
                    : "border-secondary-100 text-secondary-800 hover:border-secondary-300",
                )}
              >
                {preset ? formatNaira(preset) : "Free"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor={quantityId} className="flex items-baseline justify-between gap-4">
            <span className="font-semibold text-secondary-950">Tickets sold</span>
            <span className="text-2xl font-bold text-secondary-950 tabular-nums">
              {quantity.toLocaleString("en-NG")}
            </span>
          </label>
          <input
            id={quantityId}
            type="range"
            min={10}
            max={5000}
            step={10}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </div>

      </div>

      <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden bg-secondary-950 p-6 text-white sm:p-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-16 size-72 rounded-full bg-primary/30 blur-[90px]" />
          <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-secondary/25 blur-[90px]" />
        </div>
        <div className="space-y-5" aria-live="polite">
          <p className="text-sm font-semibold tracking-wider text-primary-300 uppercase">
            Per ticket
          </p>
          <dl className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/65">Buyer pays</dt>
              <dd className="text-xl font-semibold tabular-nums">
                {buyerPays ? formatNaira(buyerPays) : "Free"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/65">Turnupz fee ({FEE_LABEL})</dt>
              <dd className="text-xl font-semibold tabular-nums">
                {fee ? formatNaira(fee) : formatNaira(0)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
              <dt className="text-white/65">You get</dt>
              <dd className="text-xl font-semibold text-emerald-300 tabular-nums">
                {formatNaira(Math.max(0, youGetEach))}
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="text-sm text-white/55">
            You take home from {quantity.toLocaleString("en-NG")} tickets
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
            {formatNaira(Math.max(0, youGetTotal))}
          </p>
          {!price && (
            <p className="mt-2 text-sm text-emerald-300">
              Free events cost nothing to run on Turnupz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(FeeCalculator);
