"use client";

import PeriodFilter from "@/components/ui/period-filter";
import SegmentedControl from "@/components/ui/segmented-control";
import { DEFAULT_PERIOD, periodPhrase, TPeriodDays } from "@/lib/periods";

import { constructErrorMessage } from "@/api/functions";
import { VendorVerificationNotice } from "@/components/pages/app/vendor-verification";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TWalletFilter,
  useRetryPayoutSetup,
  useStripeSession,
  useVendorEarnings,
  useVendorPayouts,
  VendorCurrencyEarnings,
} from "@/hooks/use-vendor-wallet";
import ChangeBankDialog from "@/components/pages/app/wallet/change-bank-dialog";
import EarningsHero from "@/components/pages/app/wallet/earnings-hero";
import PayoutAccountCard from "@/components/pages/app/wallet/payout-account-card";
import PayoutChecklist from "@/components/pages/app/wallet/payout-checklist";
import PayoutsList, {
  payoutMoney,
  payoutState,
} from "@/components/pages/app/wallet/payouts-list";
import SalesTable from "@/components/pages/app/wallet/sales-table";
import SplitExplainer from "@/components/pages/app/wallet/split-explainer";
import WalletStats from "@/components/pages/app/wallet/wallet-stats";
import { HideAmountsButton } from "@/components/pages/app/wallet/amount";
import useVendorVerificationStatus from "@/hooks/use-vendor-verification-status";
import { useActiveWorkspace } from "@/stores/workspace-store";
import dynamic from "next/dynamic";
import React, { memo, useMemo, useState } from "react";

// Stripe's screens run in the browser only.
const StripePayouts = dynamic(
  () => import("@/components/pages/app/wallet/stripe-payouts"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 rounded-3xl" />,
  },
);


/** Nothing sold yet in this currency: the page still shows its shape. */
const emptyTotals = (currency: string): VendorCurrencyEarnings => {
  const zero = (code: string) => ({
    amount: 0,
    currency: { code, symbol: "", name: code, locale: "en" },
    formatted: {
      withCurrency: new Intl.NumberFormat("en-GB", { style: "currency", currency: code }).format(0),
      withoutCurrency: "0.00",
    },
    parts: { whole: "0", fraction: "00" },
  });
  return {
    currency,
    ticketsSold: 0,
    sales: zero(currency),
    fees: zero(currency),
    earnings: zero(currency),
    paidDirect: zero(currency),
    owed: zero(currency),
    refunded: zero(currency),
    eventsCount: 0,
    previousSales: null,
  } as unknown as VendorCurrencyEarnings;
};

/**
 * An organiser's wallet: what they've earned, where it's paid, and each sale
 * and payout. The payment platform pays them directly, so there's no balance
 * to withdraw.
 */
const WalletPage = () => {
  const [days, setDays] = useState<TPeriodDays>(DEFAULT_PERIOD);
  const [eventId, setEventId] = useState<string>();
  const filter: TWalletFilter = { days: days || undefined, eventId };
  const { data, isLoading, error, refetch } = useVendorEarnings(filter);
  const verification = useVendorVerificationStatus();
  // Organisers paid through Stripe (Canada) get Stripe's own screens here.
  const stripe = useStripeSession();
  const retry = useRetryPayoutSetup();
  const [changingBank, setChangingBank] = useState(false);
  // On an organiser's team: only the organiser decides where they're paid.
  const workspace = useActiveWorkspace();
  const account = data?.payoutAccount ?? null;
  const onStripe = stripe.data?.status === "ready";
  const payoutsReady = account?.status === "ACTIVE";
  const onFlutterwave = account?.provider === "FLUTTERWAVE";
  const payouts = useVendorPayouts(onFlutterwave);

  const currencies = useMemo(() => data?.currencies ?? [], [data]);
  const [chosenCurrency, setChosenCurrency] = useState<string>();
  const currency =
    chosenCurrency && currencies.some((c) => c.currency === chosenCurrency)
      ? chosenCurrency
      : (currencies[0]?.currency ?? account?.currency ?? "NGN");
  const totals = currencies.find((c) => c.currency === currency) ?? emptyTotals(currency);
  const periodLabel = periodPhrase(days).replace(/^the /, "");

  // Flutterwave payouts not paid yet, and when the next one lands.
  const onItsWay = useMemo(() => {
    if (!onFlutterwave) return null;
    const pending = (payouts.data ?? []).filter(
      (p) => payoutState(p.status) === "pending" && p.currency === currency,
    );
    const amount = pending.reduce((sum, p) => sum + (p.net ?? 0), 0);
    const next = pending
      .map((p) => p.dueDate)
      .filter(Boolean)
      .sort()[0];
    return { amount: payoutMoney(amount, currency), nextDate: next ?? null };
  }, [onFlutterwave, payouts.data, currency]);

  const bankLabel =
    account?.bankName && account.accountLast4
      ? `${account.bankName} ••${account.accountLast4}`
      : null;

  return (
    <div className="space-y-5">
      <VendorVerificationNotice context="wallet" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Wallet</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your share of every ticket goes straight to your bank. Turnupz keeps only its fee, so
            there&apos;s nothing to withdraw.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HideAmountsButton className="h-10 border border-secondary-100 bg-card px-4 text-secondary-700 hover:bg-secondary-50" />
          {currencies.length > 1 && (
            <SegmentedControl
              label="Currency"
              value={currency}
              onChange={setChosenCurrency}
              options={currencies.map((c) => ({ value: c.currency, label: c.currency }))}
            />
          )}
<PeriodFilter value={days} onChange={setDays} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
          </div>
          <Skeleton className="h-28 rounded-3xl" />
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
          <PayoutChecklist
            verified={verification.canSellTickets}
            payoutsReady={payoutsReady}
            payoutsHint={
              onStripe
                ? "Add your bank with Stripe below. It only takes a few minutes."
                : "Tap Set up payouts once you're approved."
            }
            currency={account?.currency}
          />

          <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
            <EarningsHero totals={totals} periodLabel={periodLabel} onItsWay={onItsWay} />
            {onStripe ? (
              <SplitExplainer currency={currency} />
            ) : (
              <PayoutAccountCard
                account={account}
                onChangeBank={workspace ? undefined : () => setChangingBank(true)}
              />
            )}
          </div>

          <WalletStats totals={totals} days={days || null} />

          {stripe.data?.status === "ready" && (
            <StripePayouts
              publishableKey={stripe.data.publishableKey}
              active={stripe.data.active || payoutsReady}
              onSetupFinished={() =>
                // Ask Stripe again whether it's all done, then show the result.
                retry.mutate(undefined, {
                  onSettled: () => {
                    void refetch();
                    void stripe.refetch();
                  },
                })
              }
            />
          )}

          <SalesTable
            filter={filter}
            events={data?.events ?? []}
            onEventChange={setEventId}
          />

          {(onFlutterwave || !onStripe) && (
            <div className="grid gap-5 lg:grid-cols-2">
              {onFlutterwave && (
                <PayoutsList
                  payouts={payouts.data ?? []}
                  loading={payouts.isLoading}
                  bankLabel={bankLabel}
                />
              )}
              {!onStripe && <SplitExplainer currency={currency} />}
            </div>
          )}

          {/* Also for a Nigerian organiser whose payouts need a bank picked first. */}
          {(onFlutterwave || !account) && (
            <ChangeBankDialog
              open={changingBank}
              onOpenChange={setChangingBank}
              country={account?.country ?? "NG"}
            />
          )}
        </>
      )}
    </div>
  );
};

export default memo(WalletPage);
