"use client";

import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { IFinanceRevenue, useFinanceRevenue } from "@/hooks/use-admin-finance";
import { constructErrorMessage } from "@/api/functions";
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

/** Sales each month, with Turnupz's fee as the darker cap of the bar. */
const MonthsChart: React.FC<{ months: IFinanceRevenue["months"]; currency: string }> = ({
  months,
  currency,
}) => {
  const max = Math.max(...months.map((month) => month.sales), 1);
  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary-200" aria-hidden /> Sales
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary-600" aria-hidden /> Turnupz fees
        </span>
      </div>
      <div className="flex h-48 items-end gap-1.5 border-b border-border" role="img" aria-label="Sales and fees by month">
        {months.map((month) => {
          const height = (month.sales / max) * 100;
          const feeShare = month.sales ? Math.max((month.fees / month.sales) * 100, 4) : 0;
          return (
            <div key={month.month} className="group relative flex h-full flex-1 items-end justify-center">
              {/* The hit area is the whole column, not just the bar. */}
              <div
                className="flex w-full max-w-10 flex-col overflow-hidden rounded-t-[4px] bg-primary-200 transition-opacity group-hover:opacity-90"
                style={{ height: `${month.sales ? Math.max(height, 1.5) : 0}%` }}
              >
                <div className="w-full bg-primary-600" style={{ height: `${feeShare}%` }} />
              </div>
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-lg bg-secondary-950 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                <p className="font-semibold">{monthLabel(month.month, "long")}</p>
                <p className="text-white/80">Sales {money(month.sales, currency)}</p>
                <p className="text-white/80">Fees {money(month.fees, currency)}</p>
                <p className="text-white/60">{month.orders} orders</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {months.map((month) => (
          <span key={month.month} className="flex-1 text-center text-[11px] text-muted-foreground">
            {monthLabel(month.month)}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * Revenue: what came through Turnupz and what Turnupz earned in the period,
 * the last twelve months, and where it was sold.
 */
const Revenue = () => {
  const { range, currency } = useFinanceRange();
  const { data, isPending, error, refetch } = useFinanceRevenue(range);

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`turnupz-revenue-${currency}.csv`, [
      ["Month", `Sales (${currency})`, `Turnupz fees (${currency})`, `Refunds (${currency})`, `Credit used (${currency})`, "Orders"],
      ...[...data.months]
        .reverse()
        .map((month) => [month.month, month.sales, month.fees, month.refunds, month.credit, month.orders]),
    ]);
  };

  const totals = data?.totals;
  const months = data?.months ?? [];
  const recent = [...months].reverse().filter((month) => month.orders || month.sales || month.refunds);

  return (
    <div className="space-y-6 pb-16">
      <FinanceHeader
        title="Revenue"
        description="What came through Turnupz, and what Turnupz earned."
        onExport={data ? exportCsv : undefined}
      />

      {error ? (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "We couldn't load revenue")}
          retryFunction={() => void refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat
              label="Ticket sales"
              loading={isPending}
              value={totals && compactMoney(totals.sales, currency)}
              change={totals?.salesChange}
            />
            <Stat
              label="Turnupz fees (net revenue)"
              loading={isPending}
              value={totals && compactMoney(totals.fees, currency)}
              change={totals?.feesChange}
            />
            <Stat
              label="Refunded"
              loading={isPending}
              value={totals && compactMoney(totals.refunds, currency)}
              note={totals && `${totals.refundRate}% of sales`}
            />
            <Stat
              label="Credit used"
              loading={isPending}
              value={totals && compactMoney(totals.credit, currency)}
              note="Turnupz-funded"
            />
            <Stat
              label="Paid orders"
              loading={isPending}
              value={totals?.orders.toLocaleString()}
              note={totals && `${totals.tickets.toLocaleString()} tickets`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <FinanceCard title="Sales and fees by month">
              {isPending ? <Skeleton className="h-56 w-full" /> : <MonthsChart months={months} currency={currency} />}
            </FinanceCard>
            <div className="space-y-4">
              <FinanceCard title="By country">
                {isPending ? (
                  <Skeleton className="h-16 w-full" />
                ) : data?.byCountry.length ? (
                  <ul className="space-y-3">
                    {data.byCountry.map((row) => {
                      // Each currency against the largest, in its own units: a bar per market.
                      const top = Math.max(...data.byCountry.map((item) => item.sales), 1);
                      return (
                        <li key={row.currency} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span>
                              {row.country} · {row.currency}
                            </span>
                            <span className="font-semibold tabular-nums">{compactMoney(row.sales, row.currency)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary-600"
                              style={{ width: `${Math.max((row.sales / top) * 100, 2)}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No sales in this period.</p>
                )}
                {!!data?.byCountry.length && data.byCountry.length > 1 && (
                  <p className="mt-3 text-xs text-muted-foreground">Bars compare each market in its own currency.</p>
                )}
              </FinanceCard>
              <FinanceCard title="Top cities">
                {isPending ? (
                  <Skeleton className="h-28 w-full" />
                ) : data?.topCities.length ? (
                  <ol className="space-y-2.5 text-sm">
                    {data.topCities.map((row, index) => (
                      <li key={`${row.city}-${row.currency}`} className="flex justify-between gap-3">
                        <span>
                          {index + 1}. {row.city}
                        </span>
                        <span className="font-semibold tabular-nums">{compactMoney(row.sales, row.currency)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">No sales in this period.</p>
                )}
              </FinanceCard>
            </div>
          </div>

          <FinanceCard title="Month by month">
            {isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : recent.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] tracking-wider text-muted-foreground uppercase">
                      <th className="py-2 font-semibold">Month</th>
                      <th className="py-2 text-right font-semibold">Sales</th>
                      <th className="py-2 text-right font-semibold">Turnupz fees</th>
                      <th className="py-2 text-right font-semibold">Refunds</th>
                      <th className="py-2 text-right font-semibold">Credit used</th>
                      <th className="py-2 text-right font-semibold">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((month) => (
                      <tr key={month.month} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5">{monthLabel(month.month, "long")}</td>
                        <td className="py-2.5 text-right tabular-nums">{money(month.sales, currency)}</td>
                        <td className="py-2.5 text-right font-semibold tabular-nums">{money(month.fees, currency)}</td>
                        <td className="py-2.5 text-right text-muted-foreground tabular-nums">{money(month.refunds, currency)}</td>
                        <td className="py-2.5 text-right text-muted-foreground tabular-nums">{money(month.credit, currency)}</td>
                        <td className="py-2.5 text-right tabular-nums">{month.orders.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sales in the last twelve months.</p>
            )}
          </FinanceCard>
          <p className="text-xs text-muted-foreground">Tax collected appears here once tax is switched on.</p>
        </>
      )}
    </div>
  );
};

export default memo(Revenue);
