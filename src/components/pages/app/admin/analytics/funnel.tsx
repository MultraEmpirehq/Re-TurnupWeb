"use client";

import { constructErrorMessage } from "@/api/functions";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsFunnel, useAnalyticsSources } from "@/hooks/use-admin-analytics";
import React, { memo, useState } from "react";
import { downloadCsv, FinanceCard, useFinanceRange } from "../finance/finance-ui";
import { AnalyticsHeader, count, EventsTable, pct, SourceBars } from "./analytics-ui";

const OF_PREVIOUS: Record<string, string> = {
  ticketViews: "of page views",
  started: "of ticket views",
  bought: "of checkouts",
};

/**
 * One page for how people buy: from seeing an event to paying (and where they
 * drop off), then what brought each order and the promo codes used. Buyer
 * sources used to be a page of its own.
 */
const Funnel = () => {
  const { range, period, setPeriod } = useFinanceRange();
  const [paidOnly, setPaidOnly] = useState(false);
  const { data, isPending, error, refetch } = useAnalyticsFunnel(range, paidOnly);
  const sources = useAnalyticsSources(range, paidOnly);
  const top = Math.max(...(data?.steps ?? []).map((step) => step.count), 1);

  const exportCsv = () => {
    if (!data) return;
    downloadCsv("turnupz-sales-and-sources.csv", [
      ["Step", "Count", "% of the step before"],
      ...data.steps.map((step) => [step.label, step.count, step.ofPrevious]),
      [],
      ["Source", "Orders", "Tickets", "Share %"],
      ...(sources.data?.sources ?? []).map((row) => [row.label, row.orders, row.tickets, row.share]),
      [],
      ["Promo code", "Orders", "Tickets"],
      ...(sources.data?.codes ?? []).map((row) => [row.code, row.orders, row.tickets]),
    ]);
  };

  return (
    <div className="space-y-5 pb-16">
      <AnalyticsHeader
        title="Sales funnel and sources"
        description="From seeing an event to buying a ticket, where people drop off, and what brought each order."
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
          <FinanceCard title="Events: views to sales">
            {isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : data?.events.length ? (
              <EventsTable rows={data.events} compact />
            ) : (
              <EmptyContainer title="No events" description="Nothing in this period." />
            )}
          </FinanceCard>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <FinanceCard title="Where buyers come from">
              {sources.isPending ? (
                <Skeleton className="h-48 w-full" />
              ) : sources.data?.sources.length ? (
                <>
                  <SourceBars rows={sources.data.sources} />
                  <p className="mt-4 text-xs text-muted-foreground">
                    An order counts once: a promo code first, then a share link, then where they opened the event.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No orders in this period.</p>
              )}
            </FinanceCard>
            <FinanceCard title="Top promo codes">
              {sources.isPending ? (
                <Skeleton className="h-48 w-full" />
              ) : sources.data?.codes.length ? (
                <ol className="space-y-2.5 text-sm">
                  {sources.data.codes.map((row) => (
                    <li key={row.code} className="flex justify-between gap-3">
                      <span className="font-mono text-xs font-semibold">{row.code}</span>
                      <span className="tabular-nums">
                        <span className="font-semibold">{count(row.orders)}</span>
                        <span className="text-muted-foreground"> · {count(row.tickets)} tickets</span>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No promo codes used in this period.</p>
              )}
            </FinanceCard>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(Funnel);
