"use client";

import { constructErrorMessage } from "@/api/functions";
import { getData } from "@/api";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/functions";
import { IOrderDetailsType } from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2,
  Download,
  Loader2,
  CalendarDays,
  MapPin,
  TicketIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { memo, useCallback, useState } from "react";
import { toast } from "sonner";

const getOrder = async (orderId: string) => {
  const { data } = await getData<IOrderDetailsType>(`/order/${orderId}`);
  return data?.data;
};

const OrderSuccessPage = () => {
  const params = useParams();
  const orderId = params?.orderId?.toString() || "";
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: order,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });

  const handleDownloadTickets = useCallback(async () => {
    if (!order?.tickets?.length) {
      toast.error("No tickets available to download");
      return;
    }

    setIsDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const downloadResults = await Promise.allSettled(
        order.tickets.map(async (ticket, index) => {
          if (!ticket.link) return null;
          const response = await fetch(ticket.link);
          if (!response.ok) throw new Error(`Failed to fetch ${ticket.name}`);
          const blob = await response.blob();
          const extension = getFileExtension(
            ticket.link,
            response.headers.get("content-type"),
          );
          const fileName = `ticket-${index + 1}-${sanitizeFileName(ticket.name)}${extension}`;
          return { fileName, blob };
        }),
      );

      let addedCount = 0;
      downloadResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          zip.file(result.value.fileName, result.value.blob);
          addedCount++;
        }
      });

      if (addedCount === 0) {
        toast.error("Could not download any tickets. Please try again.");
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `tickets-order-${orderId}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      if (addedCount < order.tickets.length) {
        toast.warning(
          `Downloaded ${addedCount} of ${order.tickets.length} tickets. Some failed.`,
        );
      } else {
        toast.success("Tickets downloaded successfully!");
      }
    } catch {
      toast.error("Failed to download tickets. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [order, orderId]);

  if (!order && !error) {
    return (
      <SectionContainer className="py-20 max-w-2xl space-y-8">
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </SectionContainer>
    );
  }

  if (error) {
    return (
      <SectionContainer className="py-20 min-h-[500px] flex items-center justify-center">
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Unable to load order details",
          )}
          retryFunction={refetch}
        />
      </SectionContainer>
    );
  }

  const eventDate = order?.event?.date ? new Date(order.event.date) : null;
  const { locale, code } = order?.totalAmount?.currency ?? {
    locale: "en-NG",
    code: "NGN",
  };

  return (
    <SectionContainer className="py-20 max-w-2xl space-y-10">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="size-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
          <CheckCircle2 className="size-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">Payment Successful!</h1>
        <p className="text-muted-foreground">
          Your tickets have been confirmed. You can download them below.
        </p>
      </div>

      <div className="border rounded-xl divide-y">
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Order Summary</h2>

          <div className="space-y-3 text-sm">
            {order?.event?.name && (
              <div className="flex items-start gap-3">
                <TicketIcon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium">{order.event.name}</p>
                  {order.tickets?.[0]?.name && (
                    <p className="text-muted-foreground">
                      {order.tickets[0].name}
                      {order.tickets.length > 1 &&
                        ` + ${order.tickets.length - 1} more`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {eventDate && (
              <div className="flex items-center gap-3">
                <CalendarDays className="size-4 text-muted-foreground shrink-0" />
                <p>{format(eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
              </div>
            )}

            {order?.event?.venue?.name && (
              <div className="flex items-center gap-3">
                <MapPin className="size-4 text-muted-foreground shrink-0" />
                <p>
                  {order.event.venue.name}
                  {order.event.venue.address &&
                    ` — ${order.event.venue.address}`}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-medium">
              {order?.quantity ?? order?.tickets?.length ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono text-xs">{orderId}</span>
          </div>
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg">
              {order?.totalAmount?.formatted?.withCurrency ??
                formatCurrency(order?.totalAmount?.amount ?? 0, code, locale)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleDownloadTickets}
          disabled={isDownloading || !order?.tickets?.length}
          loading={isDownloading}
          className="w-full h-14 text-lg font-semibold rounded-2xl bg-linear-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0"
        >
          {isDownloading && <Loader2 className="size-5 animate-spin" />}
          {!isDownloading && <Download className="size-5" />}
          {isDownloading && "Preparing Download..."}
          {!isDownloading && "Download Tickets"}
        </Button>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="flex-1 h-12 rounded-xl">
            <Link href={ROUTES.PROFILE_ORDERS.href}>View Orders</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 h-12 rounded-xl">
            <Link href={ROUTES.EXPLORE.href}>Explore Events</Link>
          </Button>
        </div>
      </div>
    </SectionContainer>
  );
};

function getFileExtension(
  url: string,
  contentType: string | null,
): string {
  const mimeMap: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
  };
  if (contentType && mimeMap[contentType]) return mimeMap[contentType];
  const match = url.match(/\.(\w{2,5})(?:\?|$)/);
  if (match) return `.${match[1]}`;
  return ".pdf";
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default memo(OrderSuccessPage);
