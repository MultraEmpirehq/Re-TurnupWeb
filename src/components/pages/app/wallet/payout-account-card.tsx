"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  payoutAttemptMessage,
  PayoutSetupAttempt,
  useRetryPayoutSetup,
  VendorPayoutAccount,
} from "@/hooks/use-vendor-wallet";
import { Landmark, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { memo, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";

const PROVIDER_LABELS: Record<VendorPayoutAccount["provider"], string> = {
  FLUTTERWAVE: "Flutterwave",
  PAYSTACK: "Paystack",
  STRIPE: "Stripe",
};

const cardClassName =
  "flex h-full flex-col rounded-[1.75rem] border border-secondary-100 bg-white p-6";

/** Where the organiser's share of each sale goes, or why it can't yet. */
const PayoutAccountCard: React.FC<{
  account: VendorPayoutAccount | null;
  /** Flutterwave organisers can move their payouts to another bank. */
  onChangeBank?: () => void;
}> = ({ account, onChangeBank }) => {
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
        // Stripe (Canada): bank and identity are added on Stripe's own page.
        if (result?.attempt?.status === "onboarding") {
          window.location.assign(result.attempt.url);
        }
      },
      onError: (error) =>
        toast.error(
          constructErrorMessage(error as TApiErrorResponseType, "Couldn't set up payouts."),
        ),
    });

  // Back from Stripe's page: check straight away whether it's all done.
  const searchParams = useSearchParams();
  const backFromStripe = searchParams.get("payouts") === "stripe";
  const checked = useRef(false);
  useEffect(() => {
    if (!backFromStripe || checked.current || account?.status === "ACTIVE") return;
    checked.current = true;
    retry.mutate(undefined, {
      onSuccess: (result) => {
        if (result?.attempt?.status === "onboarding") {
          // Not finished on Stripe yet: they choose when to go back.
          toast.info("Stripe still needs a few details. Tap Set up payouts to finish.");
          return;
        }
        setAttempt(result?.attempt);
        if (result?.attempt?.status === "active") {
          toast.success("You're set up to be paid directly.");
        }
      },
    });
  }, [backFromStripe, account?.status, retry]);

  if (account?.status === "ACTIVE") {
    const bank = account.bankName ?? "Your bank";
    return (
      <section className={cardClassName}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">Paid to</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Direct payouts on
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary-50 text-lg font-extrabold text-secondary-700">
            {bank.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-secondary-950">{bank}</p>
            <p className="text-sm text-muted-foreground">
              {account.accountLast4 ? `••••${account.accountLast4} · ` : ""}
              {account.currency}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {PROVIDER_LABELS[account.provider]} pays your share into this account on its settlement
          schedule
          {account.provider === "FLUTTERWAVE" ? ", usually the next working day" : ""}. Turnupz
          never holds it.
        </p>
        {!account.livemode && (
          <span className="mt-3 inline-flex w-fit rounded-full bg-secondary-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.14em] text-secondary-700 uppercase">
            Test mode
          </span>
        )}
        {onChangeBank && account.provider === "FLUTTERWAVE" && (
          <div className="mt-auto pt-5">
            <Button
              variant="outline"
              onClick={onChangeBank}
              className="rounded-full border-secondary-100"
            >
              Change bank
            </Button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={cardClassName}>
      <span className="w-fit rounded-2xl bg-secondary-50 p-3 text-secondary-700">
        <Landmark className="size-5" />
      </span>
      <p className="mt-4 text-lg font-bold text-secondary-950">Get paid directly</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Once you&apos;re verified, your share of every ticket goes straight to your bank through
        our payment partner, and Turnupz keeps only its fee.
      </p>
      {message && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
        >
          {message}
        </p>
      )}
      <div className="mt-auto pt-5">
        {attempt?.status === "missing_details" &&
        attempt.missing.includes("bankCode") &&
        onChangeBank ? (
          <Button onClick={onChangeBank} className="rounded-full">
            <Landmark className="size-4" />
            Add your bank
          </Button>
        ) : (
          <Button onClick={setUp} loading={retry.isPending} className="rounded-full">
            <RefreshCw className="size-4" />
            Set up payouts
          </Button>
        )}
      </div>
    </section>
  );
};

export default memo(PayoutAccountCard);
