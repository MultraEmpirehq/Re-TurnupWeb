"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import InputField from "@/components/ui/input-field";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserTickets } from "@/hooks/use-user-tickets";
import {
  ETicketStatus,
  IUserTicketType,
  UserTicketDetailsResponseType,
} from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { joiResolver } from "@hookform/resolvers/joi";
import { format } from "date-fns";
import joi from "joi";
import { ArrowLeft, CalendarDays, Mail, MapPin, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ITransferFormValues {
  recipientEmail: string;
}

interface ITransferBody {
  userTicketId: string;
  recipientEmail: string;
  claimUrl: string;
}

const transferSchema = joi.object({
  recipientEmail: joi.string().email({ tlds: false }).required().messages({
    "string.email": "Invalid email address",
    "string.empty": "Recipient email is required",
    "any.required": "Recipient email is required",
  }),
});

const defaultValues: ITransferFormValues = {
  recipientEmail: "",
};

function toUserTicketType(ut: UserTicketDetailsResponseType): IUserTicketType {
  return {
    id: ut.id,
    code: ut.code,
    createdAt: ut.createdAt,
    status: (ut.status as ETicketStatus) ?? ETicketStatus.UN_USED,
    transfer: ut.transfer,
    ticket: {
      id: ut.ticket.id,
      name: ut.ticket.name,
      type: ut.ticket.type,
      link: ut.ticket.link ?? null,
      event: { data: ut.ticket.event },
      price: ut.ticket.price,
      quantity: ut.ticket.quantity,
      sold: ut.ticket.sold,
      available: ut.ticket.available,
    },
  };
}

function formatDisplayDate(value?: Date | string | null, pattern = "dd/MM/yyyy, hh:mm a") {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return format(parsed, pattern);
}

function formatMoney(
  amount: number,
  locale = "en-NG",
  currencyCode = "NGN",
  fallbackSymbol = "N",
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${fallbackSymbol}${amount.toLocaleString()}`;
  }
}

function getDisplayName(
  firstName?: string,
  lastName?: string,
  fallbackName?: string,
) {
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  return combined || fallbackName || "Turnupz User";
}

export default function TransferTicketPage() {
  const params = useParams();
  const router = useRouter();
  const userTicketId = params?.id?.toString() ?? "";
  const userDetails = useUserStore((state) => state.userDetails);
  const { data, error, refetch, isLoading } = useUserTickets();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ITransferFormValues>({
    resolver: joiResolver(transferSchema),
    defaultValues,
    mode: "onChange",
  });

  const ticket = useMemo(() => {
    const tickets = data?.data ?? [];
    return tickets.map(toUserTicketType).find((item) => item.id === userTicketId) ?? null;
  }, [data, userTicketId]);

  const transfer = ticket?.transfer;
  const event = ticket?.ticket?.event?.data;
  const quantity = 1;
  const priceAmount = ticket?.ticket?.price?.amount ?? 0;
  const subTotal = priceAmount * quantity;
  const tax = 0;
  const fee = 0;
  const total = subTotal + tax + fee;
  const priceLocale = ticket?.ticket?.price?.currency?.locale || "en-NG";
  const priceCurrency = ticket?.ticket?.price?.currency?.code || "NGN";
  const fallbackSymbol = ticket?.ticket?.price?.currency?.symbol || "N";
  const priceLabel =
    ticket?.ticket?.price?.formatted?.withCurrency ||
    formatMoney(priceAmount, priceLocale, priceCurrency, fallbackSymbol);
  const amountLabel = formatMoney(total, priceLocale, priceCurrency, fallbackSymbol);
  const senderName = getDisplayName(
    userDetails?.firstName,
    userDetails?.lastName,
    userDetails?.name,
  );
  const recipientName =
    transfer?.recipientName || transfer?.toEmail || "Not transferred yet";
  const recipientMeta = transfer?.toEmail
    ? transfer.recipientName
      ? transfer.toEmail
      : "Awaiting claim by recipient"
    : "This ticket is still assigned to you";

  const statusLabel = transfer ? "Transferred" : "Not transferred";
  const statusTone = transfer
    ? "bg-sky-100 text-sky-700"
    : "bg-slate-100 text-slate-600";

  const onSubmit = useCallback(
    async (body: ITransferFormValues) => {
      try {
        const claimUrl = `${window.location.origin}/tickets/claim/{{transferId}}`;
        await postData<ITransferBody, unknown>("/ticket/transfer", {
          userTicketId,
          recipientEmail: body.recipientEmail,
          claimUrl,
        });
        toast.success("Ticket transferred successfully");
        router.push(ROUTES.PROFILE_TICKETS.href);
      } catch (submitError) {
        toast.error(
          constructErrorMessage(
            submitError as TApiErrorResponseType,
            "Something went wrong while transferring this ticket!",
          ),
        );
      }
    },
    [userTicketId, router],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-[420px] w-full rounded-[30px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href={ROUTES.PROFILE_TICKETS.href}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to My Tickets
        </Link>
        <div className="flex min-h-[320px] items-center justify-center">
          <ErrorContainer
            error={constructErrorMessage(
              error as TApiErrorResponseType,
              "Failed to load this ticket transfer page.",
            )}
            retryFunction={refetch}
          />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Link
          href={ROUTES.PROFILE_TICKETS.href}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to My Tickets
        </Link>
        <div className="rounded-[30px] border border-black/10 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Ticket not found</h2>
          <p className="mt-2 text-sm text-slate-500">
            We couldn&apos;t find the ticket you selected. Head back to your tickets and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={ROUTES.PROFILE_TICKETS.href}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to My Tickets
      </Link>

      <section className="overflow-hidden rounded-[34px] border border-sky-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <div className="border-b border-sky-100 bg-[linear-gradient(180deg,#f8fdff_0%,#ffffff_100%)] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-500">
                Ticket Transfer
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  #{ticket.code}
                </h1>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${statusTone}`}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-slate-500">
                {transfer
                  ? "This ticket has already been sent through the Turnupz transfer flow. Here is the current recipient and ticket breakdown."
                  : "This ticket is still with you. Review the details below and send it to a recipient whenever you are ready."}
              </p>
            </div>

            <div className="rounded-[24px] border border-sky-100 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Issued Date
              </p>
              <p className="mt-1 font-semibold text-slate-800">
                {formatDisplayDate(ticket.createdAt)}
              </p>
              {transfer?.createdAt && (
                <>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Transfer Date
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDisplayDate(transfer.createdAt)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Bill From
                </p>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  {senderName}
                </h2>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  {userDetails?.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="size-4 text-sky-500" />
                      {userDetails.email}
                    </p>
                  )}
                  {event?.venue?.name && (
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4 text-sky-500" />
                      {event.venue.name}
                    </p>
                  )}
                  {event?.date && (
                    <p className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-sky-500" />
                      {formatDisplayDate(event.date, "dd/MM/yyyy")}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  {transfer ? "Transferred To" : "Transfer Status"}
                </p>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  {recipientName}
                </h2>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <p>{recipientMeta}</p>
                  {transfer?.claimedAt && (
                    <p>
                      Claimed on{" "}
                      <span className="font-medium text-slate-700">
                        {formatDisplayDate(transfer.claimedAt)}
                      </span>
                    </p>
                  )}
                  {!transfer && (
                    <p>
                      Transfer this ticket when you&apos;re ready and the recipient will receive a claim link.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Ticket Details</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-sky-400/70 text-xs uppercase tracking-[0.24em] text-slate-400">
                      <th className="px-5 py-4 font-semibold">Ticket Category</th>
                      <th className="px-5 py-4 font-semibold">Price</th>
                      <th className="px-5 py-4 font-semibold">Qty</th>
                      <th className="px-5 py-4 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200 text-sm text-slate-700">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {ticket.ticket.type}
                      </td>
                      <td className="px-5 py-4">{priceLabel}</td>
                      <td className="px-5 py-4">{quantity}</td>
                      <td className="px-5 py-4">{amountLabel}</td>
                    </tr>
                    {[
                      ["Sub Total", subTotal],
                      ["Tax (0%)", tax],
                      ["Fee", fee],
                      ["Total", total],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-5 py-3 text-sm text-slate-500" colSpan={3}>
                          {label}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-slate-700">
                          {formatMoney(Number(value), priceLocale, priceCurrency, fallbackSymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="rounded-[30px] bg-[#0f172a] p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200/80">
              Ticket Summary
            </p>
            <h2 className="mt-4 text-2xl font-semibold leading-tight">
              {event?.name || "Purchased Ticket"}
            </h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <span className="text-slate-400">Ticket Name</span>
                <span className="text-right font-medium text-white">{ticket.ticket.name}</span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <span className="text-slate-400">Current Status</span>
                <span className="text-right font-medium text-white">{statusLabel}</span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <span className="text-slate-400">Ticket Status</span>
                <span className="text-right font-medium text-white">
                  {ticket.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">Event Venue</span>
                <span className="text-right font-medium text-white">
                  {event?.venue?.name || "Venue pending"}
                </span>
              </div>
            </div>

            {!transfer ? (
              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white">Send this ticket</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Enter the recipient&apos;s email and we&apos;ll generate a claim link for them.
                  </p>
                </div>
                <InputField
                  inputClassName="border-white/15 bg-white/8 text-white placeholder:text-slate-400"
                  label="Recipient Email"
                  labelClassName="text-slate-300"
                  placeholder="recipient@example.com"
                  type="email"
                  {...register("recipientEmail")}
                  error={errors.recipientEmail?.message}
                />
                <Button
                  disabled={!isValid || !userTicketId}
                  loading={isSubmitting}
                  type="submit"
                  className="h-11 w-full rounded-full bg-sky-400 text-slate-950 hover:bg-sky-300"
                >
                  <SendHorizontal className="size-4" />
                  Transfer Ticket
                </Button>
              </form>
            ) : (
              <div className="mt-8 rounded-[24px] border border-sky-400/20 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Transfer complete</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  This ticket has already been sent to the selected recipient. You can return to your tickets list to review another purchase.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 h-11 w-full rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  <Link href={ROUTES.PROFILE_TICKETS.href}>Back to My Tickets</Link>
                </Button>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
