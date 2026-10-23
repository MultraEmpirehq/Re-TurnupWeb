import PerformerCard from "@/components/discovery/performer-card";
import { IPerformerSummary } from "@/lib/types";
import React, { memo } from "react";

/** Who's on the bill, in billing order, each opening their own page. */
const EventDetailLineup: React.FC<{ performers: IPerformerSummary[] }> = ({
  performers,
}) => (
  <section className="space-y-3">
    <h3 className="text-lg font-semibold">Line-up</h3>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {performers.map((performer) => (
        <div key={performer.id} className="relative">
          {performer.isHeadliner && performers.length > 1 && (
            <span className="absolute -top-2 right-3 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
              Headliner
            </span>
          )}
          <PerformerCard performer={performer} />
        </div>
      ))}
    </div>
  </section>
);

export default memo(EventDetailLineup);
