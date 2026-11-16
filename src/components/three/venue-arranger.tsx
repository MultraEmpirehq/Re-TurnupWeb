"use client";

import { Button } from "@/components/ui/button";
import { ZONE_COLOURS, layoutOf, type TVenueLayout } from "@/lib/venue-layouts";
import { Box } from "lucide-react";
import dynamic from "next/dynamic";
import React, { memo, useMemo, useState } from "react";
import type { TVenueZoneTicket } from "./venue-3d";

// three.js loads only when the preview opens.
const Venue3D = dynamic(() => import("./venue-3d"), { ssr: false });

export type TArrangeTicket = {
  /** The ticket's id, or its position while it's unsaved. */
  key: string;
  name: string;
  priceLabel: string;
  zone?: string | null;
};

/**
 * For organisers: the 3D view as buyers will see it, built from the tickets
 * on the form. Tap any area, empty or not, and choose which ticket goes
 * there. The dropdowns on each ticket do the same; this is the visual way.
 */
const VenueArranger = ({
  layout,
  tickets,
  onAssign,
}: {
  layout: TVenueLayout;
  tickets: TArrangeTicket[];
  onAssign: (ticketKey: string, zone: string | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const definition = layoutOf(layout);

  const zones = useMemo<TVenueZoneTicket[]>(
    () =>
      (definition?.zones ?? []).map((area, position) => {
        const inArea = tickets.filter((ticket) => ticket.zone === area.value);
        return {
          zone: area.value,
          ticketId: inArea[0]?.key ?? "",
          title: inArea.length === 1 ? inArea[0].name || "Unnamed ticket" : area.label,
          subtitle: inArea.length
            ? inArea.length === 1
              ? inArea[0].priceLabel
              : inArea.map((ticket) => ticket.name).join(", ")
            : "Empty: place a ticket",
          note: inArea.length ? area.label : "No ticket here yet. Buyers won't see this area in colour.",
          color: inArea.length ? ZONE_COLOURS[position % ZONE_COLOURS.length] : "#94a3b8",
          soldOut: false,
        };
      }),
    [definition, tickets],
  );

  if (!definition) return null;
  const placed = tickets.filter((ticket) => ticket.zone).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-secondary-500">
          {placed} of {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"} placed.
          {tickets.length === 0 && " Add a ticket category first."}
        </p>
        <Button
          type="button"
          variant={open ? "default" : "outline"}
          className="rounded-full"
          aria-pressed={open}
          disabled={tickets.length === 0}
          onClick={() => setOpen((current) => !current)}
        >
          <Box className="size-4" aria-hidden />
          {open ? "Hide 3D preview" : "Arrange in 3D"}
        </Button>
      </div>
      {open && (
        <Venue3D
          layout={layout}
          zones={zones}
          renderActions={(zone) => {
            const here = tickets.filter((ticket) => ticket.zone === zone.zone);
            return (
              <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-semibold text-muted-foreground">
                Ticket in this area
                <select
                  value={here[0]?.key ?? ""}
                  onChange={(event) => {
                    // One ticket per pick: the old one leaves this area.
                    here.forEach((ticket) => onAssign(ticket.key, null));
                    if (event.target.value) onAssign(event.target.value, zone.zone);
                  }}
                  className="h-9 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground"
                >
                  <option value="">Nothing here</option>
                  {tickets.map((ticket) => (
                    <option key={ticket.key} value={ticket.key}>
                      {ticket.name || "Unnamed ticket"}
                      {ticket.zone && ticket.zone !== zone.zone ? " (moves here)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            );
          }}
        />
      )}
    </div>
  );
};

export default memo(VenueArranger);
