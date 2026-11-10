import logoWhite from "@/assets/images/logo-white.png";
import { formatEventTime, ticketDaysNote } from "@/lib/event-time";
import { IEventDetailsType, IUserTicketType } from "@/lib/types";
import React, { memo } from "react";

/*
 * The ticket as a page to keep: what a download saves. Printed things are
 * always light, so the colours here are fixed, not themed. It has no QR: a
 * saved copy can't change, and the door only accepts the live one, so it
 * carries the code staff can type in instead.
 */

const INK = "#0b1d2a";
const MUTED = "#5b6b78";
const LINE = "#E4E7EB";
const BLUE = "#0577FA";
const PAGE = "#EEF3F8";

const Detail = ({
  label,
  value,
  sub,
  wide,
}: {
  label: string;
  value: string;
  sub?: string;
  wide?: boolean;
}) => (
  <div style={{ gridColumn: wide ? "1 / -1" : undefined, minWidth: 0 }}>
    <p
      style={{
        margin: 0,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: MUTED,
      }}
    >
      {label}
    </p>
    <p
      style={{
        margin: "4px 0 0 0",
        fontSize: 14,
        fontWeight: 700,
        color: INK,
        lineHeight: 1.3,
      }}
    >
      {value}
    </p>
    {sub && (
      <p style={{ margin: "2px 0 0 0", fontSize: 11, color: MUTED, lineHeight: 1.35 }}>
        {sub}
      </p>
    )}
  </div>
);

const Step = ({ n, text }: { n: number; text: string }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: 9999,
        background: BLUE,
        color: "#ffffff",
        fontSize: 10,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {n}
    </span>
    <span style={{ fontSize: 10, lineHeight: 1.35, color: INK, textAlign: "center" }}>{text}</span>
  </div>
);

const SavedTicket: React.FC<{
  userTicket: IUserTicketType;
  event?: IEventDetailsType;
  holderName?: string | null;
  orderReference?: string | null;
  /** 1-based, of `total`. */
  position: number;
  total: number;
}> = ({ userTicket, event, holderName, orderReference, position, total }) => {
  const ticket = userTicket.ticket;
  const zone = event?.timezone;
  const date = event?.date
    ? formatEventTime(event.date, zone).replace(/,?\s*\d{1,2}:\d{2}.*$/, "")
    : "";
  const time = event?.date ? formatEventTime(event.date, zone, { timeOnly: true }) : "";
  const venue = event?.venue;
  const where = [venue?.address, venue?.city].filter(Boolean).join(", ");
  const daysNote = ticketDaysNote(ticket?.dayIds, event);
  const price = (ticket?.price?.amount ?? 0) > 0 ? ticket?.price?.formatted?.withCurrency : "Free";
  const code = (userTicket.code ?? userTicket.ticketCode ?? "").toUpperCase();

  return (
    <div
      data-saved-ticket
      style={{
        width: 420,
        padding: 20,
        background: PAGE,
        fontFamily: "var(--font-brand-sans), system-ui, -apple-system, sans-serif",
        color: INK,
      }}
    >
      <div style={{ background: "#ffffff", borderRadius: 20, overflow: "hidden" }}>
        {/* Cover: the event's own picture, darkened so the name reads. */}
        <div
          style={{
            position: "relative",
            height: 176,
            backgroundColor: INK,
            backgroundImage: event?.image
              ? `linear-gradient(180deg, rgba(11,29,42,0.25) 0%, rgba(11,29,42,0.92) 100%), url("${event.image}")`
              : `linear-gradient(135deg, #00b2ff 0%, ${BLUE} 55%, #034896 100%)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoWhite.src} alt="" width={22} height={22} />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>Turnupz</span>
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.14em",
                color: "#ffffff",
                padding: "4px 10px",
                borderRadius: 9999,
                border: "1px solid rgba(255,255,255,0.5)",
              }}
            >
              E-TICKET
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#ffffff",
            }}
          >
            {event?.name ?? ticket?.event?.name ?? "Your ticket"}
          </h1>
        </div>

        {/* What it's for */}
        <div
          style={{
            padding: "20px 20px 22px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 16px",
          }}
        >
          {date && <Detail label="Date" value={date} />}
          {time && <Detail label="Doors" value={time} />}
          {venue?.name && <Detail label="Venue" value={venue.name} sub={where || undefined} wide />}
          <Detail label="Ticket" value={ticket?.name ?? "Ticket"} sub={daysNote || undefined} />
          <Detail label="Price" value={price ?? ""} />
          {holderName && <Detail label="Name on ticket" value={holderName} wide />}
        </div>

        {/* Tear line, with notches cut from the page colour. */}
        <div style={{ position: "relative", height: 24 }}>
          <span
            style={{
              position: "absolute",
              left: -12,
              top: 0,
              width: 24,
              height: 24,
              borderRadius: 9999,
              background: PAGE,
            }}
          />
          <span
            style={{
              position: "absolute",
              right: -12,
              top: 0,
              width: 24,
              height: 24,
              borderRadius: 9999,
              background: PAGE,
            }}
          />
          <span
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: 11,
              borderTop: `2px dashed ${LINE}`,
            }}
          />
        </div>

        {/* Getting in */}
        <div style={{ padding: "18px 20px 20px", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            Entry code
          </p>
          <p
            style={{
              margin: "8px 0 0 0",
              padding: "12px 8px",
              borderRadius: 12,
              background: "#EEF6FF",
              border: "1px solid #CFE3FE",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "0.06em",
              color: INK,
              whiteSpace: "nowrap",
            }}
          >
            {code}
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Step n={1} text="Open your ticket in the Turnupz app or on turnupz.com" />
            <Step n={2} text="Show the live QR at the door" />
            <Step n={3} text="No phone? Give staff this code and your ID" />
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid ${LINE}`,
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: MUTED,
          }}
        >
          <span>
            {orderReference ? `Order ${orderReference} · ` : ""}Ticket {position} of {total}
          </span>
          <span style={{ fontWeight: 700, color: BLUE }}>turnupz.com</span>
        </div>
      </div>
    </div>
  );
};

export default memo(SavedTicket);
