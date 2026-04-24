"use client";

import { useEvents } from "@/hooks/use-event";
import useUserStore from "@/stores/user-store";
import Link from "next/link";
import React, { memo, useMemo } from "react";

const formatMetricValue = (value: number) => {
  return value.toLocaleString();
};

const OverviewMetricCard: React.FC<{
  title: string;
  value: string;
  caption: string;
  pill: string;
}> = ({ title, value, caption, pill }) => {
  return (
    <article className="relative overflow-hidden rounded-[1.6rem] border border-secondary-100 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:px-7 sm:py-6 lg:px-8 lg:py-7">
      <div className="absolute -bottom-8 -right-8 size-24 rounded-full bg-secondary-50/80 sm:-bottom-10 sm:-right-10 sm:size-32" />
      <div className="relative space-y-4">
        <p className="text-sm text-secondary-500">{title}</p>
        <p className="text-3xl font-bold tracking-tight text-secondary-950 sm:text-4xl">
          {value}
        </p>
        <div className="flex flex-col items-start gap-2 text-sm text-secondary-400 sm:flex-row sm:items-center sm:gap-3">
          <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-500">
            {pill}
          </span>
          <span>{caption}</span>
        </div>
      </div>
    </article>
  );
};

const DashboardOverview = () => {
  const userId = useUserStore((state) => state?.userDetails?.id);
  const { data } = useEvents({ limit: 50, userId: userId ?? undefined });

  const events = useMemo(
    () => data?.pages?.flatMap((page) => page?.data ?? []) ?? [],
    [data],
  );

  const metrics = useMemo(() => {
    return [
      {
        title: "Total Events",
        value: formatMetricValue(events.length),
        pill: "Live",
        caption: "Published across your Turnupz workspace",
      },
      {
        title: "Total Attendance",
        value: "0",
        pill: "Pending",
        caption: "Attendance will update when backend registrations are connected",
      },
      {
        title: "Total Revenue",
        value: "$0.00",
        pill: "Pending",
        caption: "Revenue will update when backend ticket sales are connected",
      },
    ];
  }, [events]);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Analytics
          </p>
          <div className="space-y-1">
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[0.95] tracking-tight text-secondary-950">
              Performance Overview
            </h1>
            <p className="max-w-2xl text-sm text-secondary-500">
              Keep track of event output, upcoming drops, and where your
              audience can still convert.
            </p>
          </div>
        </div>
        <Link
          href="/app/analysis"
          className="text-sm font-medium text-secondary-500 transition-colors hover:text-secondary-400"
        >
          View Full Report
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <OverviewMetricCard key={metric.title} {...metric} />
        ))}
      </div>
    </section>
  );
};

export default memo(DashboardOverview);
