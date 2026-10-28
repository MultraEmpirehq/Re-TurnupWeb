"use client";

import { fetchStripeSession } from "@/hooks/use-vendor-wallet";
import { cn } from "@/lib/utils";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import type { StripeConnectInstance } from "@stripe/connect-js";
import {
  ConnectAccountManagement,
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
  ConnectNotificationBanner,
  ConnectPayments,
  ConnectPayouts,
} from "@stripe/react-connect-js";
import { Landmark, Loader2 } from "lucide-react";
import React, { memo, useMemo, useState } from "react";

const TABS = [
  { id: "payouts", label: "Payouts" },
  { id: "payments", label: "Payments" },
  { id: "account", label: "Bank and details" },
] as const;
type TTab = (typeof TABS)[number]["id"];

const cardClassName =
  "rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]";

/**
 * Stripe's own screens inside the Wallet, for organisers paid through Stripe
 * (Canada), so they never leave Turnupz. Until Stripe can pay them it's the
 * setup (bank and identity, which Stripe checks); after, any notice Stripe has
 * for them, then their payouts, payments (with refunds and disputes) and bank
 * details. The organiser is the seller and Stripe pays them directly.
 */
const StripePayouts = ({
  publishableKey,
  active,
  onSetupFinished,
}: {
  publishableKey: string;
  /** Stripe can take payments for them already. */
  active: boolean;
  /** They left Stripe's setup: check whether it's all done. */
  onSetupFinished: () => void;
}) => {
  const [tab, setTab] = useState<TTab>("payouts");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Made once; Stripe asks for a fresh session itself when one runs out.
  const connect = useMemo<StripeConnectInstance>(
    () =>
      loadConnectAndInitialize({
        publishableKey,
        fetchClientSecret: async () => {
          const session = await fetchStripeSession();
          if (session?.status !== "ready") {
            throw new Error("Stripe isn't available right now");
          }
          return session.clientSecret;
        },
        appearance: {
          overlays: "dialog",
          variables: {
            colorPrimary: "#0577FA",
            colorText: "#0b1d2a",
            borderRadius: "12px",
            fontFamily: "inherit",
          },
        },
      }),
    [publishableKey],
  );

  const common = {
    onLoaderStart: () => setLoading(false),
    onLoadError: ({ error }: { error: { message?: string } }) =>
      setLoadError(error.message ?? "Stripe couldn't load"),
  };

  return (
    <section className={cardClassName}>
      <div className="mb-4 flex items-start gap-4">
        <span
          className={cn(
            "rounded-2xl p-3",
            active ? "bg-emerald-50 text-emerald-700" : "bg-secondary-50 text-secondary-700",
          )}
        >
          <Landmark className="size-5" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-lg font-semibold text-secondary-950">
            {active ? "Paid through Stripe" : "Set up payouts with Stripe"}
          </p>
          <p className="text-sm leading-6 text-secondary-500">
            {active
              ? "Your share of each ticket goes straight to your bank through Stripe, and Turnupz keeps only its fee. Manage it all here."
              : "Add your bank and confirm who you are. Stripe checks it and then pays your share of each ticket straight to your bank. It takes a few minutes, right here."}
          </p>
        </div>
      </div>

      {loadError ? (
        <p className="rounded-2xl bg-secondary-50 px-4 py-3 text-sm text-secondary-700">
          {loadError}. Refresh the page to try again.
        </p>
      ) : (
        <ConnectComponentsProvider connectInstance={connect}>
          {loading && (
            <div className="flex items-center gap-2 py-6 text-sm text-secondary-500">
              <Loader2 className="size-4 animate-spin" /> Loading Stripe…
            </div>
          )}
          {!active ? (
            <ConnectAccountOnboarding
              onExit={onSetupFinished}
              collectionOptions={{ fields: "eventually_due", futureRequirements: "include" }}
              {...common}
            />
          ) : (
            <div className="space-y-4">
              <ConnectNotificationBanner {...common} />
              <div
                role="tablist"
                aria-label="Stripe"
                className="flex gap-1.5 border-b border-secondary-100"
              >
                {TABS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === option.id}
                    onClick={() => setTab(option.id)}
                    className={cn(
                      "-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
                      tab === option.id
                        ? "border-primary text-secondary-950"
                        : "border-transparent text-secondary-500 hover:text-secondary-800",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {tab === "payouts" && <ConnectPayouts {...common} />}
              {tab === "payments" && <ConnectPayments {...common} />}
              {tab === "account" && <ConnectAccountManagement {...common} />}
            </div>
          )}
        </ConnectComponentsProvider>
      )}
    </section>
  );
};

export default memo(StripePayouts);
