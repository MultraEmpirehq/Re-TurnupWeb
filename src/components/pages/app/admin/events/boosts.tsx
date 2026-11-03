"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import {
  IBoost,
  TBoostPrice,
  useAdminBoostActions,
  useAdminBoosts,
  useBoostPrices,
  useSetBoostPrice,
} from "@/hooks/use-boosts";
import { cn } from "@/lib/utils";
import FeatureSwitch from "../feature-switch";
import { Rocket } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FilterTabs,
  ListSkeleton,
  NoteDialog,
  PageHeading,
} from "../moderation/moderation-ui";

const TABS: { value: string | undefined; label: string }[] = [
  { value: "IN_REVIEW", label: "To check" },
  { value: "PAUSED", label: "Paused" },
  { value: "ACTIVE", label: "Running" },
  { value: undefined, label: "All" },
];

const PHASE_STYLE: Record<string, string> = {
  in_review: "bg-amber-50 text-amber-800",
  paused: "bg-amber-50 text-amber-800",
  live: "bg-emerald-50 text-emerald-700",
  scheduled: "bg-sky-50 text-sky-800",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const count = (value: number, noun: string) =>
  `${value.toLocaleString()} ${noun}${value === 1 ? "" : "s"}`;

const BoostItem: React.FC<{ boost: IBoost }> = ({ boost }) => {
  const { approve, reject, stop } = useAdminBoostActions();
  const [asking, setAsking] = useState<"reject" | "stop" | null>(null);
  const busy = approve.isPending || reject.isPending || stop.isPending;
  const fail = (error: unknown) =>
    toast.error(
      constructErrorMessage(
        error as TApiErrorResponseType,
        "That didn't work.",
      ),
    );
  const waiting = boost.phase === "in_review" || boost.phase === "paused";
  const running = boost.phase === "live" || boost.phase === "scheduled";

  return (
    <li className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/admin/events/${boost.event.id}`}
              className="font-semibold hover:underline"
            >
              {boost.event.name}
            </Link>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold capitalize",
                PHASE_STYLE[boost.phase] ?? "bg-muted text-muted-foreground",
              )}
            >
              {boost.phase.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {boost.organiser?.name} ({boost.organiser?.email}) ·{" "}
            {boost.placements.map((item) => item.label).join(" + ")} ·{" "}
            {boost.area.kind === "city"
              ? boost.area.name
              : `All of ${boost.area.name}`}{" "}
            · {when(boost.startsAt)} → {when(boost.endsAt)}
          </p>
          {boost.reviewReasons.length > 0 && boost.phase === "in_review" && (
            <p className="text-sm text-amber-800">
              Why it&apos;s here: {boost.reviewReasons.join(" · ")}
            </p>
          )}
          {boost.pausedReason && boost.phase === "paused" && (
            <p className="text-sm text-amber-800">{boost.pausedReason}</p>
          )}
        </div>
        <div className="shrink-0 text-sm sm:text-right">
          <b className="block text-lg">
            {boost.amount.formatted?.withCurrency}
          </b>
          <span className="text-xs text-muted-foreground">
            {count(boost.stats.impressions, "view")} ·{" "}
            {count(boost.stats.clicks, "open")} ·{" "}
            {count(boost.stats.tickets, "ticket")}
          </span>
        </div>
      </div>
      {(waiting || running) && (
        <div className="flex flex-wrap gap-2">
          {waiting && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                approve.mutate(boost.id, {
                  onSuccess: () => toast.success("Approved. It's running."),
                  onError: fail,
                })
              }
            >
              {boost.phase === "paused" ? "Looks fine, resume" : "Approve"}
            </Button>
          )}
          {boost.phase === "in_review" && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setAsking("reject")}
            >
              Decline and refund
            </Button>
          )}
          {(running || boost.phase === "paused") && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setAsking("stop")}
              className="text-red-600"
            >
              Stop and refund unused days
            </Button>
          )}
        </div>
      )}
      <NoteDialog
        open={asking !== null}
        title={asking === "reject" ? "Decline this boost?" : "Stop this boost?"}
        description={
          asking === "reject"
            ? "It's refunded in full and the organiser is told why."
            : "It comes off Turnupz now. The whole days it hasn't used are refunded, and the organiser is told why."
        }
        label="Reason for the organiser"
        placeholder="For example: the event's photos look copied from another event."
        confirmLabel={asking === "reject" ? "Decline and refund" : "Stop boost"}
        tone="danger"
        required
        busy={busy}
        onCancel={() => setAsking(null)}
        onConfirm={(reason) => {
          const done = { onSuccess: () => setAsking(null), onError: fail };
          if (asking === "reject")
            reject.mutate({ id: boost.id, reason }, done);
          else stop.mutate({ id: boost.id, reason }, done);
        }}
      />
    </li>
  );
};

/** Daily prices per placement, one row per currency, editable in place. */
const Prices: React.FC = () => {
  const { data: prices = [] } = useBoostPrices();
  const setPrice = useSetBoostPrice();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const byCurrency = useMemo(() => {
    const map = new Map<string, TBoostPrice[]>();
    for (const price of prices)
      map.set(price.currency, [...(map.get(price.currency) ?? []), price]);
    return [...map.entries()];
  }, [prices]);
  const keyOf = (price: TBoostPrice) => `${price.placement}:${price.currency}`;

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-semibold">Prices per day</h2>
        <p className="text-sm text-muted-foreground">
          For one city. The whole country costs 1.5×; two or more places
          together get 10% off.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground uppercase">
              <th className="py-2 font-semibold">Currency</th>
              <th className="py-2 font-semibold">Home · Featured</th>
              <th className="py-2 font-semibold">Explore · First row</th>
              <th className="py-2 font-semibold">Search</th>
            </tr>
          </thead>
          <tbody>
            {byCurrency.map(([currency, rows]) => (
              <tr key={currency} className="border-t border-border">
                <td className="py-2 font-semibold">{currency}</td>
                {(["HOME", "EXPLORE", "SEARCH"] as const).map((placement) => {
                  const price = rows.find((row) => row.placement === placement);
                  if (!price) return <td key={placement}>—</td>;
                  const key = keyOf(price);
                  return (
                    <td key={placement} className="py-2 pr-2">
                      <input
                        type="number"
                        min={0}
                        value={draft[key] ?? String(price.perDay.amount)}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        onBlur={() => {
                          const value = draft[key];
                          if (
                            value === undefined ||
                            Number(value) === price.perDay.amount
                          )
                            return;
                          setPrice.mutate(
                            { placement, currency, dailyPrice: Number(value) },
                            {
                              onSuccess: () =>
                                toast.success(
                                  `${price.label} in ${currency} updated`,
                                ),
                              onError: (error) =>
                                toast.error(
                                  constructErrorMessage(
                                    error as TApiErrorResponseType,
                                    "Couldn't save that price.",
                                  ),
                                ),
                            },
                          );
                        }}
                        aria-label={`${price.label} per day in ${currency}`}
                        className="h-9 w-28 rounded-lg border border-border bg-background px-2 tabular-nums"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/**
 * Paid boosts. Most run as soon as they're paid; the ones here to check are a
 * vendor's first, a new account's, cross-border, a big spend, or an event with
 * open reports. A report pauses a running boost until someone looks.
 */
/** Switches organisers' Promote on or off for everyone. */
const PromotionSwitch: React.FC = () => (
  <FeatureSwitch
    feature="promotion"
    label="Promote for organisers"
    onText="On: organisers can promote their events, make promoter codes and book boosts."
    offText="Off: the Promote button is hidden and no new boosts or promoter codes can be made. Running boosts finish, codes already shared still work, and ticket holders still get their day-before reminder."
  />
);

const AdminBoosts = () => {
  const [status, setStatus] = useState<string | undefined>("IN_REVIEW");
  const { data: boosts = [], isLoading } = useAdminBoosts(status);

  return (
    <div className="space-y-6">
      <PageHeading title="Promotions">
        Organisers paying to show their event first. Check the ones flagged, and
        stop any that shouldn&apos;t run; unused days are refunded
        automatically.
      </PageHeading>
      <PromotionSwitch />
      <FilterTabs tabs={TABS} value={status} onChange={setStatus} />
      {isLoading ? (
        <ListSkeleton />
      ) : boosts.length ? (
        <ul className="space-y-3">
          {boosts.map((boost) => (
            <BoostItem key={boost.id} boost={boost} />
          ))}
        </ul>
      ) : (
        <EmptyContainer
          icon={<Rocket className="size-6" />}
          title={status === "IN_REVIEW" ? "Nothing to check" : "No boosts here"}
          description={
            status === "IN_REVIEW"
              ? "Boosts that need a look show up here, oldest first."
              : "Try another tab."
          }
        />
      )}
      <Prices />
    </div>
  );
};

export default memo(AdminBoosts);
