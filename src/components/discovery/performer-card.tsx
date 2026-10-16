import VerifiedTick from "@/components/discovery/verified-tick";
import { PERFORMER_TYPE_LABELS } from "@/hooks/use-discovery";
import { IPerformer, IPerformerSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import Link from "next/link";
import React, { memo } from "react";
import PerformerAvatar from "./performer-avatar";

export const performerHref = (id: string) =>
  `${ROUTES.EXPLORE.href}/performer/${id}`;

/** A performer as a tile that opens their page; `rank` adds a chart position. */
const PerformerCard: React.FC<{
  performer: IPerformerSummary | IPerformer;
  rank?: number;
  className?: string;
}> = ({ performer, rank, className }) => {
  const upcoming =
    "upcomingEventsCount" in performer ? performer.upcomingEventsCount : null;
  return (
    <Link
      href={performerHref(performer.id)}
      className={cn(
        "group flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5 transition-shadow hover:shadow-md",
        className,
      )}
    >
      {rank !== undefined && (
        <span className="w-6 shrink-0 text-center text-lg font-bold text-secondary-400 tabular-nums">
          {rank}
        </span>
      )}
      <PerformerAvatar
        name={performer.name}
        image={performer.image}
        className="size-14"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1 font-semibold text-secondary-950 group-hover:text-secondary">
          <span className="truncate">{performer.name}</span>
          {performer.isVerified && <VerifiedTick />}
        </span>
        <span className="block truncate text-xs text-secondary-500">
          {PERFORMER_TYPE_LABELS[performer.type] ?? "Performer"}
          {upcoming !== null &&
            ` · ${upcoming} upcoming ${upcoming === 1 ? "event" : "events"}`}
        </span>
      </span>
    </Link>
  );
};

export default memo(PerformerCard);
