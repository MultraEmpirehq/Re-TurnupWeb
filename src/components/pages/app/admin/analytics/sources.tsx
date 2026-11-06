"use client";

import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsSources } from "@/hooks/use-admin-analytics";
import React, { memo, useState } from "react";
import { downloadCsv, FinanceCard, useFinanceRange } from "../finance/finance-ui";
import { AnalyticsHeader, count, SourceBars } from "./analytics-ui";

/** Where buyers came from: each order counts once. */
const Sources = () => {
  const { range, period, setPeriod } = useFinanceRange();
  const [paidOnly, setPaidOnly] = useState(false);
  const { data, isPending, error, refetch } = useAnalyticsSources(range, paidOnly);

  const exportCsv = () => {
    if (!data) return;
    downloadCsv("turnupz-buyer-sources.csv", [
      ["Source", "Orders", "Tickets", "Share %"],
      ...data.sources.map((row) => [row.label, row.orders, row.tickets, row.share]),
    ]);
  };

  return (
    <div className="space-y-5 pb-16">
      <AnalyticsHeader
        title="Where buyers come from"
        description="What brought each order. An order counts once: a promo code first, then a share link, then where they opened the event."
        period={period}
        setPeriod={setPeriod}
        paidOnly={paidOnly}
        setPaidOnly={setPaidOnly}
        onExport={data ? exportCsv : undefined}
      />
      {error ? (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "We couldn't load where buyers come from")}
          retryFunction={() => void refetch()}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <FinanceCard title="Orders by source">
            {isPending ? (
              <Skeleton className="h-48 w-full" />
            ) : data?.sources.length ? (
              <SourceBars rows={data.sources} />
            ) : (
              <p className="text-sm text-muted-foreground">No orders in this period.</p>
            )}
          </FinanceCard>
          <FinanceCard title="Top promo codes">
            {isPending ? (
              <Skeleton className="h-48 w-full" />
            ) : data?.codes.length ? (
              <ol className="space-y-2.5 text-sm">
                {data.codes.map((row) => (
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
      )}
    </div>
  );
};

export default memo(Sources);
