import { EOrderStatus, IOrderDetailsType } from "@/lib/types";
import { formatCurrency } from "@/lib/functions";

/** How each order status reads on a badge, and its colour. */
export const ORDER_STATUS_META: Record<
  EOrderStatus,
  { label: string; className: string }
> = {
  [EOrderStatus.COMPLETED]: {
    label: "Completed",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  [EOrderStatus.PENDING]: {
    label: "Awaiting payment",
    className:
      "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400",
  },
  [EOrderStatus.FAILED]: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  [EOrderStatus.REFUNDED]: {
    label: "Refunded",
    className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  },
  [EOrderStatus.NEEDS_REVIEW]: {
    label: "Being checked",
    className:
      "bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300",
  },
};

export const orderStatusMeta = (status?: EOrderStatus | null) =>
  (status && ORDER_STATUS_META[status]) ||
  ORDER_STATUS_META[EOrderStatus.PENDING];

/** Each ticket type in an order with how many; older orders have just `ticket`. */
const orderLines = (order: IOrderDetailsType) =>
  order.items?.length
    ? order.items
    : order.ticket
      ? [{ ticket: order.ticket, quantity: order.quantity }]
      : [];

/** "2 × Regular, 1 × VIP", or just the ticket name for one type. */
export const orderTicketsLabel = (order: IOrderDetailsType) => {
  const lines = orderLines(order);
  if (lines.length <= 1) return lines[0]?.ticket?.name ?? "Ticket";
  return lines.map((line) => `${line.quantity} × ${line.ticket.name}`).join(", ");
};

/** What the whole order cost, at the ticket prices. "Free" when nothing. */
export const orderTotalLabel = (order: IOrderDetailsType) => {
  const lines = orderLines(order);
  const total = lines.reduce(
    (sum, line) => sum + (line.ticket?.price?.amount ?? 0) * line.quantity,
    0,
  );
  if (total <= 0) return "Free";
  const currency = lines[0].ticket.price.currency;
  return formatCurrency(total, currency?.code, currency?.locale);
};
