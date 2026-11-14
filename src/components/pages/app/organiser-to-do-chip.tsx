"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, Info, ListChecks, OctagonAlert } from "lucide-react";
import Link from "next/link";
import React, { memo, useState } from "react";
import { TToDoItem, useOrganiserToDo } from "./organiser-to-do";

const RANK: Record<TToDoItem["tone"], number> = { danger: 0, warning: 1, info: 2 };
const LOOK = {
  danger: { icon: OctagonAlert, dot: "bg-danger-solid", text: "text-danger" },
  warning: { icon: AlertTriangle, dot: "bg-warning-solid", text: "text-warning" },
  info: { icon: Info, dot: "bg-primary", text: "text-primary-700" },
};

/**
 * The organiser's open items as a small chip in the header: on every page,
 * without pushing anything down. Its dot takes the colour of the most
 * pressing item; opening it lists them all with what to do next.
 */
const OrganiserToDoChip = ({ tone = "onLight" }: { tone?: "onLight" | "onDark" }) => {
  const { data: items } = useOrganiserToDo();
  const [open, setOpen] = useState(false);
  if (!items?.length) return null;

  const sorted = [...items].sort((a, b) => RANK[a.tone] - RANK[b.tone]);
  const top = LOOK[sorted[0].tone];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${items.length} thing${items.length === 1 ? "" : "s"} to do`}
          className={cn(
            "relative inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors",
            tone === "onDark"
              ? "bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
              : "bg-secondary-50 text-secondary-900 ring-1 ring-secondary-100 hover:bg-secondary-100",
          )}
        >
          <ListChecks className="size-4" aria-hidden />
          <span className="hidden sm:inline">To do</span>
          <span
            className={cn(
              "flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-5 font-bold text-white",
              top.dot,
            )}
          >
            {items.length}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="z-[10000] w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-2">
        <p className="px-2 pt-1 pb-2 text-xs font-semibold tracking-wide text-secondary-950/50 uppercase">
          To do
        </p>
        <ul className="space-y-1">
          {sorted.map((item) => {
            const look = LOOK[item.tone];
            const Icon = look.icon;
            const body = (
              <>
                <Icon className={cn("mt-0.5 size-4 shrink-0", look.text)} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-secondary-950">{item.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-secondary-950/60">
                    {item.body}
                  </span>
                  {item.action && (
                    <span className={cn("mt-1 inline-flex items-center gap-1 text-xs font-semibold", look.text)}>
                      {item.action.label}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </span>
                  )}
                </span>
              </>
            );
            return (
              <li key={item.key}>
                {item.action ? (
                  <Link
                    href={item.action.href}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 rounded-xl p-2.5 hover:bg-secondary-50"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex gap-3 rounded-xl p-2.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

export default memo(OrganiserToDoChip);
