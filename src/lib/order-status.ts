import { EOrderStatus } from "@/lib/types";

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
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
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
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

export const orderStatusMeta = (status?: EOrderStatus | null) =>
  (status && ORDER_STATUS_META[status]) ||
  ORDER_STATUS_META[EOrderStatus.PENDING];
