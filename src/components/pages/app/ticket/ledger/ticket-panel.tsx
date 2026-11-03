"use client";

import { constructErrorMessage } from "@/api/functions";
import { Amount } from "@/components/pages/app/wallet/amount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { readmitEventTicket } from "@/hooks/use-ticket-scan";
import {
  ILedgerRecord,
  useReviewRegistration,
  useVendorLedgerTicket,
} from "@/hooks/use-vendor-tickets";
import { formatEventTime } from "@/lib/event-time";
import { rememberServerTime, useLiveCode } from "@/lib/live-code";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Copy, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";

const time = (value: string) => format(new Date(value), "d MMM yyyy, h:mm a");

const STATUS: Record<ILedgerRecord["status"], { label: string; className: string }> = {
  checked_in: { label: "Checked in", className: "bg-emerald-50 text-emerald-700" },
  not_checked_in: { label: "Not checked in", className: "bg-secondary-50 text-secondary-700" },
  pending: { label: "Awaiting approval", className: "bg-amber-50 text-amber-800" },
  refunded: { label: "Refunded", className: "bg-red-50 text-red-700" },
  declined: { label: "Declined", className: "bg-muted text-muted-foreground" },
};

/**
 * The ticket's QR as its holder sees it: once they've opened the ticket it
 * changes every 30 seconds, so a screenshot stops working. Before then, its
 * plain code, which still scans.
 */
const LiveQr = ({
  code,
  liveCode,
  dimmed,
}: {
  code: string;
  liveCode: { secret: string; windowSeconds: number; serverTime: string } | null;
  dimmed: boolean;
}) => {
  useEffect(() => {
    if (liveCode?.serverTime) rememberServerTime(liveCode.serverTime);
  }, [liveCode?.serverTime]);
  const { value, secondsLeft, live, windowSeconds } = useLiveCode(liveCode, code, code, !dimmed);
  const size = 168;
  const ring = size + 60;
  const radius = ring / 2 - 4;
  const around = 2 * Math.PI * radius;
  return (
    <div className="rounded-[1.5rem] bg-gradient-to-br from-secondary-800 via-secondary-600 to-primary-500 p-5 text-white">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn("size-2 rounded-full", live ? "animate-pulse bg-emerald-300" : "bg-white/50")}
          />
          {live ? "Live code" : "Ticket code"}
        </span>
        {live && <span>New code in {secondsLeft}s</span>}
      </div>
      <div className="relative mx-auto mt-4 grid place-items-center" style={{ width: ring, height: ring }}>
        {live && (
          <svg className="absolute inset-0" viewBox={`0 0 ${ring} ${ring}`} aria-hidden>
            <circle cx={ring / 2} cy={ring / 2} r={radius} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="3" />
            <circle
              cx={ring / 2}
              cy={ring / 2}
              r={radius}
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={around}
              strokeDashoffset={around * (1 - secondsLeft / windowSeconds)}
              transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
        )}
        <div className={cn("rounded-2xl bg-white p-3", dimmed && "opacity-30")}>
          <QRCodeSVG value={value} size={size} level="M" />
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(code);
          toast.success("Ticket code copied");
        }}
        className="mx-auto mt-3 flex items-center gap-1.5 font-mono text-sm tracking-widest hover:underline"
      >
        {code}
        <Copy className="size-3.5" aria-hidden />
      </button>
      <p className="mt-1 text-center text-xs text-white/75">
        {live
          ? "Changes every 30 seconds, so screenshots stop working."
          : "Turns into a live code once the holder opens their ticket."}
      </p>
    </div>
  );
};

/** Approve or decline a booking for an event that needs approval. */
const ReviewActions = ({ record, onDone }: { record: ILedgerRecord; onDone: () => void }) => {
  const review = useReviewRegistration();
  const [choice, setChoice] = useState<"confirmed" | "rejected" | null>(null);
  const decide = async (status: "confirmed" | "rejected") => {
    setChoice(status);
    try {
      await review.mutateAsync({ eventId: record.eventId, ticketId: record.id, status });
      toast.success(
        status === "confirmed" ? `${record.holderName} is in` : `Declined ${record.holderName}'s booking`,
      );
      onDone();
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't review this booking."));
    } finally {
      setChoice(null);
    }
  };
  return (
    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="text-sm text-secondary-800">
        This event needs your approval. Their ticket works once you let them in.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full bg-white"
          disabled={review.isPending}
          onClick={() => decide("rejected")}
        >
          {choice === "rejected" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Decline
        </Button>
        <Button
          type="button"
          className="rounded-full"
          disabled={review.isPending}
          onClick={() => decide("confirmed")}
        >
          {choice === "confirmed" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Approve
        </Button>
      </div>
    </div>
  );
};

/** Lets someone in again whose ticket is already used; the reason is kept. */
const LetInAgain = ({ record, onDone }: { record: ILedgerRecord; onDone: () => void }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (reason.trim().length < 3) {
      toast.error("Say briefly why, e.g. their phone died.");
      return;
    }
    setSaving(true);
    try {
      await readmitEventTicket(record.eventId, record.ticketCode, reason.trim());
      toast.success(`${record.holderName} can go in again`);
      setOpen(false);
      setReason("");
      onDone();
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't let them in again."));
    } finally {
      setSaving(false);
    }
  };
  if (!open) {
    return (
      <Button variant="outline" className="rounded-full" onClick={() => setOpen(true)}>
        Let in again
      </Button>
    );
  }
  return (
    <div className="col-span-2 space-y-2 rounded-2xl border border-secondary-100 p-3">
      <Input
        autoFocus
        value={reason}
        maxLength={200}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Why? e.g. went to the car, phone died"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" className="rounded-full" loading={saving} onClick={() => void submit()}>
          Let in again
        </Button>
      </div>
    </div>
  );
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-sm font-medium text-secondary-950">{children}</dd>
  </div>
);

/** One ticket in full: its live code, details and history. */
const TicketPanel = ({
  record,
  onClose,
  canReview,
}: {
  record: ILedgerRecord | null;
  onClose: () => void;
  canReview: boolean;
}) => {
  const detail = useVendorLedgerTicket(record?.id);
  const queryClient = useQueryClient();
  const ticket = detail.data ?? null;
  const refresh = () => {
    void detail.refetch();
    void queryClient.invalidateQueries({ queryKey: ["vendor-ledger"] });
    void queryClient.invalidateQueries({ queryKey: ["vendor-ledger-orders"] });
  };
  const status = STATUS[record?.status ?? "not_checked_in"];

  return (
    <Sheet open={!!record} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {record && (
          <>
            <SheetHeader className="border-b border-secondary-100">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Ticket</p>
              <SheetTitle className="text-xl">{record.holderName}</SheetTitle>
              <SheetDescription>
                {record.ticketType} · {record.eventName} · {formatEventTime(record.eventDate)}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pt-2 pb-8">
              {detail.isPending ? (
                <Skeleton className="h-[330px] rounded-[1.5rem]" />
              ) : ticket && !ticket.canSeeLiveCode ? (
                <div className="rounded-2xl bg-secondary-50 p-4 text-sm text-secondary-800">
                  <p className="font-mono font-semibold tracking-widest">{record.ticketCode}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The QR code shows for the account owner and team members who can check tickets in.
                  </p>
                </div>
              ) : (
                <LiveQr
                  code={record.ticketCode}
                  liveCode={ticket?.liveCode ?? null}
                  dimmed={record.status === "refunded" || record.status === "declined"}
                />
              )}

              {canReview && record.status === "pending" && <ReviewActions record={record} onDone={onClose} />}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Row label="Status">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", status.className)}>
                    {status.label}
                  </span>
                </Row>
                <Row label="Paid">
                  {record.price.amount ? <Amount value={record.price.formatted.withCurrency} /> : "Free"}
                </Row>
                {record.orderReference && (
                  <Row label="Order">
                    <span className="font-mono text-xs">#{record.orderReference}</span>
                  </Row>
                )}
                <Row label="Bought">{time(record.boughtAt)}</Row>
                {record.buyerName && <Row label="Bought by">{record.buyerName}</Row>}
                {record.days && (
                  <Row label="Days">
                    In on {record.days.checkedIn} of {record.days.covered}
                  </Row>
                )}
                {record.venue && (
                  <div className="col-span-2">
                    <Row label="Venue">
                      {record.venue.name ?? record.venue.address}
                      {record.venue.name && record.venue.address && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {record.venue.address}
                        </span>
                      )}
                    </Row>
                  </div>
                )}
              </dl>

              {!!ticket?.history.length && (
                <section>
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">History</h3>
                  <ol className="mt-3 space-y-3 border-l-2 border-secondary-100 pl-4">
                    {[...ticket.history].reverse().map((entry, index) => (
                      <li key={`${entry.kind}-${index}`}>
                        <p className="text-sm font-semibold text-secondary-950">{entry.text}</p>
                        <p className="text-xs text-muted-foreground">{time(entry.at)}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <div className="grid grid-cols-2 gap-2">
                {ticket?.canSeeLiveCode && record.status === "checked_in" && (
                  <LetInAgain record={record} onDone={refresh} />
                )}
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    void navigator.clipboard?.writeText(record.ticketCode);
                    toast.success("Ticket code copied");
                  }}
                >
                  Copy code
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default memo(TicketPanel);
