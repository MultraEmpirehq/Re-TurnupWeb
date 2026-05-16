"use client";

import { IEventDetailsType, IEventTicketOptionDetails } from "@/lib/types";

export type VendorTicketTransferStatus = "Transferred" | "Not Transferred";

export interface VendorTicketLedgerRecord {
  id: string;
  eventId: string;
  date: string;
  purchaserName: string;
  purchaserEmail: string;
  currentHolderName: string;
  currentHolderEmail: string;
  event: string;
  category: string;
  price: string;
  priceAmount: number;
  quantity: number;
  amount: string;
  amountNumber: number;
  status: VendorTicketTransferStatus;
  entryStatus: "Checked In" | "Not Checked In";
  venue: string;
  issueDate: string;
  transferDate?: string;
  transferredToName?: string;
  transferredToEmail?: string;
  checkedInAt?: string;
  scannerEmail?: string;
  ticketCode?: string;
  qrCodeValue?: string;
  barcodeValue?: string;
}

export interface VendorTicketCategoryAnalytics {
  eventId: string;
  event: string;
  category: string;
  price: string;
  purchased: number;
  attended: number;
  transferred: number;
  remaining: number;
  revenue: string;
}

export interface VendorTicketEventOption {
  id: string;
  name: string;
}

function getTicketPriceAmount(value: IEventTicketOptionDetails["ticketPrice"]) {
  return typeof value === "number" ? value : Number(value?.amount ?? 0);
}

function formatMoney(
  amount: number,
  price?: IEventTicketOptionDetails["ticketPrice"],
) {
  if (typeof price !== "number" && price?.formatted?.withCurrency) {
    return price.formatted.withCurrency;
  }

  if (typeof price !== "number" && price?.currency?.code) {
    return amount > 0
      ? new Intl.NumberFormat(price.currency.locale || "en-US", {
          style: "currency",
          currency: price.currency.code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)
      : "Free";
  }

  return amount > 0
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    : "Free";
}

export const buildVendorTicketCategoryAnalytics = (
  rows: VendorTicketLedgerRecord[],
  events: IEventDetailsType[],
): VendorTicketCategoryAnalytics[] => {
  const eventTickets = events.flatMap((event) =>
    (event.eventTickets ?? []).map((ticket) => ({
      eventId: event.id,
      event: event.name,
      category: ticket.ticketName,
      inventory: Number(ticket.ticketQuantity || 0),
      priceAmount: getTicketPriceAmount(ticket.ticketPrice),
      price: ticket.ticketPrice,
    })),
  );

  const keys = new Set([
    ...rows.map((row) => `${row.eventId}::${row.category}`),
    ...eventTickets.map((ticket) => `${ticket.eventId}::${ticket.category}`),
  ]);

  return Array.from(keys).map((key) => {
    const [eventId, category] = key.split("::");
    const categoryRows = rows.filter(
      (row) => row.eventId === eventId && row.category === category,
    );
    const eventTicket = eventTickets.find(
      (ticket) => ticket.eventId === eventId && ticket.category === category,
    );
    const purchased = categoryRows.reduce((sum, row) => sum + row.quantity, 0);
    const attended = categoryRows.filter(
      (row) => row.entryStatus === "Checked In",
    ).length;
    const transferred = categoryRows.filter(
      (row) => row.status === "Transferred",
    ).length;
    const inventory = eventTicket?.inventory ?? purchased;
    const revenue = categoryRows.reduce((sum, row) => sum + row.amountNumber, 0);

    return {
      eventId,
      event:
        categoryRows[0]?.event ||
        events.find((event) => event.id === eventId)?.name ||
        "Event",
      category,
      price: formatMoney(
        eventTicket?.priceAmount ?? categoryRows[0]?.priceAmount ?? 0,
        eventTicket?.price,
      ),
      purchased,
      attended,
      transferred,
      remaining: Math.max(inventory - purchased, 0),
      revenue:
        categoryRows[0]?.amount && revenue > 0
          ? categoryRows[0].amount
          : formatMoney(revenue, eventTicket?.price),
    };
  });
};
