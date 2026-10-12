"use client";

import ScrollTable from "@/components/ui/scroll-table";
import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import InputField from "@/components/ui/input-field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCancelTransfer,
  useRefreshTicketLists,
  useSentTransfers,
  useTransferRecipient,
  useUserTickets,
  recipientLabel,
} from "@/hooks/use-user-tickets";
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
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  SendHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PerformerAvatar from "@/components/discovery/performer-avatar";
import { parseRecipient, recipientBody } from "@/lib/transfer-recipient";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ITransferFormValues {
  recipient: string;
}

interface ITransferBody {
  userTicketId: string;
  recipientEmail?: string;
  recipientUsername?: string;
  claimUrl: string;
}

// One box takes either: an email for anyone, or a Turnupz @username.
const transferSchema = joi.object({
  recipient: joi
    .string()
    .trim()
    .required()
    .custom((value, helpers) =>
      parseRecipient(value) ? value : helpers.error("any.invalid"),
    )
    .messages({
      "string.empty": "Enter their email or Turnupz username",
      "any.required": "Enter their email or Turnupz username",
      "any.invalid": "That isn't an email or a username",
    }),
});

const defaultValues: ITransferFormValues = {
  recipient: "",
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
      transferable: ut.ticket.transferable,
      isTransferable: ut.ticket.isTransferable,
    },
  };
}

function isTicketTransferAllowed(ticket: IUserTicketType | null) {
  if (!ticket) return false;
  if (ticket.ticket.isTransferable !== undefined) {
    return ticket.ticket.isTransferable;
  }
  if (ticket.ticket.transferable !== undefined) {
    return ticket.ticket.transferable;
  }

  const eventTickets = ticket.ticket.event?.data?.eventTickets ?? [];
  const matchingCategory = eventTickets.find((eventTicket) => {
    const ticketName = ticket.ticket.name?.toLowerCase();
    const ticketType = ticket.ticket.type?.toLowerCase();
    const categoryName = eventTicket.ticketName?.toLowerCase();
    return categoryName === ticketName || categoryName === ticketType;
  });

  return !!matchingCategory?.transferable;
}

function formatDisplayDate(
  value?: Date | string | null,
  pattern = "dd/MM/yyyy, hh:mm a",
) {
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
  const {
    data,
    error,
    refetch,
    isLoading: isLoadingTickets,
  } = useUserTickets();
  // A ticket you've sent leaves your list until it's claimed or taken back, so
  // it's looked for among your sent transfers too.
  const { data: sent = [], isLoading: isLoadingSent } = useSentTransfers();
  const isLoading = isLoadingTickets || isLoadingSent;
  const refreshLists = useRefreshTicketLists();
  const cancelTransfer = useCancelTransfer();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ITransferFormValues>({
    resolver: joiResolver(transferSchema),
    defaultValues,
    mode: "onChange",
  });

  // A username is looked up as it's typed (after a pause), so the sender sees
  // whose account it is, and can't send to a username no one has.
  const typed = watch("recipient");
  const parsed = parseRecipient(typed ?? "");
  const typedUsername =
    parsed?.kind === "username" ? parsed.username : undefined;
  const [lookupName, setLookupName] = useState<string | undefined>();
  useEffect(() => {
    const timer = setTimeout(() => setLookupName(typedUsername), 400);
    return () => clearTimeout(timer);
  }, [typedUsername]);
  const lookup = useTransferRecipient(lookupName);
  const usernameBlocked =
    parsed?.kind === "username" &&
    (lookup.isLoading ||
      !!lookup.error ||
      !lookup.data ||
      lookup.data.isYou ||
      lookupName?.toLowerCase() !== parsed.username.toLowerCase());

  const pendingSent = useMemo(
    () =>
      sent.find(
        (item) =>
          item.userTicket?.id === userTicketId && item.status === "PENDING",
      ) ?? null,
    [sent, userTicketId],
  );
  const ticket = useMemo(() => {
    const tickets = data?.data ?? [];
    const held = tickets.find((item) => item.id === userTicketId);
    if (held?.ticket) return toUserTicketType(held);
    // An older api sends a sent ticket without its `ticket` (the event and
    // price), which would crash the page; it reads as not found instead.
    if (!pendingSent?.userTicket?.ticket) return null;
    return toUserTicketType({
      ...pendingSent.userTicket,
      transfer: {
        id: pendingSent.id,
        status: pendingSent.status,
        toEmail: pendingSent.toEmail,
        recipientUsername: pendingSent.recipientUsername ?? null,
        createdAt: new Date(pendingSent.createdAt),
        claimedAt: pendingSent.claimedAt
          ? new Date(pendingSent.claimedAt)
          : null,
        recipientName: pendingSent.recipientName ?? null,
      },
    });
  }, [data, pendingSent, userTicketId]);

  // Only a transfer still waiting to be claimed holds the ticket. One that was
  // claimed is how a received ticket got here, and its new owner can send it on.
  const transfer =
    ticket?.transfer?.status === "PENDING" ? ticket.transfer : undefined;
  const transferAllowed = isTicketTransferAllowed(ticket);
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
  const amountLabel = formatMoney(
    total,
    priceLocale,
    priceCurrency,
    fallbackSymbol,
  );
  const senderName = getDisplayName(
    userDetails?.firstName,
    userDetails?.lastName,
    userDetails?.name,
  );
  const recipientName = transfer
    ? recipientLabel(transfer)
    : "Not transferred yet";
  const recipientMeta = !transfer
    ? "This ticket is still assigned to you"
    : transfer.recipientName && transfer.recipientUsername
      ? `@${transfer.recipientUsername} on Turnupz`
      : "Awaiting claim by recipient";

  const statusLabel = transfer ? "Transferred" : "Not transferred";
  const statusTone = transfer
    ? "bg-sky-100 text-sky-700"
    : "bg-slate-100 text-slate-600";

  const onSubmit = useCallback(
    async (body: ITransferFormValues) => {
      try {
        if (!transferAllowed) {
          toast.error("This ticket category is not transferable");
          return;
        }

        const claimUrl = `${window.location.origin}/tickets/claim/{{transferId}}`;
        const recipient = parseRecipient(body.recipient);
        if (!recipient) return;
        await postData<ITransferBody, unknown>("/ticket/transfer", {
          userTicketId,
          ...recipientBody(recipient),
          claimUrl,
        });
        // Both lists change: it leaves My Tickets and appears under Sent.
        refreshLists();
        toast.success("Ticket sent. It's under Sent until they claim it.");
        router.push(`${ROUTES.PROFILE_TICKETS.href}?tab=sent`);
      } catch (submitError) {
        toast.error(
          constructErrorMessage(
            submitError as TApiErrorResponseType,
            "Something went wrong while transferring this ticket!",
          ),
        );
      }
    },
    [userTicketId, router, transferAllowed, refreshLists],
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
          <h2 className="text-xl font-semibold text-slate-900">
            Ticket not found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            We couldn&apos;t find the ticket you selected. Head back to your
            tickets and try again.
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

        {/* grid-cols-1 and min-w-0: without them the column grows to the
            table's width and cuts it off instead of letting it scroll. */}
        <div className="grid grid-cols-1 gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
          <div className="min-w-0 space-y-8">
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
                      Transfer this ticket when you&apos;re ready and the
                      recipient will receive a claim link.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Ticket Details
                </h2>
              </div>
              <ScrollTable label="Ticket breakdown">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-sky-400/70 text-xs uppercase tracking-[0.24em] text-slate-400">
                      <th className="px-5 py-4 font-semibold">
                        Ticket Category
                      </th>
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
                      <tr
                        key={label}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td
                          className="px-5 py-3 text-sm text-slate-500"
                          colSpan={3}
                        >
                          {label}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-slate-700">
                          {formatMoney(
                            Number(value),
                            priceLocale,
                            priceCurrency,
                            fallbackSymbol,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollTable>
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
                <span className="text-right font-medium text-white">
                  {ticket.ticket.name}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <span className="text-slate-400">Current Status</span>
                <span className="text-right font-medium text-white">
                  {statusLabel}
                </span>
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

            {!transfer && transferAllowed ? (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 space-y-4"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    Send this ticket
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Send it to their email, or to their Turnupz @username if
                    they&apos;re on Turnupz. We&apos;ll send them a link to
                    claim it.
                  </p>
                </div>
                <InputField
                  inputClassName="border-white/15 bg-white/8 text-white placeholder:text-slate-400"
                  label="Email or @username"
                  labelClassName="text-slate-300"
                  placeholder="friend@example.com or @username"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  {...register("recipient")}
                  error={errors.recipient?.message}
                />
                {parsed?.kind === "username" && (
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5 text-sm">
                    {lookup.isLoading || lookupName !== parsed.username ? (
                      <span className="text-slate-400">
                        Looking for @{parsed.username}...
                      </span>
                    ) : lookup.data ? (
                      <>
                        <PerformerAvatar
                          name={lookup.data.name || lookup.data.username}
                          image={lookup.data.avatar}
                          className="size-8 text-xs"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-white">
                            {lookup.data.name || `@${lookup.data.username}`}
                          </span>
                          <span className="block text-xs text-slate-400">
                            {lookup.data.isYou
                              ? "That's you"
                              : `@${lookup.data.username} on Turnupz`}
                          </span>
                        </span>
                      </>
                    ) : (
                      <span className="text-secondary-300">
                        No one on Turnupz has that username. Check it, or use
                        their email.
                      </span>
                    )}
                  </div>
                )}
                <Button
                  disabled={!isValid || !userTicketId || usernameBlocked}
                  loading={isSubmitting}
                  type="submit"
                  className="h-11 w-full rounded-full bg-sky-400 text-slate-950 hover:bg-sky-300"
                >
                  <SendHorizontal className="size-4" />
                  Transfer Ticket
                </Button>
              </form>
            ) : !transferAllowed ? (
              <div className="mt-8 rounded-[24px] border border-secondary-400/20 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">
                  Transfer disabled
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  The event organizer has not enabled transfers for this ticket
                  category.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 h-11 w-full rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  <Link href={ROUTES.PROFILE_TICKETS.href}>
                    Back to My Tickets
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-8 rounded-[24px] border border-sky-400/20 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">
                  {transfer?.status === "PENDING"
                    ? "Sent, waiting to be claimed"
                    : "Transfer complete"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {transfer?.status === "PENDING"
                    ? "It can't be used or sent again unless you take it back. Once they claim it, it's theirs."
                    : "This ticket now belongs to the person you sent it to."}
                </p>
                {transfer?.status === "PENDING" && (
                  <Button
                    type="button"
                    loading={cancelTransfer.isPending}
                    disabled={cancelTransfer.isPending}
                    onClick={async () => {
                      try {
                        await cancelTransfer.mutateAsync(transfer.id);
                        toast.success(
                          "Transfer cancelled. The ticket is back in My Tickets.",
                        );
                        router.push(ROUTES.PROFILE_TICKETS.href);
                      } catch (cancelError) {
                        toast.error(
                          constructErrorMessage(
                            cancelError as TApiErrorResponseType,
                            "Couldn't cancel the transfer.",
                          ),
                        );
                      }
                    }}
                    className="mt-4 h-11 w-full rounded-full bg-white text-slate-950 hover:bg-slate-100"
                  >
                    Take it back
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 h-11 w-full rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  <Link href={ROUTES.PROFILE_TICKETS.href}>
                    Back to My Tickets
                  </Link>
                </Button>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
