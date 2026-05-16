"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvents } from "@/hooks/use-event";
import {
  ScannerAccessApiRecord,
  useAddEventScanner,
  useEventScanners,
  useRevokeEventScanner,
  useScanEventTicket,
  useVendorTicketAnalytics,
  useVendorTicketLedger,
  VendorTicketAnalyticsApiRecord,
  VendorTicketLedgerApiRecord,
} from "@/hooks/use-vendor-tickets";
import useUserStore from "@/stores/user-store";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MailPlus,
  MapPin,
  SearchIcon,
  ShieldCheck,
  TicketIcon,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import {
  buildVendorTicketCategoryAnalytics,
  VendorTicketLedgerRecord,
  VendorTicketTransferStatus,
} from "./ticket-ledger-data";
import { IEventDetailsType } from "@/lib/types";

type TicketStatusFilter = "All" | VendorTicketTransferStatus;

type ScannerAccessStatus = "Active" | "Expired" | "Revoked";

interface VendorScannerAccess {
  id: string;
  email: string;
  eventId: string;
  grantedAt: string;
  expiresAt: string;
  status: ScannerAccessStatus;
}

const statusFilters: TicketStatusFilter[] = [
  "All",
  "Not Transferred",
  "Transferred",
];

const getEventAccessExpiryDate = (date?: Date | string) => {
  const expiry = date ? new Date(date) : new Date();
  expiry.setHours(23, 59, 59, 999);
  return expiry;
};

const formatEventAccessExpiry = (date?: Date | string) => {
  if (!date) return "Expires after event day";
  return `Expires ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(getEventAccessExpiryDate(date))} at 11:59 PM`;
};

const getScannerAccessStatus = (
  scanner: VendorScannerAccess,
): ScannerAccessStatus => {
  if (scanner.status === "Revoked") return "Revoked";
  return new Date(scanner.expiresAt).getTime() < Date.now()
    ? "Expired"
    : "Active";
};

const formatScannerAccessDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const formatPlainNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const getMoneyLabel = (value: VendorTicketLedgerApiRecord["price"]) => {
  if (typeof value !== "number" && value?.formatted?.withCurrency) {
    return value.formatted.withCurrency;
  }

  if (
    typeof value !== "number" &&
    value?.currency?.code &&
    Number.isFinite(Number(value.amount))
  ) {
    return Number(value.amount) > 0
      ? new Intl.NumberFormat(value.currency.locale || "en-US", {
          style: "currency",
          currency: value.currency.code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Number(value.amount))
      : "Free";
  }

  if (typeof value === "number") {
    return value > 0 ? formatPlainNumber(value) : "Free";
  }

  return "Free";
};

const getMoneyAmount = (value: VendorTicketLedgerApiRecord["price"]) => {
  return typeof value === "number" ? value : Number(value?.amount ?? 0);
};

const formatApiDate = (value?: string) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(value));
};

const formatApiDateTime = (value?: string) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const mapLedgerApiRecord = (
  record: VendorTicketLedgerApiRecord,
): VendorTicketLedgerRecord => {
  const priceAmount = getMoneyAmount(record.price);
  const amountNumber = getMoneyAmount(record.amount);

  return {
    id: record.ticketId,
    eventId: record.eventId,
    date: formatApiDate(record.issueDate),
    purchaserName: record.purchaserName,
    purchaserEmail: record.purchaserEmail,
    currentHolderName: record.currentHolderName,
    currentHolderEmail: record.currentHolderEmail,
    event: record.eventName,
    category: record.ticketCategory,
    price: getMoneyLabel(record.price),
    priceAmount,
    quantity: record.quantity,
    amount: getMoneyLabel(record.amount),
    amountNumber,
    status:
      record.transferStatus === "claimed" || record.transferStatus === "transferred"
        ? "Transferred"
        : "Not Transferred",
    entryStatus:
      record.entryStatus === "checked_in" ? "Checked In" : "Not Checked In",
    venue: [record.venueName, record.venueAddress].filter(Boolean).join(", "),
    issueDate: formatApiDateTime(record.eventDateTime ?? record.eventDate),
    checkedInAt: formatApiDateTime(record.checkedInAt),
    scannerEmail: record.scannerEmail,
    ticketCode: record.ticketCode,
    qrCodeValue: record.qrCodeValue,
    barcodeValue: record.barcodeValue,
  };
};

const mapScannerApiRecord = (
  scanner: ScannerAccessApiRecord,
): VendorScannerAccess => ({
  id: scanner.id,
  email: scanner.email,
  eventId: scanner.eventId,
  grantedAt: scanner.createdAt,
  expiresAt: scanner.expiresAt,
  status:
    scanner.status === "active"
      ? "Active"
      : scanner.status === "revoked"
        ? "Revoked"
        : scanner.status === "expired"
          ? "Expired"
          : "Active",
});

const mapAnalyticsRecord = (item: VendorTicketAnalyticsApiRecord) => ({
  eventId: item.eventId ?? "",
  event: item.eventName ?? item.event ?? "Event",
  category: item.ticketCategory ?? item.category ?? "Ticket",
  price: "",
  purchased: item.purchased ?? item.totalPurchased ?? 0,
  attended: item.attended ?? item.totalAttended ?? 0,
  transferred: item.transferred ?? item.totalTransferred ?? 0,
  remaining: item.remaining ?? item.totalRemaining ?? 0,
  revenue: getMoneyLabel(item.revenue ?? 0),
});

const getEventPassAssignments = (event: IEventDetailsType) =>
  event.passAssignments ?? event.accessPasses ?? event.eventPasses ?? event.passes ?? [];

const VendorTicketPreview: React.FC<{ ticket: VendorTicketLedgerRecord }> = ({
  ticket,
}) => {
  const isFree = ticket.priceAmount === 0;
  const scanValue = ticket.qrCodeValue || ticket.ticketCode || ticket.id;

  return (
    <article>
      <div className="grid min-h-[13rem] overflow-hidden rounded-[1.4rem] bg-[linear-gradient(135deg,#319d91_0%,#1f6d86_54%,#174867_100%)] text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:grid-cols-[minmax(0,1fr)_10rem]">
        <div className="relative flex min-h-[13rem] flex-col justify-between overflow-hidden px-6 py-6">
          <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(45deg,transparent,transparent_10px,#ffffff_10px,#ffffff_11px)]" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-20 text-6xl font-black uppercase tracking-[0.16em] text-white/10">
              Turnupz
            </span>
          </div>
          <div className="relative z-10 space-y-5">
            <span className="inline-flex rounded-full bg-white/18 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
              {isFree ? "Free" : ticket.category}
            </span>
            <div>
              <h3 className="text-xl font-black leading-tight">{ticket.event}</h3>
              <div className="mt-5 space-y-2 text-sm text-white/78">
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {ticket.issueDate}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  {ticket.venue}
                </p>
              </div>
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-between gap-3">
            <span className="rounded-full bg-white/18 px-4 py-2 text-sm font-semibold">
              {ticket.category}
            </span>
            <span className="text-xs font-semibold text-white/45">turnupz.com</span>
          </div>
        </div>

        <div className="relative flex min-h-[13rem] flex-col items-center justify-center bg-black/12 px-5 py-5">
          <div className="absolute -left-3 top-0 h-full border-l border-dashed border-white/30" />
          <div className="absolute -left-3 top-0 size-6 -translate-y-1/2 rounded-full bg-white" />
          <div className="absolute -left-3 bottom-0 size-6 translate-y-1/2 rounded-full bg-white" />
          <p className="text-lg font-black">{ticket.price}</p>
          <div className="mt-3 rounded-lg bg-white p-2">
            <QRCodeSVG value={scanValue} size={92} level="M" />
          </div>
          <p className="mt-2 break-all text-center text-[10px] font-medium text-white/58">
            {ticket.ticketCode || ticket.id}
          </p>
        </div>
      </div>
    </article>
  );
};

const TicketList = () => {
  const searchParams = useSearchParams();
  const userId = useUserStore((state) => state?.userDetails?.id);
  const [activeStatus, setActiveStatus] = useState<TicketStatusFilter>("All");
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q")?.trim() ?? "",
  );
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [selectedScannerEventId, setSelectedScannerEventId] = useState("");
  const [scannerEmailDraft, setScannerEmailDraft] = useState("");
  const [scanCode, setScanCode] = useState("");
  const { data } = useEvents({ limit: 50 });
  const { data: userEventsData } = useEvents(
    { limit: 50, userId: userId ?? undefined },
    { enabled: !!userId },
  );
  const { data: ledgerResponse } = useVendorTicketLedger({
    page: 1,
    limit: 100,
  });
  const { data: analyticsResponse } = useVendorTicketAnalytics({
    eventId: selectedEventId === "all" ? undefined : selectedEventId,
  });
  const { data: scannerAccessResponse } =
    useEventScanners(selectedScannerEventId);
  const addScannerMutation = useAddEventScanner(selectedScannerEventId);
  const revokeScannerMutation = useRevokeEventScanner(selectedScannerEventId);
  const scanTicketMutation = useScanEventTicket(selectedScannerEventId);

  useEffect(() => {
    setSearchQuery(searchParams.get("q")?.trim() ?? "");
  }, [searchParams]);

  const events = useMemo(() => {
    const merged = [
      ...(data?.pages?.flatMap((page) => page?.data ?? []) ?? []),
      ...(userEventsData?.pages?.flatMap((page) => page?.data ?? []) ?? []),
    ];
    return Array.from(new Map(merged.map((event) => [event.id, event])).values());
  }, [data, userEventsData]);

  const rows = useMemo(() => {
    const apiRows = (ledgerResponse?.records ?? []).map(mapLedgerApiRecord);
    return apiRows;
  }, [ledgerResponse?.records]);

  const eventOptions = useMemo(() => {
    const eventMap = new Map<string, string>();
    rows.forEach((row) => eventMap.set(row.eventId, row.event));
    return Array.from(eventMap).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const ticketEventCards = useMemo(() => {
    if (events.length > 0) {
      return events
        .map((event) => {
          const eventRows = rows.filter((row) => row.eventId === event.id);
          const purchased = eventRows.length;
          const attended = eventRows.filter(
            (row) => row.entryStatus === "Checked In",
          ).length;
          const ticketInventory = (event.eventTickets ?? []).reduce(
            (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
            0,
          );
          const passInventory = getEventPassAssignments(event).reduce(
            (sum, pass) => sum + Number(pass.quantity || 0),
            0,
          );
          const registrationInventory = Number(
            event.registrationLimit ?? event.totalTickets ?? 0,
          );
          const categoryNames = (event.eventTickets ?? [])
            .map((ticket) => ticket.ticketName)
            .filter(Boolean);
          const passNames = getEventPassAssignments(event)
            .map((pass) => pass.passName)
            .filter(Boolean);
          const normalizedCategoryNames =
            categoryNames.length > 0
              ? categoryNames
              : event.saleMethod === "register"
                ? ["Registration"]
                : [];
          const scannerCategories = [
            ...normalizedCategoryNames,
            ...passNames.map((name) => `${name} Pass`),
          ];

          return {
            id: event.id,
            name: event.name,
            date: event.date,
            purchased,
            attended,
            inventory: ticketInventory + passInventory || registrationInventory,
            accessExpiresLabel: formatEventAccessExpiry(event.date),
            scannerCount: (
              selectedScannerEventId === event.id
                ? (scannerAccessResponse ?? []).map(mapScannerApiRecord)
                : []
            ).filter(
              (scanner) => getScannerAccessStatus(scanner) === "Active",
            ).length,
            categories: scannerCategories.length,
            categoryNames: scannerCategories,
          };
        });
    }

    return eventOptions.map((event) => {
      const eventRows = rows.filter((row) => row.eventId === event.id);
      return {
        ...event,
        date: undefined,
        purchased: eventRows.length,
        attended: eventRows.filter((row) => row.entryStatus === "Checked In")
          .length,
        inventory: eventRows.length,
        accessExpiresLabel: "Expires after event day",
        scannerCount: (
          selectedScannerEventId === event.id
            ? (scannerAccessResponse ?? []).map(mapScannerApiRecord)
            : []
        ).filter(
          (scanner) => getScannerAccessStatus(scanner) === "Active",
        ).length,
        categories: new Set(eventRows.map((row) => row.category)).size,
        categoryNames: Array.from(new Set(eventRows.map((row) => row.category))),
      };
    });
  }, [eventOptions, events, rows, scannerAccessResponse, selectedScannerEventId]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesEvent =
        selectedEventId === "all" ? true : row.eventId === selectedEventId;
      const matchesStatus =
        activeStatus === "All" ? true : row.status === activeStatus;
      const haystack =
        `${row.id} ${row.purchaserName} ${row.currentHolderName} ${row.event} ${row.category}`.toLowerCase();
      const matchesSearch = haystack.includes(searchQuery.toLowerCase());
      return matchesEvent && matchesStatus && matchesSearch;
    });
  }, [activeStatus, rows, searchQuery, selectedEventId]);

  const categoryAnalytics = useMemo(() => {
    const apiAnalytics = (analyticsResponse?.rows ?? []).map(mapAnalyticsRecord);
    if (apiAnalytics.length > 0) {
      return apiAnalytics.filter((item) =>
        selectedEventId === "all" ? true : item.eventId === selectedEventId,
      );
    }

    return buildVendorTicketCategoryAnalytics(
      selectedEventId === "all"
        ? rows
        : rows.filter((row) => row.eventId === selectedEventId),
      events,
    ).filter((item) =>
      selectedEventId === "all" ? true : item.eventId === selectedEventId,
    );
  }, [analyticsResponse, events, rows, selectedEventId]);

  const totals = useMemo(() => {
    const purchased = categoryAnalytics.reduce(
      (sum, item) => sum + item.purchased,
      0,
    );
    const attended = categoryAnalytics.reduce(
      (sum, item) => sum + item.attended,
      0,
    );
    const transferred = categoryAnalytics.reduce(
      (sum, item) => sum + item.transferred,
      0,
    );
    const remaining = categoryAnalytics.reduce(
      (sum, item) => sum + item.remaining,
      0,
    );
    return { purchased, attended, transferred, remaining };
  }, [categoryAnalytics]);

  const scannerReportRows = useMemo(() => {
    return filteredRows
      .filter((row) => row.entryStatus === "Checked In")
      .slice(0, 5);
  }, [filteredRows]);

  const selectedScannerTickets = useMemo(() => {
    if (!selectedScannerEventId) return [];
    return rows.filter((row) => row.eventId === selectedScannerEventId);
  }, [rows, selectedScannerEventId]);

  const selectedScannerEvent = useMemo(() => {
    return ticketEventCards.find((event) => event.id === selectedScannerEventId);
  }, [ticketEventCards, selectedScannerEventId]);

  const selectedEventScanners = useMemo(() => {
    if (!selectedScannerEventId) return [];
    return (scannerAccessResponse ?? []).map(mapScannerApiRecord).map((scanner) => ({
      ...scanner,
      status: getScannerAccessStatus(scanner),
    }));
  }, [scannerAccessResponse, selectedScannerEventId]);

  const scanResult = useMemo(() => {
    if (scanTicketMutation.data) {
      return {
        status:
          scanTicketMutation.data.status === "approved"
            ? ("approved" as const)
            : scanTicketMutation.data.status === "already_checked_in"
              ? ("used" as const)
              : ("denied" as const),
        title:
          scanTicketMutation.data.status === "approved"
            ? "Access approved"
            : scanTicketMutation.data.status === "already_checked_in"
              ? "Already checked in"
              : "Access denied",
        description:
          scanTicketMutation.data.message ||
          (scanTicketMutation.data.attendeeName
            ? `${scanTicketMutation.data.attendeeName} - ${scanTicketMutation.data.ticketCategory}`
            : "Scan completed."),
      };
    }

    const nextScanCode = scanCode.trim().toLowerCase();
    if (!nextScanCode || !selectedScannerEventId) return null;

    const matchedTicket = selectedScannerTickets.find(
      (ticket) =>
        ticket.id.toLowerCase() === nextScanCode ||
        ticket.id.toLowerCase().includes(nextScanCode) ||
        ticket.ticketCode?.toLowerCase() === nextScanCode ||
        ticket.qrCodeValue?.toLowerCase() === nextScanCode ||
        ticket.barcodeValue?.toLowerCase() === nextScanCode,
    );

    if (!matchedTicket) {
      return {
        status: "denied" as const,
        title: "Access denied",
        description: "This barcode does not match a ticket for the selected event.",
      };
    }

    if (matchedTicket.entryStatus === "Checked In") {
      return {
        status: "used" as const,
        title: "Already checked in",
        description: `${matchedTicket.currentHolderName} was checked in by ${matchedTicket.scannerEmail || "a scanner"}.`,
      };
    }

    return {
      status: "approved" as const,
      title: "Access approved",
      description: `${matchedTicket.currentHolderName} can enter with ${matchedTicket.category}.`,
    };
  }, [
    scanCode,
    scanTicketMutation.data,
    selectedScannerEventId,
    selectedScannerTickets,
  ]);

  const handleAddScanner = async () => {
    if (!selectedScannerEventId) return;
    const email = scannerEmailDraft.trim().toLowerCase();
    const existing = selectedEventScanners;
    if (!email || existing.some((scanner) => scanner.email === email)) return;

    try {
      await addScannerMutation.mutateAsync(email);
      setScannerEmailDraft("");
      toast.success("Scanner access granted.");
      return;
    } catch {
      toast.error("Unable to grant scanner access.");
      return;
    }
  };

  const handleRevokeScanner = async (scannerId: string) => {
    if (!selectedScannerEventId) return;
    try {
      await revokeScannerMutation.mutateAsync(scannerId);
      toast.success("Scanner access revoked.");
    } catch {
      toast.error("Unable to revoke scanner access.");
      return;
    }
  };

  const handleScanTicket = async () => {
    const nextScanCode = scanCode.trim();
    if (!selectedScannerEventId || !nextScanCode) return;

    try {
      const response = await scanTicketMutation.mutateAsync(nextScanCode);
      if (response.status === "approved") {
        toast.success(response.message || "Ticket approved.");
      } else if (response.status === "already_checked_in") {
        toast.warning(response.message || "Ticket has already been checked in.");
      } else {
        toast.error(response.message || "Ticket denied.");
      }
    } catch {
      toast.error("Unable to validate ticket.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Purchased", totals.purchased],
          ["Attended", totals.attended],
          ["Transferred", totals.transferred],
          ["Remaining", totals.remaining],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[1.3rem] border border-secondary-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
          >
            <p className="text-sm text-secondary-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-secondary-950">
              {Number(value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4 rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-secondary-950">
                Ticket Category Analysis
              </p>
              <p className="text-sm text-secondary-500">
                Compare purchase, transfer, and attendance performance by event or ticket type.
              </p>
            </div>
            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="h-11 rounded-xl border border-secondary-200 bg-white px-3 text-sm"
            >
              <option value="all">All Events</option>
              {eventOptions.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="text-left text-secondary-500">
                <tr>
                  {["Event", "Ticket", "Bought", "Attended", "Transferred", "Remaining", "Revenue"].map(
                    (heading) => (
                      <th key={heading} className="px-3 py-3 font-medium">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {categoryAnalytics.map((item) => (
                  <tr
                    key={`${item.eventId}-${item.category}`}
                    className="border-t border-secondary-100"
                  >
                    <td className="px-3 py-4 text-secondary-500">{item.event}</td>
                    <td className="px-3 py-4 font-semibold text-secondary-950">
                      {item.category}
                    </td>
                    <td className="px-3 py-4">{item.purchased}</td>
                    <td className="px-3 py-4">{item.attended}</td>
                    <td className="px-3 py-4">{item.transferred}</td>
                    <td className="px-3 py-4">{item.remaining}</td>
                    <td className="px-3 py-4 font-semibold text-secondary-950">
                      {item.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
              <TicketIcon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-secondary-950">
                Event Scanner Cards
              </p>
              <p className="text-sm text-secondary-500">
                Give scanner access, then open an event card to view the tickets created for that event.
              </p>
            </div>
          </div>
          {ticketEventCards.length > 3 && (
            <p className="text-xs font-medium text-secondary-500">
              Showing {ticketEventCards.length} event cards. Scroll inside this
              panel to view the rest.
            </p>
          )}
          <div className="grid max-h-[34rem] gap-3 overflow-y-auto pr-1 xl:grid-cols-2">
            {ticketEventCards.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => {
                  setSelectedScannerEventId(event.id);
                  setScanCode("");
                }}
                className={`rounded-xl border px-4 py-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50/60 ${
                  selectedScannerEventId === event.id
                    ? "border-cyan-300 bg-cyan-50/80"
                    : "border-secondary-100 bg-secondary-50"
                }`}
              >
                <span className="block text-sm font-semibold text-secondary-950">
                  {event.name}
                </span>
                <span className="mt-1 block text-xs text-secondary-500">
                  {event.categories} ticket section
                  {event.categories === 1 ? "" : "s"} - {event.purchased} bought
                  - {event.attended} checked in
                </span>
                <span className="mt-1 block text-xs text-secondary-500">
                  {event.scannerCount} active scanner
                  {event.scannerCount === 1 ? "" : "s"} - access{" "}
                  {event.accessExpiresLabel.toLowerCase()}
                </span>
                {event.categoryNames.length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-1">
                    {event.categoryNames.slice(0, 3).map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-secondary-600"
                      >
                        {category}
                      </span>
                    ))}
                    {event.categoryNames.length > 3 && (
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-secondary-400">
                        +{event.categoryNames.length - 3} more
                      </span>
                    )}
                  </span>
                )}
                {selectedScannerEventId === event.id && selectedEventScanners.length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-1">
                    {selectedEventScanners.map((scanner) => (
                      <span
                        key={scanner.id}
                        className={`rounded-full bg-white px-2 py-1 text-[11px] font-medium ${
                          getScannerAccessStatus(scanner) === "Active"
                            ? "text-cyan-700"
                            : "text-secondary-400"
                        }`}
                      >
                        {scanner.email}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            ))}
            {ticketEventCards.length === 0 && (
              <div className="rounded-xl border border-dashed border-secondary-200 px-4 py-5 text-sm text-secondary-500">
                No event cards yet. Publish an event to connect scanner access.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedScannerEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-[1.8rem] bg-white p-5 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-secondary-950">
                  Your Tickets
                </h2>
                <p className="mt-1 text-sm text-secondary-500">
                  {selectedScannerTickets.length} tickets for{" "}
                  {selectedScannerEvent.name}. Download each ticket individually.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedScannerEventId("");
                  setScanCode("");
                }}
                className="rounded-full p-2 text-secondary-500 hover:bg-secondary-50"
                aria-label="Close tickets"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-secondary-50 p-4">
                  <p className="text-xs text-secondary-500">Tickets Bought</p>
                  <p className="mt-1 text-2xl font-bold text-secondary-950">
                    {selectedScannerEvent.purchased}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary-50 p-4">
                  <p className="text-xs text-secondary-500">Attended</p>
                  <p className="mt-1 text-2xl font-bold text-secondary-950">
                    {selectedScannerEvent.attended}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary-50 p-4">
                  <p className="text-xs text-secondary-500">Scanner Access</p>
                  <p className="mt-1 text-sm font-semibold text-secondary-950">
                    {selectedScannerEvent.accessExpiresLabel}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-secondary-100 bg-secondary-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-secondary-950">
                      Scanner Access For This Event
                    </p>
                    <p className="mt-1 text-xs text-secondary-500">
                      Add registered user emails. Access is tied to this event and expires after event day.
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
                    <UserCheck className="size-3.5" />
                    {
                      selectedEventScanners.filter(
                        (scanner) => scanner.status === "Active",
                      ).length
                    }{" "}
                    active
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input
                    value={scannerEmailDraft}
                    onChange={(event) => setScannerEmailDraft(event.target.value)}
                    placeholder="scanner@example.com"
                    className="h-11 rounded-xl border-secondary-200 bg-white"
                  />
                  <Button
                    type="button"
                    onClick={handleAddScanner}
                    disabled={addScannerMutation.isPending}
                    className="h-11 rounded-xl"
                  >
                    <MailPlus className="size-4" />
                    {addScannerMutation.isPending ? "Giving Access" : "Give Access"}
                  </Button>
                </div>
                <div className="mt-4 grid gap-2">
                  {selectedEventScanners.length === 0 && (
                    <span className="rounded-xl border border-dashed border-secondary-200 bg-white px-4 py-4 text-xs text-secondary-500">
                      No scanner has access to this event yet.
                    </span>
                  )}
                  {selectedEventScanners.map((scanner) => (
                    <div
                      key={scanner.id}
                      className="flex flex-col gap-3 rounded-xl bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <ShieldCheck
                            className={`size-4 ${
                              scanner.status === "Active"
                                ? "text-cyan-600"
                                : "text-secondary-400"
                            }`}
                          />
                          <span className="break-all font-semibold text-secondary-950">
                            {scanner.email}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] ${
                              scanner.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : scanner.status === "Expired"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-600"
                            }`}
                          >
                            {scanner.status}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3.5" />
                            Granted {formatScannerAccessDate(scanner.grantedAt)}
                          </span>
                          <span>
                            Expires {formatScannerAccessDate(scanner.expiresAt)}
                          </span>
                        </div>
                      </div>
                      {scanner.status !== "Revoked" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRevokeScanner(scanner.id)}
                          disabled={revokeScannerMutation.isPending}
                          className="h-9 w-fit rounded-xl border-red-100 px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="size-3.5" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-secondary-100 bg-white p-4">
                <p className="text-sm font-semibold text-secondary-950">
                  Scan Barcode
                </p>
                <p className="mt-1 text-xs text-secondary-500">
                  Scan or type the secure ticket code for this selected event.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input
                    value={scanCode}
                    onChange={(event) => {
                      scanTicketMutation.reset();
                      setScanCode(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleScanTicket();
                      }
                    }}
                    placeholder="Scan barcode or enter ticket ID"
                    className="h-11 rounded-xl border-secondary-200"
                  />
                  <Button
                    type="button"
                    onClick={handleScanTicket}
                    disabled={!scanCode.trim() || scanTicketMutation.isPending}
                    className="h-11 rounded-xl"
                  >
                    {scanTicketMutation.isPending ? "Checking" : "Validate"}
                  </Button>
                </div>
                {scanResult && (
                  <div
                    className={`mt-3 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                      scanResult.status === "approved"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : scanResult.status === "used"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {scanResult.status === "approved" ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                    ) : (
                      <XCircle className="mt-0.5 size-5 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{scanResult.title}</p>
                      <p className="mt-1 text-sm">{scanResult.description}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedScannerTickets.map((ticket) => (
                <VendorTicketPreview key={ticket.id} ticket={ticket} />
              ))}
              {selectedScannerTickets.length === 0 && (
                <div className="rounded-xl border border-dashed border-secondary-200 px-4 py-8 text-center text-sm text-secondary-500">
                  No bought tickets yet for this event card.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-fit flex-wrap items-center gap-2 rounded-[1.1rem] bg-secondary-50 p-2">
          {statusFilters.map((filter) => {
            const isActive = filter === activeStatus;
            return (
              <Button
                key={filter}
                type="button"
                onClick={() => setActiveStatus(filter)}
                className={
                  isActive
                    ? "h-10 rounded-[0.9rem] bg-[#0b6f97] px-6 text-base font-semibold text-white hover:bg-[#095d80]"
                    : "h-10 rounded-[0.9rem] bg-transparent px-5 text-base font-semibold text-secondary-950 shadow-none hover:bg-white"
                }
              >
                {filter}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 w-full sm:max-w-[22rem]">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="By name, event etc"
              className="h-11 rounded-[1rem] border-secondary-100 bg-secondary-50 pl-4 pr-11"
            />
            <SearchIcon className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-secondary-400" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-[0.9rem] border-secondary-200 px-4 text-sm font-medium text-secondary-700 hover:bg-secondary-50"
          >
            This Month
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-[0.9rem] border-secondary-200 px-4 text-sm font-medium text-secondary-700 hover:bg-secondary-50"
          >
            Download
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-secondary-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="border-b border-secondary-100 bg-white text-left text-secondary-500">
              <tr>
                {[
                  "Ticket ID",
                  "Date",
                  "Buyer",
                  "Attendee",
                  "Event",
                  "Ticket Category",
                  "Price",
                  "Qty",
                  "Amount",
                  "Status",
                  "Entry",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 text-sm font-medium whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-secondary-100 text-secondary-600 transition-colors hover:bg-secondary-50/70"
                >
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link
                      href={`/app/tickets/${row.id}`}
                      className="block font-medium text-secondary-700"
                    >
                      {row.id}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.date}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.purchaserName}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      <span className="font-medium text-secondary-700">
                        {row.currentHolderName}
                      </span>
                      <span className="block text-xs text-secondary-400">
                        {row.currentHolderEmail}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-5 min-w-[16rem] text-secondary-500">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.event}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.category}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.price}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.quantity}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.amount}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      <span
                        className={
                          row.status === "Transferred"
                            ? "font-medium text-sky-600"
                            : "font-medium text-slate-500"
                        }
                      >
                        {row.status}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      <span
                        className={
                          row.entryStatus === "Checked In"
                            ? "font-medium text-emerald-600"
                            : "font-medium text-slate-500"
                        }
                      >
                        {row.entryStatus}
                      </span>
                      {row.scannerEmail && (
                        <span className="block text-xs text-secondary-400">
                          by {row.scannerEmail}
                        </span>
                      )}
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-14 text-center text-sm text-secondary-500"
                  >
                    No ticket records match this filter yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 px-4 py-5 text-secondary-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span>Showing</span>
            <span className="rounded-full bg-[#0b6f97] px-4 py-1.5 text-sm font-semibold text-white">
              {filteredRows.length}
            </span>
            <span>Of {rows.length || 0}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-secondary-400">{"<"}</span>
            <span className="text-secondary-950">1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span className="text-secondary-400">{"..."}</span>
            <span className="text-secondary-400">{">"}</span>
          </div>
        </div>
      </div>

      {scannerReportRows.length > 0 && (
        <div className="rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold text-secondary-950">
            Recent Scanner Report
          </p>
          <div className="mt-3 grid gap-2">
            {scannerReportRows.map((row) => (
              <div
                key={`scan-${row.id}`}
                className="flex flex-col gap-1 rounded-xl bg-secondary-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-secondary-950">
                  {row.id} - {row.currentHolderName}
                </span>
                <span className="text-secondary-500">
                  {row.checkedInAt} by {row.scannerEmail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default memo(TicketList);
