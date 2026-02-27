"use client";

import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { EOrderStatus, IOrderDetailsType } from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, ShoppingBag, TicketIcon } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

const statusStyles: Record<EOrderStatus, string> = {
  [EOrderStatus.COMPLETED]:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  [EOrderStatus.PENDING]:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  [EOrderStatus.FAILED]:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const OrdersPage = () => {
  const { data, error, refetch, isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const { data } = await getData<IOrderDetailsType[]>("/orders");
      return data;
    },
  });

  const orders = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">My Orders</h2>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Failed to load orders",
          )}
          retryFunction={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">My Orders</h2>

      {orders.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="size-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm mt-1">
            Your ticket purchases will appear here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`${ROUTES.PROFILE_ORDERS.href}/${order.id}`}
            className="block border rounded-xl p-4 hover:border-cyan-400 transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                  <TicketIcon className="size-5 text-cyan-700 dark:text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                    {order.ticket?.event?.data?.name ?? "Event"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {order.createdAt &&
                        format(new Date(order.createdAt), "MMM dd, yyyy")}
                    </span>
                    <span>
                      {order.quantity} ticket{order.quantity !== 1 && "s"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className={cn(
                    "text-xs font-medium px-2.5 py-0.5 rounded-full capitalize",
                    statusStyles[order.status] ?? statusStyles.PENDING,
                  )}
                >
                  {order.status?.toLowerCase()}
                </span>
                <p className="font-semibold text-sm">
                  {order.totalAmount?.formatted?.withCurrency ??
                    order.ticket?.price?.formatted?.withCurrency ??
                    "Free"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default memo(OrdersPage);
