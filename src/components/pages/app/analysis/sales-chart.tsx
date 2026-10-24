"use client";

import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import React, { memo, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export type TSalesPoint = { start: string; value: number };
type Bucket = "day" | "week" | "month";

/** The brand's blue: one series, so one hue. */
const BAR = "#0577FA";

const chartConfig = {
  value: { label: "Sales", color: BAR },
} satisfies ChartConfig;

const shortDate = (iso: string, bucket: Bucket) => {
  const date = new Date(iso);
  if (bucket === "month") {
    return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
};

const fullDate = (iso: string, bucket: Bucket) => {
  const date = new Date(iso);
  if (bucket === "month") {
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  const day = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return bucket === "week" ? `Week of ${day}` : day;
};

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Sales over the period, one bar per day, week or month. Thin rounded bars on a
 * recessive grid, with a tooltip naming the date and the exact value.
 */
const SalesChart: React.FC<{
  points: TSalesPoint[];
  bucket: Bucket;
  /** Formats a value for the tooltip, e.g. "₦12,000" or "8 tickets". */
  formatValue: (value: number) => string;
  /** Whole numbers only on the axis (tickets). */
  integer?: boolean;
}> = ({ points, bucket, formatValue, integer }) => {
  const data = useMemo(
    () => points.map((point) => ({ ...point, label: shortDate(point.start, bucket) })),
    [bucket, points],
  );

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="18%">
        <CartesianGrid vertical={false} stroke="#EEF2F7" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={24}
          interval="preserveStartEnd"
          tick={{ fill: "#64748B", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          allowDecimals={!integer}
          tickFormatter={(value: number) => compact.format(value)}
          tick={{ fill: "#64748B", fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: "rgba(5, 119, 250, 0.06)" }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as (TSalesPoint & { label: string }) | undefined;
            if (!active || !point) return null;
            return (
              <div className="rounded-xl border border-secondary-100 bg-white px-3 py-2 text-sm shadow-lg">
                <p className="text-xs text-secondary-500">{fullDate(point.start, bucket)}</p>
                <p className="mt-0.5 font-bold text-secondary-950">{formatValue(point.value)}</p>
              </div>
            );
          }}
        />
        {/* Recharts' grow-in animation stalls under React 19 and leaves bars flat. */}
        <Bar
          dataKey="value"
          fill={BAR}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
};

export default memo(SalesChart);
