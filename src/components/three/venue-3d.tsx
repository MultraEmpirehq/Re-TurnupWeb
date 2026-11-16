"use client";

import { Button } from "@/components/ui/button";
import type { TVenueLayout } from "@/lib/venue-layouts";
import { Loader2 } from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";
import type { TSceneZone, TVenueScene } from "./venue-scene";

export type TVenueZoneTicket = TSceneZone & { ticketId: string; note?: string };

const isDark = () =>
  document.documentElement.classList.contains("dark") ||
  document.documentElement.dataset.theme === "dark";

/**
 * "View in 3D" on the ticket page: the venue, each ticket's area in its
 * colour. Tap an area to see its ticket, "View from here" to stand there,
 * "Pick this" to choose it. three.js loads only when this opens.
 */
const Venue3D = ({
  layout,
  zones,
  selectedTicketId,
  onPick,
  renderActions,
}: {
  layout: TVenueLayout;
  zones: TVenueZoneTicket[];
  selectedTicketId?: string | null;
  onPick?: (ticketId: string) => void;
  /** In place of "Pick this": e.g. the organiser choosing what goes in an area. */
  renderActions?: (zone: TVenueZoneTicket) => React.ReactNode;
}) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const venue = useRef<TVenueScene | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [zone, setZone] = useState<string | null>(null);
  const [inside, setInside] = useState(false);

  // Built once per layout and set of areas.
  const key = `${layout}:${zones.map((item) => `${item.zone}=${item.title}/${item.subtitle}/${item.soldOut}`).join("|")}`;
  useEffect(() => {
    let cancelled = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./venue-scene")
      .then(({ createVenueScene }) => {
        if (cancelled || !canvas.current) return;
        venue.current = createVenueScene(canvas.current, {
          layout,
          zones,
          dark: isDark(),
          reduceMotion,
          onTap: (tapped) => {
            setZone(tapped);
            venue.current?.select(tapped);
          },
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("failed"));
    const themeWatch = new MutationObserver(() => venue.current?.setDark(isDark()));
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => {
      cancelled = true;
      themeWatch.disconnect();
      venue.current?.dispose();
      venue.current = null;
    };
    // `key` stands for layout and zones.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Picking from the list highlights its area too.
  useEffect(() => {
    if (status !== "ready") return;
    const fromList = zones.find((item) => item.ticketId === selectedTicketId)?.zone ?? null;
    if (fromList && fromList !== zone) {
      setZone(fromList);
      venue.current?.select(fromList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketId, status]);

  const current = zones.find((item) => item.zone === zone) ?? null;

  return (
    <div className="relative aspect-[16/11] w-full touch-none overflow-hidden rounded-2xl bg-secondary-50 sm:aspect-[16/10] dark:bg-secondary-900">
      <canvas
        ref={canvas}
        className="size-full cursor-grab active:cursor-grabbing"
        aria-label="3D view of the venue. Tap an area to see its ticket."
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Loading the venue…
        </div>
      )}
      {status === "failed" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          The 3D view couldn&apos;t load on this device. Pick from the list below.
        </div>
      )}
      {status === "ready" && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
          <span className="pointer-events-auto rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground">
            {inside && current ? `The view from ${current.title}` : "Drag to turn · tap an area"}
          </span>
          {current && (
            <div className="pointer-events-auto grid w-full max-w-xs gap-2 rounded-2xl border border-border bg-card p-3 shadow-lg sm:w-auto">
              <p className="font-semibold text-foreground">
                {current.title} · {current.soldOut ? "Sold out" : current.subtitle}
              </p>
              {current.note && <p className="text-sm text-muted-foreground">{current.note}</p>}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    const next = !inside;
                    setInside(next);
                    venue.current?.viewFrom(next ? current.zone : null);
                  }}
                >
                  {inside ? "Back to the whole venue" : "View from here"}
                </Button>
                {renderActions ? (
                  renderActions(current)
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full"
                    disabled={current.soldOut}
                    onClick={() => onPick?.(current.ticketId)}
                  >
                    Pick this
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(Venue3D);
