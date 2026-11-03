"use client";

import { constructErrorMessage } from "@/api/functions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceCredit } from "@/hooks/use-admin-finance";
import Link from "next/link";
import React, { memo } from "react";
import {
  compactMoney,
  downloadCsv,
  FinanceCard,
  FinanceHeader,
  money,
  monthLabel,
  Stat,
  useFinanceRange,
} from "./finance-ui";

const REASONS: Record<string, string> = {
  REFERRER_REWARD: "Referral rewards",
  WELCOME: "Welcome credit",
  SHARE_LINK: "Share-link rewards",
  REFUND_RETURN: "Returned from refunds",
};

const initials = (name: string) =>
  name
    .replace("@", "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** Credit given to people, what they spent, and what Turnupz still owes. */
const Credit = () => {
  const { range, currency } = useFinanceRange();
  const { data, isPending, error, refetch } = useFinanceCredit(range);
  const totals = data?.totals;
  const months = (data?.months ?? []).filter((month) => month.given || month.spent || month.unspentAtEnd);

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`turnupz-credit-${currency}.csv`, [
      ["Month", `Given (${currency})`, `Spent (${currency})`, `Unspent at month end (${currency})`],
      ...data.months.map((month) => [month.month, month.given, month.spent, month.unspentAtEnd]),
    ]);
  };

  return (
    <div className="space-y-5 pb-16">
      <FinanceHeader
        title="Turnupz Credit"
        description="Credit given to people, what they spent, and what Turnupz still owes."
        onExport={data ? exportCsv : undefined}
      />

      {error ? (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "We couldn't load credit")}
          retryFunction={() => void refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Given out"
              loading={isPending}
              value={totals && compactMoney(totals.given, currency)}
              note={
                data?.byReason.length
                  ? data.byReason.map((row) => REASONS[row.reason] ?? row.reason).join(", ")
                  : "In this period"
              }
            />
            <Stat
              label="Spent on tickets"
              loading={isPending}
              value={totals && compactMoney(totals.spent, currency)}
              note="Turnupz paid organisers for it"
            />
            <Stat
              label="Unspent (owed)"
              tone={totals?.unspent ? "warn" : undefined}
              loading={isPending}
              value={totals && compactMoney(totals.unspent, currency)}
              note={totals && `Across ${totals.holders.toLocaleString()} ${totals.holders === 1 ? "person" : "people"}`}
            />
            <Stat
              label="Expired or removed"
              loading={isPending}
              value={totals && compactMoney(totals.lapsed, currency)}
              note="In this period"
            />
          </div>

          {data && !data.spendingOn && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
              <strong>Paying with credit is paused.</strong> People keep their balance; it can be spent once
              it&apos;s switched back on in{" "}
              <Link href="/app/admin/marketing/referrals" className="font-semibold underline underline-offset-2">
                Growth → Referrals
              </Link>
              .
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <FinanceCard title="Where credit came from and went">
              {isPending ? (
                <Skeleton className="h-32 w-full" />
              ) : months.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] tracking-wider text-muted-foreground uppercase">
                        <th className="py-2 font-semibold">Month</th>
                        <th className="py-2 text-right font-semibold">Given</th>
                        <th className="py-2 text-right font-semibold">Spent</th>
                        <th className="py-2 text-right font-semibold">Unspent at month end</th>
                      </tr>
                    </thead>
                    <tbody>
                      {months.map((month) => (
                        <tr key={month.month} className="border-b border-border/60 last:border-0">
                          <td className="py-2.5">{monthLabel(month.month, "long")}</td>
                          <td className="py-2.5 text-right tabular-nums">{money(month.given, currency)}</td>
                          <td className="py-2.5 text-right tabular-nums">{money(month.spent, currency)}</td>
                          <td className="py-2.5 text-right font-semibold tabular-nums">{money(month.unspentAtEnd, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No credit in the last twelve months.</p>
              )}
            </FinanceCard>
            <FinanceCard title="Largest balances">
              {isPending ? (
                <Skeleton className="h-32 w-full" />
              ) : data?.largestBalances.length ? (
                <ul className="space-y-3">
                  {data.largestBalances.map((person) => (
                    <li key={person.userId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-secondary-50 text-[11px] font-semibold text-secondary-700">
                            {initials(person.name)}
                          </AvatarFallback>
                        </Avatar>
                        {person.name}
                      </span>
                      <span className="font-semibold tabular-nums">{money(person.balance, currency)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nobody holds credit in {currency}.</p>
              )}
            </FinanceCard>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(Credit);
