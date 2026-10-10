"use client";

import ScrollRow from "@/components/ui/scroll-row";
import PerformerCard from "@/components/discovery/performer-card";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CHART_REGIONS,
  TChartRegion,
  usePerformerChart,
} from "@/hooks/use-discovery";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import React, { memo, useState } from "react";

/** Top performers by tickets sold for their events over the last year, by region. */
const ChartsPage = () => {
  const [region, setRegion] = useState<TChartRegion>("global");
  const { data: performers = [], isLoading } = usePerformerChart(region, 50);

  return (
    <SectionContainer className="space-y-8 py-16">
      <header className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
          <BarChart3 className="size-4" aria-hidden />
          Top charts
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-secondary-950">
          Who people are turning up for
        </h1>
        <p className="max-w-2xl text-sm text-secondary-500">
          Performers ranked by tickets sold for their events over the last 12
          months.
        </p>
      </header>

      <ScrollRow>
        <div className="inline-flex gap-1 rounded-full bg-white p-1 ring-1 ring-black/5">
          {CHART_REGIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={region === option.value}
              onClick={() => setRegion(option.value)}
              className={cn(
                "rounded-full px-4",
                region === option.value &&
                  "bg-secondary text-white hover:bg-secondary hover:text-white",
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </ScrollRow>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : performers.length === 0 ? (
        <p className="text-sm text-secondary-500">
          No chart for this region yet. It fills up as tickets sell.
        </p>
      ) : (
        <ol className="grid gap-3 md:grid-cols-2">
          {performers.map((performer, index) => (
            <li key={performer.id}>
              <PerformerCard
                performer={performer}
                rank={performer.rank ?? index + 1}
              />
            </li>
          ))}
        </ol>
      )}
    </SectionContainer>
  );
};

export default memo(ChartsPage);
