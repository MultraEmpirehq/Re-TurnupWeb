"use client";

import { Amount } from "@/components/pages/app/wallet/amount";
import { ILedgerOrder } from "@/hooks/use-vendor-tickets";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { ChevronRight } from "lucide-react";
import React, { memo } from "react";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export const orderWhen = (value: string) => {
  const date = new Date(value);
  if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMM yyyy");
};

/** "50 × Regular, 10 × VIP", or the first two and how many more types. */
export const describeTypes = (types: ILedgerOrder["ticketTypes"]) => {
  const shown = types.slice(0, 2).map((type) => `${type.quantity} × ${type.name}`);
  return types.length > 2 ? `${shown.join(", ")} +${types.length - 2} more` : shown.join(", ");
};

const Tag = ({ children, tone }: { children: React.ReactNode; tone: "blue" | "violet" | "amber" | "red" | "green" }) => (
  <span
    className={cn(
      "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
      tone === "blue" && "bg-secondary-50 text-secondary-700",
      tone === "violet" && "bg-violet-50 text-violet-700",
      tone === "amber" && "bg-amber-50 text-amber-800",
      tone === "red" && "bg-red-50 text-red-700",
      tone === "green" && "text-emerald-700",
    )}
  >
    {children}
  </span>
);

/** What needs a glance on an order: bulk, sent on, waiting, refunded, all in. */
export const OrderTags = ({ order }: { order: ILedgerOrder }) => {
  const live = order.tickets - order.refunded;
  return (
    <span className="flex flex-wrap gap-1">
      {order.tickets >= 10 && <Tag tone="blue">Bulk</Tag>}
      {order.sentOn > 0 && (
        <Tag tone="violet">
          {order.sentOn} sent to {order.sentOn === 1 ? "someone" : "others"}
        </Tag>
      )}
      {order.pending > 0 && <Tag tone="amber">Awaiting approval</Tag>}
      {order.refunded > 0 && (
        <Tag tone="red">{order.refunded === order.tickets ? "Refunded" : `${order.refunded} refunded`}</Tag>
      )}
      {live > 0 && order.checkedIn === live && <Tag tone="green">All in</Tag>}
    </span>
  );
};

const Progress = ({ order }: { order: ILedgerOrder }) => {
  const live = order.tickets - order.refunded;
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary-50">
        <span
          className="block h-full rounded-full bg-emerald-500"
          style={{ width: `${live ? (order.checkedIn / live) * 100 : 0}%` }}
        />
      </span>
      <span className="text-xs font-semibold whitespace-nowrap text-secondary-700">
        {order.checkedIn}/{live} in
      </span>
    </span>
  );
};

/**
 * The ledger by order: one row per purchase, the same height whether it holds
 * one ticket or five hundred. Opening one lists its tickets in a panel.
 */
const OrdersTable = ({
  orders,
  fetching,
  onOpen,
}: {
  orders: ILedgerOrder[];
  fetching: boolean;
  onOpen: (order: ILedgerOrder) => void;
}) => (
  <>
    {/* Phones: one card per order. */}
    <ul className={cn("divide-y divide-secondary-50 sm:hidden", fetching && "opacity-60")}>
      {orders.map((order) => (
        <li key={order.id}>
          <button
            type="button"
            onClick={() => onOpen(order)}
            className="flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-secondary-50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-xs font-bold text-secondary-700">
              {initials(order.buyer.name)}
            </span>
            <span className="min-w-0 flex-1 space-y-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate font-semibold text-secondary-950">{order.buyer.name}</span>
                <span className="shrink-0 text-sm font-semibold text-secondary-950">
                  {order.paid.amount ? <Amount value={order.paid.formatted.withCurrency} /> : "Free"}
                </span>
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {describeTypes(order.ticketTypes)} · {order.event?.name}
              </span>
              <span className="flex items-center justify-between gap-2">
                <Progress order={order} />
                <OrderTags order={order} />
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
    <div className={cn("hidden overflow-x-auto transition-opacity sm:block", fetching && "opacity-60")}>
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-secondary-100 bg-secondary-50/60 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <th className="px-5 py-3 font-semibold">Buyer</th>
            <th className="px-3 py-3 font-semibold">Tickets</th>
            <th className="px-3 py-3 font-semibold">Check-in</th>
            <th className="px-3 py-3 text-right font-semibold">Paid</th>
            <th className="px-3 py-3 font-semibold">Order</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              tabIndex={0}
              onClick={() => onOpen(order)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(order);
                }
              }}
              aria-label={`Open ${order.buyer.name}'s order`}
              className="cursor-pointer border-b border-secondary-50 transition-colors last:border-0 hover:bg-secondary-50/60 focus-visible:bg-secondary-50 focus-visible:outline-none"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-xs font-bold text-secondary-700">
                    {initials(order.buyer.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-[220px] truncate font-semibold text-secondary-950">
                      {order.buyer.name}
                    </span>
                    <span className="block max-w-[220px] truncate text-xs text-muted-foreground">
                      {order.buyer.username ? `@${order.buyer.username}` : order.buyer.email}
                    </span>
                  </span>
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="block max-w-[260px] truncate font-medium text-secondary-950">
                  {describeTypes(order.ticketTypes)}
                </span>
                <span className="block max-w-[260px] truncate text-xs text-muted-foreground">
                  {order.event?.name}
                </span>
              </td>
              <td className="px-3 py-3">
                <Progress order={order} />
                <span className="mt-1 block">
                  <OrderTags order={order} />
                </span>
              </td>
              <td className="px-3 py-3 text-right font-semibold whitespace-nowrap text-secondary-950">
                {order.paid.amount ? <Amount value={order.paid.formatted.withCurrency} /> : "Free"}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                <span className="block font-mono text-xs text-secondary-700">
                  {order.reference ? `#${order.reference}` : "—"}
                </span>
                <span className="block text-xs text-muted-foreground">{orderWhen(order.boughtAt)}</span>
              </td>
              <td className="pr-4 text-muted-foreground">
                <ChevronRight className="size-4" aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

export default memo(OrdersTable);
