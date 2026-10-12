"use client";

import { constructErrorMessage } from "@/api/functions";
import { VendorVerificationNotice } from "@/components/pages/app/vendor-verification";
import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  payoutAttemptMessage,
  PayoutSetupAttempt,
  useRetryPayoutSetup,
  useVendorEarnings,
  useVendorSales,
  VendorCurrencyEarnings,
  VendorPayoutAccount,
} from "@/hooks/use-vendor-wallet";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Landmark, ReceiptText, RefreshCw, ShieldCheck } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "sonner";

const cardClassName =
  "rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]";

const PROVIDER_LABELS: Record<VendorPayoutAccount["provider"], string> = {
  FLUTTERWAVE: "Flutterwave",
  PAYSTACK: "Paystack",
  STRIPE: "Stripe",
};

/** Where the organiser's share of each sale goes, or why it can't yet. */
const PayoutAccountCard: React.FC<{ account: VendorPayoutAccount | null }> = ({
  account,
}) => {
  const retry = useRetryPayoutSetup();
  const [attempt, setAttempt] = useState<PayoutSetupAttempt>();
  const message = payoutAttemptMessage(attempt);

  const setUp = () =>
    retry.mutate(undefined, {
      onSuccess: (result) => {
        setAttempt(result?.attempt);
        if (result?.attempt?.status === "active") {
          toast.success("You're set up to be paid directly.");
        }
      },
      onError: (error) =>
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Couldn't set up payouts.",
          ),
        ),
    });

  if (account?.status === "ACTIVE") {
    return (
      <section className={cardClassName}>
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Landmark className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-secondary-500">You&apos;re paid to</p>
            <p className="text-lg font-semibold text-secondary-950">
              {account.bankName ?? "Your bank"}
              {account.accountLast4 ? ` ••${account.accountLast4}` : ""}
            </p>
            <p className="text-sm leading-6 text-secondary-500">
              Your share of each ticket ({account.currency}) is paid to this
              account by {PROVIDER_LABELS[account.provider]} on its settlement
              schedule. Turnupz never holds it.
            </p>
            {!account.livemode && (
              <span className="inline-flex rounded-full bg-secondary-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary-700">
                Test mode
              </span>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cardClassName}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-secondary-50 p-3 text-secondary-700">
            <Landmark className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-secondary-950">
              Get paid directly
            </p>
            <p className="max-w-xl text-sm leading-6 text-secondary-500">
              Once you&apos;re verified, your share of every ticket goes
              straight to your bank through our payment partner, and Turnupz
              keeps only its fee.
            </p>
            {message && (
              <p className="text-sm font-medium text-secondary-700">{message}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={setUp}
          loading={retry.isPending}
          className="shrink-0 rounded-full border-secondary-100"
        >
          <RefreshCw className="size-4" />
          Set up payouts
        </Button>
      </div>
    </section>
  );
};

const Stat: React.FC<{
  label: string;
  value: string;
  note?: string;
  tone?: "default" | "good" | "warn";
}> = ({ label, value, note, tone = "default" }) => (
  <div className="min-w-0 rounded-[1.1rem] bg-secondary-50 px-4 py-4">
    <p className="text-xs font-medium text-secondary-500">{label}</p>
    <p
      className={cn(
        "mt-2 truncate text-xl font-bold tracking-tight",
        tone === "good" && "text-emerald-700",
        tone === "warn" && "text-secondary-700",
        tone === "default" && "text-secondary-950",
      )}
    >
      {value}
    </p>
    {note && <p className="mt-1 text-xs leading-5 text-secondary-400">{note}</p>}
  </div>
);

const CurrencyEarnings: React.FC<{ totals: VendorCurrencyEarnings }> = ({
  totals,
}) => (
  <section className={cardClassName}>
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-base font-semibold text-secondary-950">
        {totals.currency} sales
      </h2>
      <p className="text-sm text-secondary-500">
        {totals.ticketsSold.toLocaleString()} ticket
        {totals.ticketsSold === 1 ? "" : "s"} sold
      </p>
    </div>
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Ticket sales" value={totals.sales.formatted.withCurrency} />
      <Stat label="Turnupz fee" value={totals.fees.formatted.withCurrency} />
      <Stat
        label="Your earnings"
        value={totals.earnings.formatted.withCurrency}
        tone="good"
      />
      <Stat
        label="Paid to your bank"
        value={totals.paidDirect.formatted.withCurrency}
        note="Settled by our payment partner"
      />
    </div>
    {totals.owed.amount > 0 && (
      <p className="mt-4 rounded-2xl border border-secondary-100 bg-secondary-50 px-4 py-3 text-sm leading-6 text-secondary-900">
        <span className="font-semibold">
          {totals.owed.formatted.withCurrency}
        </span>{" "}
        from sales before direct payouts was collected by Turnupz and is owed to
        you. We&apos;ll be in touch to settle it.
      </p>
    )}
    {totals.refunded.amount > 0 && (
      <p className="mt-3 text-xs text-secondary-400">
        {totals.refunded.formatted.withCurrency} refunded to buyers, not
        counted above.
      </p>
    )}
  </section>
);

const SalesTable = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useVendorSales(page);
  const sales = data?.sales ?? [];
  const pagination = data?.pagination;

  return (
    <section className={cardClassName}>
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-secondary-50 p-2.5 text-secondary-700">
          <ReceiptText className="size-4" />
        </span>
        <h2 className="text-base font-semibold text-secondary-950">Sales</h2>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="py-10">
          <ErrorContainer
            error={constructErrorMessage(
              error as TApiErrorResponseType,
              "Couldn't load your sales.",
            )}
            retryFunction={refetch}
          />
        </div>
      ) : sales.length === 0 ? (
        <p className="py-10 text-center text-sm text-secondary-500">
          No ticket sales yet. They&apos;ll show here as people buy.
        </p>
      ) : (
        <div className="mt-4">
          <Table label="Sales">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">You earn</TableHead>
                <TableHead>Paid to</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className={cn(sale.status === "refunded" && "opacity-60")}
                >
                  <TableCell>{format(new Date(sale.date), "d MMM yyyy")}</TableCell>
                  <TableCell className="font-medium text-secondary-950">
                    {sale.event?.name ?? "Event"}
                  </TableCell>
                  <TableCell>
                    {sale.quantity} × {sale.ticketName ?? "Ticket"}
                  </TableCell>
                  <TableCell className="text-right">
                    {sale.amount.formatted.withCurrency}
                  </TableCell>
                  <TableCell className="text-right">
                    {sale.fee.formatted.withCurrency}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {sale.status === "refunded"
                      ? "Refunded"
                      : sale.earnings.formatted.withCurrency}
                  </TableCell>
                  <TableCell>
                    {sale.settlement === "direct" ? (
                      <span className="text-emerald-700">
                        {sale.settledTo ?? "Your bank"}
                      </span>
                    ) : (
                      <span className="text-secondary-700">Owed by Turnupz</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagination && pagination.totalPage > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-secondary-500">
              <span>
                Page {pagination.presentPage} of {pagination.totalPage}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={!pagination.previousPage}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={!pagination.nextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

/**
 * An organiser's earnings: where they're paid, what they've sold and what
 * they've earned. The payment platform pays them directly, so there's no
 * balance to withdraw.
 */
const WalletPage = () => {
  const { data, isLoading, error, refetch } = useVendorEarnings();

  return (
    <div className="space-y-5">
      <VendorVerificationNotice context="wallet" />

      <div>
        <span className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
          Earnings
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-secondary-950 md:text-[2.15rem]">
          What you&apos;ve sold and earned
        </h1>
        <p className="mt-2 flex max-w-3xl items-start gap-2 text-sm leading-6 text-secondary-500">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-secondary-400" />
          Ticket payments are split as they&apos;re made: your share goes to
          your bank through our payment partner and Turnupz keeps its fee, so
          there&apos;s nothing to withdraw.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-[1.5rem]" />
          <Skeleton className="h-44 rounded-[1.5rem]" />
        </div>
      ) : error ? (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Couldn't load your earnings.",
          )}
          retryFunction={refetch}
        />
      ) : (
        <>
          <PayoutAccountCard account={data?.payoutAccount ?? null} />
          {(data?.currencies ?? []).map((totals) => (
            <CurrencyEarnings key={totals.currency} totals={totals} />
          ))}
        </>
      )}

      <SalesTable />
    </div>
  );
};

export default memo(WalletPage);
