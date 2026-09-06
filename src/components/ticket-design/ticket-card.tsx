"use client";

import { IEventDetailsType, IUserTicketType } from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import { Button } from "@/components/ui/button";
import { format, startOfDay } from "date-fns";
import { Download, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import React, { memo, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

interface TicketCardProps {
  userTicket: IUserTicketType;
  event?: IEventDetailsType;
  index: number;
  /** Show transfer button (default true) */
  showTransfer?: boolean;
}

const getTicketColors = (type: string) => {
  const t = (type ?? "").toLowerCase();
  if (t.includes("vip") || t.includes("gold"))
    return {
      main: "linear-gradient(135deg, #92400e 0%, #b45309 30%, #d97706 70%, #92400e 100%)",
      stub: "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
    };
  if (t.includes("silver"))
    return {
      main: "linear-gradient(135deg, #334155 0%, #475569 30%, #64748b 70%, #334155 100%)",
      stub: "linear-gradient(135deg, #64748b 0%, #334155 100%)",
    };
  if (t.includes("bronze"))
    return {
      main: "linear-gradient(135deg, #78350f 0%, #92400e 30%, #b45309 70%, #78350f 100%)",
      stub: "linear-gradient(135deg, #b45309 0%, #78350f 100%)",
    };
  if (t.includes("premium") || t.includes("platinum"))
    return {
      main: "linear-gradient(135deg, #4c1d95 0%, #6b21a8 30%, #7c3aed 70%, #4c1d95 100%)",
      stub: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
    };
  return {
    main: "linear-gradient(135deg, #0e7490 0%, #0d9488 30%, #155e75 70%, #1e3a5f 100%)",
    stub: "linear-gradient(135deg, #0891b2 0%, #164e63 100%)",
  };
};

function isTicketTransferAllowed(userTicket: IUserTicketType) {
  if (userTicket.ticket.isTransferable !== undefined) {
    return userTicket.ticket.isTransferable;
  }
  if (userTicket.ticket.transferable !== undefined) {
    return userTicket.ticket.transferable;
  }

  const eventTickets = userTicket.ticket.event?.data?.eventTickets ?? [];
  const matchingCategory = eventTickets.find((eventTicket) => {
    const ticketName = userTicket.ticket.name?.toLowerCase();
    const ticketType = userTicket.ticket.type?.toLowerCase();
    const categoryName = eventTicket.ticketName?.toLowerCase();
    return categoryName === ticketName || categoryName === ticketType;
  });

  return !!matchingCategory?.transferable;
}

const TicketCard: React.FC<TicketCardProps> = ({
  userTicket,
  event: eventProp,
  index,
  showTransfer = true,
}) => {
  const ticket = userTicket?.ticket;
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const colors = getTicketColors(ticket?.type ?? "");
  const event = eventProp ?? ticket?.event?.data;
  const transferAllowed = isTicketTransferAllowed(userTicket);
  const registrationStatus = userTicket.registrationStatus;
  const isPendingRegistration = registrationStatus === "PENDING";
  const isRejectedRegistration = registrationStatus === "REJECTED";
  const isRegistrationTicket =
    ticket?.name?.toLowerCase() === "registration" ||
    ticket?.type?.toLowerCase() === "registration" ||
    ticket?.event?.data?.saleMethod === "register";
  const isRegistrationBlocked =
    isRegistrationTicket && (isPendingRegistration || isRejectedRegistration);
  const scanValue =
    userTicket.qrCodeValue || userTicket.ticketCode || userTicket.code;
  const eventDate = event?.date ? new Date(event.date) : null;
  const isEventPast = eventDate
    ? startOfDay(eventDate) < startOfDay(new Date())
    : false;

  const handleDownload = useCallback(async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 100)));
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const safeTicketName = (ticket.name ?? "ticket")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const safeEventName = (event?.name ?? "event")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const filename = `${safeEventName}-ticket-${index + 1}-${safeTicketName}.pdf`;

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
      toast.success("Ticket downloaded");
    } catch {
      if (ticket.link) {
        window.open(ticket.link, "_blank");
        toast.info("Opening ticket link");
      } else {
        toast.error("Failed to download ticket");
      }
    } finally {
      setIsDownloading(false);
    }
  }, [ticket, index, event]);

  if (!ticket) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {isPendingRegistration && (
        <div className="mb-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Registration Pending Approval</p>
          <p className="mt-1">
            This registration is waiting for the organizer to approve it.
          </p>
        </div>
      )}
      {isRejectedRegistration && (
        <div className="mb-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">Registration Rejected</p>
          <p className="mt-1">
            This registration was not approved by the organizer.
          </p>
        </div>
      )}
      <div
        ref={ticketRef}
        data-ticket-card
        style={{
          display: "flex",
          borderRadius: 16,
          overflow: "hidden",
          minHeight: 210,
          fontFamily: "system-ui, -apple-system, sans-serif",
          opacity: isRegistrationBlocked ? 0.72 : 1,
        }}
      >
        {/* Main section */}
        <div
          style={{
            flex: 1,
            background: colors.main,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Diagonal stripe pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.04,
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)",
            }}
          />

          {/* Watermark */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: 68,
                fontWeight: 900,
                color: "rgba(255,255,255,0.06)",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                transform: "rotate(-20deg)",
                whiteSpace: "nowrap",
              }}
            >
              TurnUpz
            </span>
          </div>

          {/* Ticket type badge + event name */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "3px 10px",
                borderRadius: 100,
                background: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {isPendingRegistration
                ? "Pending"
                : isRejectedRegistration
                  ? "Rejected"
                  : ticket.type}
            </span>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.25,
                marginTop: 10,
                marginBottom: 0,
              }}
            >
              {event?.name ?? "Event"}
            </h3>
          </div>

          {/* Date and venue */}
          <div style={{ position: "relative", zIndex: 1, marginTop: 16 }}>
            {eventDate && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.75)",
                  marginBottom: 6,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                <span>{format(eventDate, "EEE, MMM d, yyyy · h:mm a")}</span>
              </div>
            )}
            {event?.venue?.name && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{event.venue.name}</span>
              </div>
            )}
          </div>

          {/* Ticket name + branding */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 100,
                background: "rgba(255,255,255,0.2)",
                color: "#ffffff",
              }}
            >
              {ticket.name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.05em",
              }}
            >
              turnupz.com
            </span>
          </div>
        </div>

        {/* Perforated divider */}
        <div
          style={{
            width: 24,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: colors.stub,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -12,
              left: "50%",
              transform: "translateX(-50%)",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#ffffff",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -12,
              left: "50%",
              transform: "translateX(-50%)",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#ffffff",
              zIndex: 2,
            }}
          />
          <div
            style={{
              flex: 1,
              borderLeft: "2px dashed rgba(255,255,255,0.25)",
              marginTop: 16,
              marginBottom: 16,
            }}
          />
        </div>

        {/* Stub section */}
        <div
          style={{
            width: 150,
            flexShrink: 0,
            background: colors.stub,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Stub watermark */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: "rgba(255,255,255,0.06)",
                textTransform: "uppercase",
                transform: "rotate(90deg)",
                whiteSpace: "nowrap",
              }}
            >
              TurnUpz
            </span>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: "#ffffff",
                margin: "0 0 6px 0",
                lineHeight: 1.2,
              }}
            >
              {ticket.price?.formatted?.withCurrency ?? "Free"}
            </p>

            {/* QR Code */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 6,
                padding: 6,
                display: "inline-block",
                lineHeight: 0,
                filter: isRegistrationBlocked ? "grayscale(1) blur(1px)" : "none",
                opacity: isRegistrationBlocked ? 0.45 : 1,
              }}
            >
              <QRCodeSVG
                value={scanValue}
                size={80}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>

            {isRegistrationBlocked && (
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#ffffff",
                  margin: "6px 0 0 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Not scannable yet
              </p>
            )}

            <p
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                color: "rgba(255,255,255,0.6)",
                margin: "6px 0 0 0",
                wordBreak: "break-all",
                lineHeight: 1.3,
              }}
            >
              {scanValue}
            </p>
          </div>
        </div>
      </div>

      {/* Actions - outside the captured area */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 8,
          marginTop: 12,
        }}
      >
        {isEventPast ? (
          <p className="text-sm text-muted-foreground italic">
            Event has passed
          </p>
        ) : (
          <>
            {showTransfer && transferAllowed && !isRegistrationBlocked && (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link
                  href={`${ROUTES.PROFILE_TICKETS.href}/transfer/${userTicket.id}`}
                >
                  <SendHorizontal className="size-3.5" />
                  {userTicket.transfer ? "View Transfer" : "Transfer"}
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              loading={isDownloading}
              disabled={isRegistrationBlocked}
              className="gap-2"
            >
              <Download className="size-3.5" />
              Download
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(TicketCard);
