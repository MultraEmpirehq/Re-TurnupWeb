"use client";

import { constructErrorMessage } from "@/api/functions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Input } from "@/components/ui/input";
import { IFinanceOrganiser, TOrganiserFilter, useFinanceOrganisers } from "@/hooks/use-admin-finance";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import React, { memo, useState } from "react";
import { useDebounce } from "use-debounce";
import { ListSkeleton } from "../moderation/moderation-ui";
import {
  compactMoney,
  downloadCsv,
  FinanceHeader,
  money,
  Pill,
  PROVIDER_LABEL,
  Stat,
  useFinanceRange,
} from "./finance-ui";

const PAYOUTS: Record<IFinanceOrganiser["payouts"], { label: string; tone: "good" | "warn" | "bad" }> = {
  on: { label: "Payouts on", tone: "good" },
  setup_unfinished: { label: "Setup unfinished", tone: "warn" },
  no_account: { label: "No payout account", tone: "bad" },
};

const COUNTRY_NAMES: Record<string, string> = { NG: "Nigeria", CA: "Canada", GB: "United Kingdom", US: "United States", GH: "Ghana" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const paidThrough = (row: IFinanceOrganiser) =>
  row.paidThrough
    ? [
        PROVIDER_LABEL[row.paidThrough.provider] ?? row.paidThrough.provider,
        [row.paidThrough.bankName, row.paidThrough.last4 ? `••${row.paidThrough.last4}` : null].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(" · ")
    : "Not set up";

/** Who sells, what they earned, and whether they can be paid. */
const Organisers = () => {
  const { range, currency } = useFinanceRange();
  const [filter, setFilter] = useState<TOrganiserFilter>("all");
  const [search, setSearch] = useState("");
  const [q] = useDebounce(search.trim(), 300);
  const { data, isPending, error, refetch } = useFinanceOrganisers(range, { filter, q });
  const summary = data?.summary;

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`turnupz-organisers-${currency}.csv`, [
      ["Organiser", "Country", "Paid through", `Sales (${currency})`, `Turnupz fees (${currency})`, `Paid to them (${currency})`, `Owed by Turnupz (${currency})`, "Tickets", "Payouts"],
      ...data.items.map((row) => [
        row.name,
        row.country,
        paidThrough(row),
        row.sales,
        row.fees,
        row.paidToThem,
        row.owed,
        row.tickets,
        PAYOUTS[row.payouts].label,
      ]),
    ]);
  };

  return (
    <div className="space-y-5 pb-16">
      <FinanceHeader
        title="Organisers and payouts"
        description="Who sells, what they earned, and whether they can be paid. Owed is the running balance; the rest covers the period."
        onExport={data ? exportCsv : undefined}
      />

      {error ? (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "We couldn't load organisers")}
          retryFunction={() => void refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Selling organisers"
              loading={isPending}
              value={summary?.selling.toLocaleString()}
              note={summary && `${summary.newThisPeriod} approved this period`}
            />
            <Stat
              label="Paid straight to organisers"
              loading={isPending}
              value={summary && compactMoney(summary.paidToOrganisers, currency)}
              note="Split at checkout, to their bank"
            />
            <Stat
              label="Owed by Turnupz"
              tone={summary?.owed ? "warn" : undefined}
              loading={isPending}
              value={summary && compactMoney(summary.owed, currency)}
              note={summary && `${summary.owedTo} ${summary.owedTo === 1 ? "organiser" : "organisers"}`}
            />
            <Stat
              label="Can't be paid yet"
              tone={summary?.cantBePaid ? "warn" : undefined}
              loading={isPending}
              value={summary?.cantBePaid.toLocaleString()}
              note="No payout account, or setup unfinished"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search organisers"
                className="h-11 rounded-full bg-card pl-10"
                aria-label="Search organisers"
              />
            </div>
            <div className="flex gap-2" role="group" aria-label="Filter organisers">
              {(
                [
                  ["all", "All"],
                  ["on", "Payouts on"],
                  ["attention", "Needs attention"],
                ] as [TOrganiserFilter, string][]
              ).map(([value, label]) => {
                const active = filter === value;
                const count = data?.counts?.[value];
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
                      active
                        ? "border-secondary-800 bg-secondary-800 text-white"
                        : value === "attention" && count
                          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "border-border bg-card text-secondary-800 hover:bg-muted",
                    )}
                  >
                    {label}
                    {count !== undefined && <span className="ml-1.5 tabular-nums opacity-70">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {isPending ? (
            <ListSkeleton />
          ) : !data?.items.length ? (
            <EmptyContainer title="No organisers" description="Nobody matches. Try another filter or currency." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] tracking-wider text-muted-foreground uppercase">
                      <th className="px-4 py-3 font-semibold">Organiser</th>
                      <th className="px-4 py-3 font-semibold">Paid through</th>
                      <th className="px-4 py-3 text-right font-semibold">Sales</th>
                      <th className="px-4 py-3 text-right font-semibold">Turnupz fees</th>
                      <th className="px-4 py-3 text-right font-semibold">Paid to them</th>
                      <th className="px-4 py-3 text-right font-semibold">Owed by Turnupz</th>
                      <th className="px-4 py-3 text-right font-semibold">Tickets</th>
                      <th className="px-4 py-3 font-semibold">Payouts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((row) => (
                      <tr key={row.vendorId} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-secondary-50 text-xs font-semibold text-secondary-700">
                                {initials(row.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{row.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {row.country ? (COUNTRY_NAMES[row.country] ?? row.country) : "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{paidThrough(row)}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(row.sales, currency)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{money(row.fees, currency)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{money(row.paidToThem, currency)}</td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right tabular-nums",
                            row.owed > 0 ? "font-semibold text-amber-700" : "text-muted-foreground",
                          )}
                        >
                          {money(row.owed, currency)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.tickets.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Pill tone={PAYOUTS[row.payouts].tone}>{PAYOUTS[row.payouts].label}</Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default memo(Organisers);
