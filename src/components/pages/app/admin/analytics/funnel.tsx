"use client";

import { constructErrorMessage } from "@/api/functions";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsFunnel } from "@/hooks/use-admin-analytics";
import React, { memo, useState } from "react";
import { downloadCsv, FinanceCard, useFinanceRange } from "../finance/finance-ui";
import { AnalyticsHeader, count, EventsTable, pct, SourceBars } from "./analytics-ui";

const OF_PREVIOUS: Record<string, string> = {
  ticketViews: "of page views",
  started: "of ticket views",
  bought: "of checkouts",
};

/** From seeing an event to paying, and where people drop off. */
const Funnel = () => {
  const { range, period, setPeriod } = useFinanceRange();
  const [paidOnly, setPaidOnly] = useState(false);
  const { data, isPending, error, refetch } = useAnalyticsFunnel(range, paidOnly);
  const top = Math.max(...(data?.steps ?? []).map((step) => step.count), 1);

  const exportCsv = () => {
    if (!data) return;
    downloadCsv("turnupz-sales-funnel.csv", [
      ["Step", "Count", "% of the step before"],
      ...data.steps.map((step) => [step.label, step.count, step.ofPrevious]),
    ]);
  };

  return (
    <div className="space-y-5 pb-16">
      <AnalyticsHeader
        title="Sales funnel"
        description="From seeing an event to buying a ticket, and where people drop off."
        period={period}
        setPeriod={setPeriod}
        paidOnly={paidOnly}
        setPaidOnly={setPaidOnly}
        onExport={data ? exportCsv : undefined}
      />
      {error ? (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "We couldn't load the funnel")}
          retryFunction={() => void refetch()}
        />
      ) : (
        <>
          <FinanceCard>
            {isPending ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <ul className="space-y-3">
                {data?.steps.map((step) => (
                  <li key={step.key} className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[150px_minmax(0,1fr)_170px]">
                    <span className="text-sm font-medium">{step.label}</span>
                    <div className="h-8 overflow-hidden rounded-md bg-muted">
                      <div
                        className="h-full rounded-md bg-series-1"
                        style={{ width: `${step.count ? Math.max((step.count / top) * 100, 1) : 0}%` }}
                      />
                    </div>
                    <span className="text-sm sm:text-right">
                      <span className="font-semibold tabular-nums">{count(step.count)}</span>
                      {step.ofPrevious !== null && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {pct(step.ofPrevious)} {OF_PREVIOUS[step.key]}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Views count every time a page is opened, so one person can count more than once. Ticket page views start from
              this update, so older periods show few or none.
            </p>
          </FinanceCard>
          <div className="grid gap-4 lg:grid-cols-2">
            <FinanceCard title="Events: views to sales">
              {isPending ? (
                <Skeleton className="h-40 w-full" />
              ) : data?.events.length ? (
                <EventsTable rows={data.events} compact />
              ) : (
                <EmptyContainer title="No events" description="Nothing in this period." />
              )}
            </FinanceCard>
            <FinanceCard title="Where buyers come from">
              {isPending ? (
                <Skeleton className="h-40 w-full" />
              ) : data?.sources.length ? (
                <SourceBars rows={data.sources} />
              ) : (
                <p className="text-sm text-muted-foreground">No orders in this period.</p>
              )}
            </FinanceCard>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(Funnel);
