"use client";

import { serverNow, useLiveCode } from "@/lib/live-code";
import { UserTicketDetailsResponseType } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import React, { memo } from "react";

const RING = "#00b2ff";
const RING_TRACK = "#E5F7FF";

const clockOf = (at: number) => {
  const parts = new Date(at)
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })
    .split(":");
  return { head: parts.slice(0, -1).join(":"), seconds: parts[parts.length - 1] };
};

/**
 * A ticket's QR, live, as on the app: it changes every 30 seconds (made in the
 * browser from the ticket's secret), so a screenshot stops working. Three
 * things move to show it's live: a ring counting down, a shimmering band with
 * the holder's name, and the seconds. `compact` is just the code, for the peek
 * on a card. Tickets without a secret show their plain code.
 */
const LiveTicketQr = ({
  ticket,
  size,
  usable,
  holderName,
  compact,
}: {
  ticket: UserTicketDetailsResponseType;
  size: number;
  /** Not used yet and not over: the code runs. */
  usable: boolean;
  holderName?: string;
  compact?: boolean;
}) => {
  const plain = ticket.qrCodeValue || ticket.ticketCode || ticket.code;
  const { value, secondsLeft, live, windowSeconds } = useLiveCode(
    ticket.liveCode,
    ticket.code,
    plain,
    usable,
  );
  if (compact || !live) {
    return <QRCodeSVG value={value} size={size} level="M" />;
  }
  const ring = size + 44;
  const radius = ring / 2 - 5;
  const around = 2 * Math.PI * radius;
  const clock = clockOf(serverNow());
  const band = `LIVE · TURNUPZ${holderName ? ` · ${holderName.toUpperCase()}` : ""} · LIVE`;
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-black/5 bg-white text-center">
      <style>{`@keyframes tz-shimmer { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      <div className="relative flex h-7 items-center justify-center overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[200%]"
          style={{
            background:
              "linear-gradient(90deg, #00b2ff, #7c5cff, #ff5ca8, #ffb347, #00b2ff, #7c5cff, #ff5ca8, #ffb347, #00b2ff)",
            animation: "tz-shimmer 2.4s linear infinite",
          }}
        />
        <span className="relative truncate px-3 text-[10px] font-extrabold tracking-[2.5px] text-white">
          {band}
        </span>
      </div>
      <div
        className="relative mx-auto mt-3 flex items-center justify-center"
        style={{ width: ring, height: ring }}
      >
        <svg width={ring} height={ring} className="absolute inset-0" aria-hidden>
          <circle cx={ring / 2} cy={ring / 2} r={radius} stroke={RING_TRACK} strokeWidth={6} fill="none" />
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            stroke={RING}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${around} ${around}`}
            strokeDashoffset={around * (1 - secondsLeft / windowSeconds)}
            transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        {/* Above the ring, so the ring never crosses the code. */}
        <div className="relative" style={{ opacity: usable ? 1 : 0.35, lineHeight: 0 }}>
          <QRCodeSVG value={value} size={size} level="M" />
        </div>
      </div>
      <p className="mt-2 flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-700" aria-live="polite">
        <span className="size-2 rounded-full bg-emerald-500" />
        Live code · new one in {secondsLeft}s
      </p>
      <p className="mt-0.5 mb-3 text-2xl font-extrabold text-zinc-950 tabular-nums">
        {clock.head}:<span className="text-[#0577FA]">{clock.seconds}</span>
      </p>
    </div>
  );
};

export default memo(LiveTicketQr);
