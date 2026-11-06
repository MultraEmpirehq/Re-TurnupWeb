"use client";

import { constructErrorMessage } from "@/api/functions";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsEvents } from "@/hooks/use-admin-analytics";
import React, { memo, useState } from "react";
import { downloadCsv, FinanceCard, useFinanceRange } from "../finance/finance-ui";
import { AnalyticsHeader, EventsTable } from "./analytics-ui";

/** Views and sales for each event. */
const Events = () => {
  const { range, period, setPeriod } = useFinanceRange();
  const [paidOnly, setPaidOnly] = useState(false);
  const { data, isPending, error, refetch } = useAnalyticsEvents(range, paidOnly);

  const exportCsv = () => {
    if (!data) return;
    downloadCsv("turnupz-events.csv", [
      ["Event", "Organiser", "Views", "Opened tickets", "Checkouts", "Bought", "Tickets", "Rate %"],
      ...data.items.map((row) => [row.name, row.organiser, row.views, row.ticketViews, row.started, row.bought, row.tickets, row.rate]),
    ]);
  };

  return (
    <div className="space-y-5 pb-16">
      <AnalyticsHeader
        title="Events"
        description="How each event did: most orders first. Rate is orders per page view."
        period={period}
        setPeriod={setPeriod}
        paidOnly={paidOnly}
        setPaidOnly={setPaidOnly}
        onExport={data ? exportCsv : undefined}
      />
      {error ? (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "We couldn't load the events")}
          retryFunction={() => void refetch()}
        />
      ) : (
        <FinanceCard>
          {isPending ? (
            <Skeleton className="h-64 w-full" />
          ) : data?.items.length ? (
            <EventsTable rows={data.items} />
          ) : (
            <EmptyContainer title="No events" description="Nothing in this period." />
          )}
          {!!data && data.total > data.items.length && (
            <p className="mt-3 text-xs text-muted-foreground">Showing the top {data.items.length} of {data.total}.</p>
          )}
        </FinanceCard>
      )}
    </div>
  );
};

export default memo(Events);
