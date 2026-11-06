"use client";

import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { IAnalyticsAudience, useAnalyticsAudience } from "@/hooks/use-admin-analytics";
import React, { memo } from "react";
import { downloadCsv, FinanceCard, monthLabel, Stat, useFinanceRange } from "../finance/finance-ui";
import { AnalyticsHeader, count, pct } from "./analytics-ui";

const SignupsChart: React.FC<{ months: IAnalyticsAudience["months"] }> = ({ months }) => {
  const max = Math.max(...months.map((month) => month.attendees + month.organisers), 1);
  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-series-1" aria-hidden /> Attendees
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-series-2" aria-hidden /> Organisers
        </span>
      </div>
      <div className="flex h-48 items-end gap-1.5 border-b border-border" role="img" aria-label="Sign-ups by month">
        {months.map((month) => {
          const total = month.attendees + month.organisers;
          return (
            <div key={month.month} className="group relative flex h-full flex-1 items-end justify-center">
              <div
                className="flex w-full max-w-10 flex-col gap-[2px] transition-opacity group-hover:opacity-90"
                style={{ height: `${total ? Math.max((total / max) * 100, 1.5) : 0}%` }}
              >
                {month.organisers > 0 && (
                  <div
                    className="min-h-[3px] rounded-t-[4px] bg-series-2"
                    style={{ flexGrow: month.organisers, flexBasis: 0 }}
                  />
                )}
                {month.attendees > 0 && (
                  <div
                    className={`min-h-[3px] bg-series-1 ${month.organisers ? "" : "rounded-t-[4px]"}`}
                    style={{ flexGrow: month.attendees, flexBasis: 0 }}
                  />
                )}
              </div>
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-lg bg-secondary-950 px-3 py-2 text-xs text-white shadow-lg dark:bg-muted dark:ring-1 dark:ring-border group-hover:block">
                <p className="font-semibold">{monthLabel(month.month, "long")}</p>
                <p className="text-white/80">Attendees {count(month.attendees)}</p>
                <p className="text-white/80">Organisers {count(month.organisers)}</p>
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

/** One shade of blue, darker for more buyers coming back. */
const CohortCell: React.FC<{ value: number | null }> = ({ value }) => {
  if (value === null) return <td className="p-0.5 text-center text-muted-foreground">–</td>;
  const strength = Math.min(15 + value * 1.4, 95);
  return (
    <td className="p-0.5 text-center">
      <div
        className="rounded-md py-1.5 font-semibold tabular-nums"
        style={{
          background: `color-mix(in srgb, var(--heat) ${strength}%, var(--card))`,
          // Each mode's heat colour keeps its own text readable on every shade.
          color: "var(--foreground)",
        }}
      >
        {value}%
      </div>
    </td>
  );
};

/** Who's joining, who keeps coming back, and where. */
const Audience = () => {
  const { range, period, setPeriod } = useFinanceRange();
  const { data, isPending, error, refetch } = useAnalyticsAudience(range);
  const totals = data?.totals;
  const app = data?.platforms.app ?? 0;
  const web = data?.platforms.web ?? 0;
  const appShare = app + web ? Math.round((app / (app + web)) * 100) : 0;

  const exportCsv = () => {
    if (!data) return;
    downloadCsv("turnupz-audience.csv", [
      ["Month", "Attendee sign-ups", "Organiser sign-ups"],
      ...data.months.map((month) => [month.month, month.attendees, month.organisers]),
    ]);
  };

  return (
    <div className="space-y-5 pb-16">
      <AnalyticsHeader
        title="Audience"
        description="Who's joining, who keeps coming back, and where they are."
        period={period}
        setPeriod={setPeriod}
        onExport={data ? exportCsv : undefined}
      />
      {error ? (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "We couldn't load the audience")}
          retryFunction={() => void refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="New sign-ups" loading={isPending} value={totals && count(totals.signups)} change={totals?.signupsChange} />
            <Stat
              label="New organisers"
              loading={isPending}
              value={totals && count(totals.organisersApplied)}
              note={totals && `${count(totals.organisersApproved)} approved`}
            />
            <Stat label="Active, last 30 days" loading={isPending} value={totals && count(totals.activeMonth)} note="Opened the app or site" />
            <Stat
              label="Active, last 7 days"
              loading={isPending}
              value={totals && count(totals.activeWeek)}
              note={totals?.activeMonth ? `${Math.round((totals.activeWeek / totals.activeMonth) * 100)}% of the 30 days` : undefined}
            />
            <Stat
              label="Came back"
              loading={isPending}
              value={totals && pct(totals.cameBack)}
              note={totals && `of ${count(totals.cameBackOf)} buyers from the 30 days before bought again`}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <FinanceCard title="Sign-ups by month">
              {isPending ? <Skeleton className="h-56 w-full" /> : <SignupsChart months={data?.months ?? []} />}
            </FinanceCard>
            <div className="space-y-4">
              <FinanceCard title="Top places">
                {isPending ? (
                  <Skeleton className="h-28 w-full" />
                ) : data?.places.length ? (
                  <ol className="space-y-2.5 text-sm">
                    {data.places.map((row, index) => (
                      <li key={row.city} className="flex justify-between gap-3">
                        <span>
                          {index + 1}. {row.city}
                        </span>
                        <span className="font-semibold tabular-nums">{count(row.orders)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">No orders in this period.</p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">Orders, by the city of the event.</p>
              </FinanceCard>
              <FinanceCard title="App or website">
                {isPending ? (
                  <Skeleton className="h-10 w-full" />
                ) : app + web ? (
                  <>
                    <div className="flex h-2.5 gap-[2px]">
                      {app > 0 && <div className="rounded-l-full bg-series-1" style={{ flexGrow: app, flexBasis: 0 }} />}
                      {web > 0 && <div className="rounded-r-full bg-series-2" style={{ flexGrow: web, flexBasis: 0 }} />}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>App {appShare}%</span>
                      <span>Website {100 - appShare}%</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No visits counted in this period.</p>
                )}
              </FinanceCard>
            </div>
          </div>
          <FinanceCard title="Do buyers come back?">
            <p className="mb-3 text-xs text-muted-foreground">
              Of the people who first bought in each month, how many bought again in the months after.
            </p>
            {isPending ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="text-[11px] tracking-wider text-muted-foreground uppercase">
                      <th className="py-2 text-left font-semibold">First bought</th>
                      <th className="py-2 text-right font-semibold">Buyers</th>
                      {["+1 month", "+2 months", "+3 months"].map((label) => (
                        <th key={label} className="py-2 text-center font-semibold">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data?.cohorts.map((row) => (
                      <tr key={row.month}>
                        <td className="py-1 pr-3">{monthLabel(row.month, "long")}</td>
                        <td className="py-1 pr-3 text-right tabular-nums">{count(row.buyers)}</td>
                        {row.after.map((value, index) => (
                          <CohortCell key={index} value={row.buyers ? value : null} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FinanceCard>
          <p className="text-xs text-muted-foreground">
            Active visitors and app or website only count signed-in people and visitors who allowed visitor counting.
          </p>
        </>
      )}
    </div>
  );
};

export default memo(Audience);
