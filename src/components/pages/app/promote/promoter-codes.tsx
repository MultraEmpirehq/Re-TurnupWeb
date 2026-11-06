"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  IPromoCode,
  usePromoCodeActions,
  usePromoCodes,
} from "@/hooks/use-promotion";
import { eventShareUrl } from "@/lib/share-ref";
import { cn } from "@/lib/utils";
import { Copy, Loader2, Pause, Play, Plus } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";

const STATUS: Record<
  IPromoCode["status"],
  { label: string; className: string }
> = {
  live: { label: "Live", className: "bg-emerald-50 text-emerald-700" },
  paused: { label: "Paused", className: "bg-secondary-50 text-secondary-600" },
  ended: { label: "Ended", className: "bg-secondary-50 text-secondary-500" },
  scheduled: { label: "Starts later", className: "bg-amber-50 text-amber-800" },
  used_up: { label: "Used up", className: "bg-amber-50 text-amber-800" },
};

/** The promoter's own link: the event, with their code filled in at checkout. */
const promoterLink = (eventId: string, code: string) =>
  `${eventShareUrl(eventId)}?code=${encodeURIComponent(code)}`;

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Couldn't copy. Select the text and copy it instead.");
  }
};

/**
 * Codes for the people who sell for the organiser. Each tracks the tickets it
 * sells and can take money off them, which the organiser pays for. A code used
 * on an order replaces share-link credit, so a sale is rewarded once.
 */
const PromoterCodes: React.FC<{ eventId: string; currency: string }> = ({
  eventId,
  currency,
}) => {
  const { data: codes = [], isLoading } = usePromoCodes(eventId);
  const { create, setActive } = usePromoCodeActions();
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [promoterName, setPromoterName] = useState("");
  const [kind, setKind] = useState<"none" | "percent" | "amount">("percent");
  const [value, setValue] = useState("10");
  const [maxUses, setMaxUses] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await create.mutateAsync({
        code: code.trim().toUpperCase(),
        promoterName: promoterName.trim(),
        eventId,
        ...(kind === "percent" && value
          ? { discountPercent: Number(value) }
          : {}),
        ...(kind === "amount" && value
          ? { discountAmount: Number(value) }
          : {}),
        ...(maxUses ? { maxUses: Number(maxUses) } : {}),
      });
      toast.success(`${code.toUpperCase()} is ready to share`);
      setAdding(false);
      setCode("");
      setPromoterName("");
      setMaxUses("");
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't make that code.",
        ),
      );
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-secondary-100 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold tracking-wide text-secondary-700">
            PROMOTER CODES
          </p>
          <p className="mt-0.5 text-xs text-secondary-500">
            Give each promoter their own code to see what they sell. A discount
            comes off your price.
          </p>
        </div>
        {!adding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            New code
          </Button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={submit}
          className="grid gap-2 rounded-xl bg-secondary-50/70 p-3 sm:grid-cols-2"
        >
          <label className="grid gap-1 text-xs font-semibold text-secondary-600">
            Code
            <input
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                )
              }
              placeholder="TUNDE10"
              maxLength={20}
              required
              className="h-10 rounded-lg border border-secondary-200 bg-white px-3 font-mono text-sm text-secondary-950"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-secondary-600">
            Who it&apos;s for
            <input
              value={promoterName}
              onChange={(event) => setPromoterName(event.target.value)}
              placeholder="Tunde (DJ Waves crew)"
              maxLength={80}
              required
              className="h-10 rounded-lg border border-secondary-200 bg-white px-3 text-sm text-secondary-950"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-secondary-600">
            Discount
            <span className="flex gap-2">
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as typeof kind)}
                className="h-10 rounded-lg border border-secondary-200 bg-white px-2 text-sm text-secondary-950"
              >
                <option value="percent">% off</option>
                <option value="amount">{currency} off</option>
                <option value="none">No discount</option>
              </select>
              {kind !== "none" && (
                <input
                  type="number"
                  min={1}
                  max={kind === "percent" ? 90 : undefined}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  aria-label={
                    kind === "percent"
                      ? "Percent off each ticket"
                      : "Amount off each ticket"
                  }
                  className="h-10 w-24 rounded-lg border border-secondary-200 bg-white px-3 text-sm text-secondary-950"
                />
              )}
            </span>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-secondary-600">
            Most tickets (optional)
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              placeholder="No limit"
              className="h-10 rounded-lg border border-secondary-200 bg-white px-3 text-sm text-secondary-950"
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button
              type="submit"
              disabled={create.isPending}
              className="rounded-xl bg-secondary-700 text-white hover:bg-secondary-800"
            >
              {create.isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Create code
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <Loader2
          className="mx-auto size-4 animate-spin text-secondary-400"
          aria-label="Loading codes"
        />
      ) : codes.length ? (
        <ul className="divide-y divide-secondary-50">
          {codes.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-secondary-950">
                    {item.code}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                      STATUS[item.status].className,
                    )}
                  >
                    {STATUS[item.status].label}
                  </span>
                  {!item.event && (
                    <span className="text-[11px] text-secondary-400">
                      All your events
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-secondary-500">
                  {item.promoterName}
                  {item.discountLabel
                    ? ` · ${item.discountLabel}`
                    : " · tracking only"}
                  {item.maxUses ? ` · up to ${item.maxUses}` : ""}
                </span>
              </span>
              <span className="text-right text-xs">
                <b className="block text-sm text-secondary-950">
                  {item.stats.tickets} sold
                </b>
                <span className="text-secondary-500">
                  {item.stats.revenue.formatted?.withCurrency}
                </span>
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => void copy(promoterLink(eventId, item.code))}
                  aria-label={`Copy ${item.code}'s link`}
                  title="Copy their link (fills the code in)"
                  className="flex size-8 items-center justify-center rounded-lg border border-secondary-100 text-secondary-600 hover:bg-secondary-50"
                >
                  <Copy className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActive.mutate(
                      { id: item.id, isActive: !item.isActive },
                      {
                        onError: (error) =>
                          toast.error(
                            constructErrorMessage(
                              error as TApiErrorResponseType,
                              "Couldn't change that.",
                            ),
                          ),
                      },
                    )
                  }
                  aria-label={
                    item.isActive
                      ? `Pause ${item.code}`
                      : `Restart ${item.code}`
                  }
                  title={item.isActive ? "Pause" : "Restart"}
                  className="flex size-8 items-center justify-center rounded-lg border border-secondary-100 text-secondary-600 hover:bg-secondary-50"
                >
                  {item.isActive ? (
                    <Pause className="size-3.5" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        !adding && <p className="text-xs text-secondary-500">No codes yet.</p>
      )}
    </section>
  );
};

export default memo(PromoterCodes);
