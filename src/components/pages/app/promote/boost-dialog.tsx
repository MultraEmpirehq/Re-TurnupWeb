"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IBoost,
  TBoostPlacement,
  useBoostQuote,
  useCreateBoost,
  useEventBoosts,
  useStopBoost,
} from "@/hooks/use-boosts";
import { IEventDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Loader2, Minus, Plus, Rocket } from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import { toast } from "sonner";

const PLACEMENTS: { id: TBoostPlacement; title: string; body: string }[] = [
  {
    id: "HOME",
    title: "Home · Featured",
    body: "The big card at the top of the home page",
  },
  {
    id: "EXPLORE",
    title: "Explore · First row",
    body: "First in Explore, in your city's list",
  },
  {
    id: "SEARCH",
    title: "Search",
    body: "First when people search for your event, its city or its acts",
  },
];

const PHASE: Record<IBoost["phase"], { label: string; className: string }> = {
  awaiting_payment: {
    label: "Waiting for payment",
    className: "bg-secondary-50 text-secondary-600",
  },
  payment_failed: {
    label: "Payment failed",
    className: "bg-red-50 text-red-700",
  },
  in_review: {
    label: "Being checked",
    className: "bg-amber-50 text-amber-800",
  },
  scheduled: { label: "Starts soon", className: "bg-sky-50 text-sky-800" },
  live: { label: "● Live", className: "bg-emerald-50 text-emerald-700" },
  paused: { label: "Paused", className: "bg-amber-50 text-amber-800" },
  ended: { label: "Ended", className: "bg-secondary-50 text-secondary-500" },
  stopped: {
    label: "Stopped",
    className: "bg-secondary-50 text-secondary-500",
  },
  rejected: { label: "Not approved", className: "bg-red-50 text-red-700" },
};

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const today = () => new Date().toISOString().slice(0, 10);

const BoostRow: React.FC<{ boost: IBoost }> = ({ boost }) => {
  const stop = useStopBoost();
  const [confirming, setConfirming] = useState(false);
  const phase = PHASE[boost.phase] ?? PHASE.ended;
  const canStop = ["live", "scheduled", "in_review", "paused"].includes(
    boost.phase,
  );
  return (
    <li className="space-y-2 rounded-2xl border border-secondary-100 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold",
              phase.className,
            )}
          >
            {phase.label}
          </span>
          <span className="font-semibold text-secondary-900">
            {boost.placements.map((item) => item.label).join(" + ")}
          </span>
          <span className="text-secondary-500">
            · {boost.area.kind === "city" ? boost.area.name : "Whole country"}
          </span>
        </span>
        <span className="text-xs text-secondary-500">
          {dayLabel(boost.startsAt)} → {dayLabel(boost.endsAt)}
        </span>
      </div>
      {boost.phase === "in_review" && boost.reviewReasons.length > 0 && (
        <p className="text-xs text-amber-800">
          We check a few boosts first:{" "}
          {boost.reviewReasons.join(", ").toLowerCase()}. Usually within an
          hour.
        </p>
      )}
      {boost.phase === "paused" && (
        <p className="text-xs text-amber-800">
          {boost.pausedReason}. Our team is looking at it.
        </p>
      )}
      {boost.reviewNote && ["rejected", "stopped"].includes(boost.phase) && (
        <p className="text-xs text-secondary-600">{boost.reviewNote}</p>
      )}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { value: boost.stats.impressions.toLocaleString(), label: "saw it" },
          { value: boost.stats.clicks.toLocaleString(), label: "opened it" },
          { value: boost.stats.tickets.toLocaleString(), label: "tickets" },
          {
            value: boost.stats.sales.formatted?.withCurrency ?? "—",
            label: `sales · paid ${boost.amount.formatted?.withCurrency}`,
          },
        ].map((stat) => (
          <span
            key={stat.label}
            className="rounded-xl bg-secondary-50/70 px-2 py-2"
          >
            <b className="block text-sm text-secondary-950 tabular-nums">
              {stat.value}
            </b>
            <span className="block text-[11px] text-secondary-500">
              {stat.label}
            </span>
          </span>
        ))}
      </div>
      {boost.refunded.amount > 0 && (
        <p className="text-xs text-secondary-500">
          {boost.refunded.formatted?.withCurrency} refunded to your card.
        </p>
      )}
      {canStop && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-lg text-red-600 hover:bg-red-50"
          onClick={() => setConfirming(true)}
        >
          Stop boost
        </Button>
      )}
      <ConfirmDialog
        open={confirming}
        title="Stop this boost?"
        description="It comes off Turnupz now. The whole days it hasn't used go back to your card."
        confirmLabel="Stop boost"
        tone="danger"
        busy={stop.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          stop.mutate(boost.id, {
            onSuccess: () => {
              toast.success(
                "Boost stopped. The unused days are on their way back to your card.",
              );
              setConfirming(false);
            },
            onError: (error) =>
              toast.error(
                constructErrorMessage(
                  error as TApiErrorResponseType,
                  "Couldn't stop it.",
                ),
              ),
          })
        }
      />
    </li>
  );
};

/**
 * Boost an event to the top of Turnupz: where (Home, Explore, Search), the city
 * or the whole country, from when and for how many days. It's priced live and
 * paid by card; most boosts start straight away, some get a quick check.
 */
const BoostDialog: React.FC<{
  event: IEventDetailsType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ event, open, onOpenChange }) => {
  const [placements, setPlacements] = useState<TBoostPlacement[]>([
    "HOME",
    "EXPLORE",
  ]);
  const [area, setArea] = useState<"city" | "country">(
    event.eventCity ? "city" : "country",
  );
  const [start, setStart] = useState(today());
  const [days, setDays] = useState(5);
  const startsAt =
    start === today() ? undefined : new Date(`${start}T09:00:00`).toISOString();

  const request = useMemo(
    () =>
      open ? { eventId: event.id, placements, area, days, startsAt } : null,
    [area, days, event.id, open, placements, startsAt],
  );
  const { data: quote, isFetching, error } = useBoostQuote(request);
  // Each placement's own price per day, for the cards.
  const { data: perDay } = useBoostQuote(
    open
      ? {
          eventId: event.id,
          placements: ["HOME", "EXPLORE", "SEARCH"],
          area,
          days: 1,
        }
      : null,
  );
  const create = useCreateBoost();
  const { data: boosts = [] } = useEventBoosts(event.id, open);

  const toggle = (id: TBoostPlacement) =>
    setPlacements((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const pay = async () => {
    if (!request) return;
    try {
      const result = await create.mutateAsync({
        ...request,
        callbackUrl: `${window.location.origin}/app/events?boost={{boostId}}`,
      });
      if (result?.url) window.location.href = result.url;
    } catch (failure) {
      toast.error(
        constructErrorMessage(
          failure as TApiErrorResponseType,
          "Couldn't start the payment.",
        ),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto rounded-[1.6rem] p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-secondary-100 px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-secondary-950">
            <Rocket className="size-5 text-primary" aria-hidden />
            Boost {event.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-secondary-500">
            Show it first on Turnupz, labelled Sponsored, until the event
            starts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-extrabold tracking-wide text-secondary-400">
                WHERE
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {PLACEMENTS.map((item) => {
                  const on = placements.includes(item.id);
                  const price = perDay?.lines.find(
                    (line) => line.placement === item.id,
                  )?.perDay;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(item.id)}
                      className={cn(
                        "rounded-2xl border-2 p-3 text-left transition-colors",
                        on
                          ? "border-secondary-500 bg-secondary-50/70"
                          : "border-secondary-100 hover:border-secondary-300",
                      )}
                    >
                      <span className="flex items-center justify-between text-sm font-extrabold text-secondary-950">
                        {item.title}
                        {on && (
                          <Check
                            className="size-4 text-secondary-600"
                            aria-hidden
                          />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-secondary-500">
                        {item.body}
                      </span>
                      <span className="mt-2 block text-sm font-extrabold text-secondary-900">
                        {price?.formatted?.withCurrency ?? "…"}
                        <span className="text-xs font-semibold text-secondary-500">
                          /day
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-xs font-extrabold tracking-wide text-secondary-400">
                  WHO SEES IT
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-secondary-50 p-1">
                  {(["city", "country"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={value === "city" && !event.eventCity}
                      onClick={() => setArea(value)}
                      className={cn(
                        "rounded-lg py-2 text-sm font-bold disabled:opacity-40",
                        area === value
                          ? "bg-white text-secondary-950 shadow-sm"
                          : "text-secondary-600",
                      )}
                    >
                      {value === "city"
                        ? (event.eventCity ?? "Your city")
                        : "Whole country"}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-secondary-500">
                  The whole country costs 1.5×.
                </p>
              </div>
              <div>
                <p className="text-xs font-extrabold tracking-wide text-secondary-400">
                  WHEN
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="date"
                    value={start}
                    min={today()}
                    onChange={(change) =>
                      setStart(change.target.value || today())
                    }
                    aria-label="Start date"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-secondary-200 px-2 text-sm"
                  />
                  <span className="flex items-center rounded-xl border border-secondary-200">
                    <button
                      type="button"
                      aria-label="One day fewer"
                      onClick={() => setDays((value) => Math.max(1, value - 1))}
                      className="px-2 py-2"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-14 text-center text-sm font-bold tabular-nums">
                      {days} {days === 1 ? "day" : "days"}
                    </span>
                    <button
                      type="button"
                      aria-label="One more day"
                      onClick={() =>
                        setDays((value) => Math.min(30, value + 1))
                      }
                      className="px-2 py-2"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </span>
                </div>
                {quote && (
                  <p className="mt-1 text-[11px] text-secondary-500">
                    Ends {dayLabel(quote.endsAt)}
                    {quote.shortened ? " (when the event starts)" : ""}
                  </p>
                )}
              </div>
            </div>

            {boosts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-extrabold tracking-wide text-secondary-400">
                  THIS EVENT&apos;S BOOSTS
                </p>
                <ul className="space-y-2">
                  {boosts.map((boost) => (
                    <BoostRow key={boost.id} boost={boost} />
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-3 self-start rounded-2xl bg-secondary-50/70 p-4 md:sticky md:top-0">
            <p className="text-xs font-extrabold tracking-wide text-secondary-400">
              PRICE
            </p>
            {!placements.length ? (
              <p className="text-sm text-secondary-500">
                Pick at least one place to show it.
              </p>
            ) : error && !quote ? (
              <p className="text-sm text-red-700">
                {constructErrorMessage(
                  error as unknown as TApiErrorResponseType,
                  "Couldn't price that.",
                )}
              </p>
            ) : quote ? (
              <>
                <ul
                  className={cn(
                    "space-y-1.5 text-sm",
                    isFetching && "opacity-60",
                  )}
                >
                  {quote.lines.map((line) => (
                    <li
                      key={line.placement}
                      className="flex justify-between gap-2"
                    >
                      <span className="text-secondary-700">
                        {line.label} × {quote.days}
                      </span>
                      <b className="tabular-nums">
                        {line.total.formatted?.withCurrency}
                      </b>
                    </li>
                  ))}
                  {quote.discount.amount > 0 && (
                    <li className="flex justify-between gap-2 text-emerald-700">
                      <span>Bundle: 10% off</span>
                      <b className="shrink-0 whitespace-nowrap tabular-nums">
                        −{quote.discount.formatted?.withCurrency}
                      </b>
                    </li>
                  )}
                </ul>
                <div className="flex items-baseline justify-between border-t border-secondary-200 pt-3">
                  <span className="font-extrabold text-secondary-950">
                    Total
                  </span>
                  <span className="text-xl font-extrabold text-secondary-950 tabular-nums">
                    {quote.total.formatted?.withCurrency}
                  </span>
                </div>
                {quote.eligible === false ? (
                  <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                    Get the event ready first:{" "}
                    {quote.missing?.join(", ").toLowerCase() ||
                      "it must be published and still to come"}
                    .
                  </p>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void pay()}
                    disabled={create.isPending || isFetching}
                    className="h-11 w-full rounded-xl bg-linear-to-r from-secondary-500 to-primary font-bold text-white hover:opacity-90"
                  >
                    {create.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Rocket className="size-4" aria-hidden />
                    )}
                    Pay {quote.total.formatted?.withCurrency} and boost
                  </Button>
                )}
                <p className="text-[11px] leading-5 text-secondary-500">
                  Most boosts start as soon as they&apos;re paid; some get a quick
                  check first. Stop any time and the unused days go back to your
                  card.
                </p>
              </>
            ) : (
              <Loader2
                className="size-4 animate-spin text-secondary-400"
                aria-label="Pricing"
              />
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(BoostDialog);
