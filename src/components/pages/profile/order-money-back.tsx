import { IOrderDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import React from "react";

const REFUND_STATUS: Record<string, string> = {
  processing: "On its way",
  completed: "Refunded",
  failed: "Delayed, we're on it",
};

/**
 * Credit used on an order and any refunds: how many tickets, how much went back
 * to the card and how much as Turnupz Credit, and whether it's arrived.
 */
const OrderMoneyBack: React.FC<{
  order: Pick<IOrderDetailsType, "paidWithCredit" | "refunds">;
  className?: string;
}> = ({ order, className }) => {
  const refunds = order.refunds ?? [];
  if (!order.paidWithCredit && !refunds.length) return null;
  return (
    <div className={cn("space-y-1 text-xs text-muted-foreground", className)}>
      {!!order.paidWithCredit?.amount && (
        <p>
          {order.paidWithCredit.formatted.withCurrency} paid with Turnupz Credit
        </p>
      )}
      {refunds.map((refund, index) => {
        const parts = [
          refund.toCard.amount > 0 &&
            `${refund.toCard.formatted.withCurrency} to your card`,
          refund.asCredit.amount > 0 &&
            `${refund.asCredit.formatted.withCurrency} as credit`,
        ].filter(Boolean);
        return (
          <p key={index} className="text-foreground">
            {refund.tickets} ticket{refund.tickets !== 1 && "s"} refunded
            {parts.length ? `: ${parts.join(" and ")}` : ""} ·{" "}
            <span
              className={cn(
                refund.status === "completed"
                  ? "text-emerald-700"
                  : refund.status === "failed"
                    ? "text-red-700"
                    : "text-muted-foreground",
              )}
            >
              {REFUND_STATUS[refund.status] ?? refund.status}
            </span>
          </p>
        );
      })}
    </div>
  );
};

export default OrderMoneyBack;
