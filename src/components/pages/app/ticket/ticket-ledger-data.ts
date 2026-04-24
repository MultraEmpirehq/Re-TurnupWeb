"use client";

import { IEventDetailsType } from "@/lib/types";

export type VendorTicketTransferStatus = "Transferred" | "Not Transferred";

export interface VendorTicketLedgerRecord {
  id: string;
  date: string;
  purchaserName: string;
  purchaserEmail: string;
  event: string;
  category: string;
  price: string;
  quantity: number;
  amount: string;
  status: VendorTicketTransferStatus;
  venue: string;
  issueDate: string;
  transferDate?: string;
  transferredToName?: string;
  transferredToEmail?: string;
}

function formatDate(value: Date | string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", options).format(new Date(value));
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const attendeeFirstNames = [
  "John",
  "Amara",
  "David",
  "Ife",
  "Sarah",
  "Tobi",
  "Mia",
  "Daniel",
];

const attendeeLastNames = [
  "Doe",
  "Okafor",
  "Mensah",
  "Adebayo",
  "Williams",
  "Johnson",
  "Brown",
  "Akinola",
];

function buildPerson(index: number) {
  const firstName = attendeeFirstNames[index % attendeeFirstNames.length];
  const lastName = attendeeLastNames[index % attendeeLastNames.length];
  const fullName = `${firstName} ${lastName}`;
  return {
    name: fullName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@turnupz.dev`,
  };
}

export const buildVendorTicketLedger = (
  events: IEventDetailsType[],
): VendorTicketLedgerRecord[] => {
  return events.flatMap((event, eventIndex) => {
    const rowCount = Math.max(1, Math.min(event.totalTickets || 1, 4));
    const eventDate = formatDate(event.date, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
    const issueDate = formatDate(event.date, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const venue = event.venue?.name || "Selected Venue";
    const category = "General Admission";
    const amountNumber = Math.max(25000, (eventIndex + 1) * 25000);
    const amount = formatMoney(amountNumber);

    return Array.from({ length: rowCount }).map((_, rowIndex) => {
      const purchaser = buildPerson(eventIndex * 4 + rowIndex);
      const recipient = buildPerson(eventIndex * 4 + rowIndex + 12);
      const transferred = rowIndex % 2 === 1;

      return {
        id: `TKT${String(eventIndex + 1).padStart(3, "0")}${String(
          rowIndex + 1,
        ).padStart(3, "0")}`,
        date: eventDate,
        purchaserName: purchaser.name,
        purchaserEmail: purchaser.email,
        event: event.name,
        category,
        price: amount,
        quantity: 1,
        amount,
        status: transferred ? "Transferred" : "Not Transferred",
        venue,
        issueDate,
        transferDate: transferred
          ? formatDate(event.date, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
        transferredToName: transferred ? recipient.name : undefined,
        transferredToEmail: transferred ? recipient.email : undefined,
      };
    });
  });
};

export const buildDemoVendorTicketLedger = (): VendorTicketLedgerRecord[] => {
  const demoEvents = [
    {
      event: "TURNUPZ Live Experience",
      venue: "Blue Hall Arena",
      issueDate: "15/03/2025, 01:45 PM",
      date: "15/03/25",
      amount: formatMoney(25000),
    },
    {
      event: "Turnupz City Nights",
      venue: "Skyline Event Dome",
      issueDate: "18/03/2025, 06:10 PM",
      date: "18/03/25",
      amount: formatMoney(18000),
    },
    {
      event: "Afrobeats Rooftop Session",
      venue: "The Terrace Lagos",
      issueDate: "21/03/2025, 11:30 AM",
      date: "21/03/25",
      amount: formatMoney(32000),
    },
  ];

  return demoEvents.flatMap((demoEvent, eventIndex) => {
    return Array.from({ length: 3 }).map((_, rowIndex) => {
      const purchaser = buildPerson(eventIndex * 3 + rowIndex);
      const recipient = buildPerson(eventIndex * 3 + rowIndex + 10);
      const transferred = rowIndex === 1;

      return {
        id: `TKT${String(eventIndex + 1).padStart(3, "0")}${String(
          rowIndex + 1,
        ).padStart(3, "0")}`,
        date: demoEvent.date,
        purchaserName: purchaser.name,
        purchaserEmail: purchaser.email,
        event: demoEvent.event,
        category: rowIndex === 2 ? "VVIP" : "VIP",
        price: demoEvent.amount,
        quantity: 1,
        amount: demoEvent.amount,
        status: transferred ? "Transferred" : "Not Transferred",
        venue: demoEvent.venue,
        issueDate: demoEvent.issueDate,
        transferDate: transferred ? demoEvent.issueDate : undefined,
        transferredToName: transferred ? recipient.name : undefined,
        transferredToEmail: transferred ? recipient.email : undefined,
      };
    });
  });
};
