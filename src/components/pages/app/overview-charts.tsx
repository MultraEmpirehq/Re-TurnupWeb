"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";

/** One series, so one hue: the brand blue, as on the Analysis chart. */
const INK = "#0577FA";

export type TDailyPoint = { start: string; value: number };

const dayLabel = (iso: string, withWeekday = false) =>
  new Date(iso).toLocaleDateString("en-GB", {
    ...(withWeekday ? { weekday: "short" } : {}),
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/** A column with a 4px rounded top and a square foot on the baseline. */
const columnPath = (x: number, y: number, width: number, height: number) => {
  if (height <= 0) return "";
  const r = Math.min(4, width / 2, height);
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
};

/**
 * Daily columns with the busiest day labelled and a tooltip on hover. Each day's
 * hit area is its whole slot, not just the bar, so thin days are easy to point at.
 */
export const DailyColumns: React.FC<{
  points: TDailyPoint[];
  format: (value: number) => string;
  unit: (value: number) => string;
  height?: number;
}> = ({ points, format, unit, height = 200 }) => {
  const [active, setActive] = useState<number | null>(null);
  const width = 600;
  const top = 18;
  const plot = height - top - 22;
  const max = Math.max(...points.map((point) => point.value), 0);
  const slot = width / Math.max(points.length, 1);
  const bar = Math.min(24, Math.max(3, slot - 2));
  const peak = points.reduce(
    (best, point, index) =>
      point.value > (points[best]?.value ?? -1) ? index : best,
    0,
  );
  const hovered = active === null ? null : points[active];

  return (
    <div className="relative" onMouseLeave={() => setActive(null)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block w-full overflow-visible"
        style={{ height }}
        role="img"
        aria-label={`${points.length} days, busiest ${points[peak] ? `${dayLabel(points[peak].start)} with ${format(points[peak].value)}` : "none"}`}
      >
        <line
          x1={0}
          x2={width}
          y1={top + plot}
          y2={top + plot}
          stroke="#e6edf7"
          strokeWidth={1}
        />
        {points.map((point, index) => {
          const barHeight = max ? (point.value / max) * plot : 0;
          const x = index * slot + (slot - bar) / 2;
          return (
            <g key={point.start}>
              <path
                d={columnPath(x, top + plot - barHeight, bar, barHeight)}
                fill={INK}
                opacity={active === null || active === index ? 1 : 0.35}
              />
              <rect
                x={index * slot}
                y={0}
                width={slot}
                height={height}
                fill="transparent"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
              />
            </g>
          );
        })}
      </svg>
      {/* Labels sit outside the stretched SVG so text never distorts. */}
      {max > 0 && points[peak] && (
        <span
          className="pointer-events-none absolute -translate-x-1/2 text-[11px] font-semibold text-secondary-700"
          style={{ left: `${((peak + 0.5) / points.length) * 100}%`, top: 0 }}
        >
          {format(points[peak].value)}
        </span>
      )}
      <div className="mt-1 flex justify-between text-[11px] text-secondary-400">
        <span>{points[0] && dayLabel(points[0].start)}</span>
        <span>Today</span>
      </div>
      {hovered && active !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-secondary-950 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg"
          style={{
            left: `${Math.min(92, Math.max(8, ((active + 0.5) / points.length) * 100))}%`,
            top: 8,
          }}
        >
          <span className="block text-white/60">
            {dayLabel(hovered.start, true)}
          </span>
          <span className="font-semibold">
            {format(hovered.value)} {unit(hovered.value)}
          </span>
        </div>
      )}
    </div>
  );
};

/** A small trend line: 2px line, a 10% wash under it, and a ringed dot at today. */
export const Sparkline: React.FC<{
  points: TDailyPoint[];
  format: (value: number) => string;
}> = ({ points, format }) => {
  const [active, setActive] = useState<number | null>(null);
  const width = 300;
  const height = 56;
  const pad = 6;
  const max = Math.max(...points.map((point) => point.value), 0);
  if (points.length < 2) return null;
  const x = (index: number) =>
    pad + (index / (points.length - 1)) * (width - pad * 2);
  const y = (value: number) =>
    pad + (1 - (max ? value / max : 0)) * (height - pad * 2);
  const line = points
    .map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point.value)}`)
    .join("");
  const area = `${line}L${x(points.length - 1)},${height - pad}L${x(0)},${height - pad}Z`;
  const last = points.length - 1;
  const shown = active ?? last;

  return (
    <div className="relative" onMouseLeave={() => setActive(null)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-14 w-full overflow-visible"
        aria-hidden
      >
        <path d={area} fill={INK} opacity={0.1} />
        <path
          d={line}
          fill="none"
          stroke={INK}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={x(shown)}
          cy={y(points[shown].value)}
          r={4}
          fill={INK}
          stroke="#fff"
          strokeWidth={2}
        />
        {points.map((point, index) => (
          <rect
            key={point.start}
            x={x(index) - width / points.length / 2}
            y={0}
            width={width / points.length}
            height={height}
            fill="transparent"
            onMouseEnter={() => setActive(index)}
          />
        ))}
      </svg>
      {active !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-secondary-950 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg"
          style={{
            left: `${Math.min(88, Math.max(12, (x(active) / width) * 100))}%`,
            top: 0,
          }}
        >
          <span className="block text-white/60">
            {dayLabel(points[active].start, true)}
          </span>
          <span className="font-semibold">{format(points[active].value)}</span>
        </div>
      )}
    </div>
  );
};

/** A part of a whole as one bar: the filled share, then the rest on a lighter track. */
export const SplitMeter: React.FC<{
  value: number;
  total: number;
  className?: string;
  label: string;
}> = ({ value, total, className, label }) => {
  const percent = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div
      className={cn(
        "flex h-3 w-full gap-[2px] overflow-hidden rounded-full",
        className,
      )}
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      {percent > 0 && (
        <span
          className="h-full rounded-l-full"
          style={{ width: `${Math.max(percent, 1.5)}%`, background: INK }}
        />
      )}
      <span
        className={cn(
          "h-full flex-1 bg-secondary-100",
          percent > 0 ? "rounded-r-full" : "rounded-full",
        )}
      />
    </div>
  );
};
