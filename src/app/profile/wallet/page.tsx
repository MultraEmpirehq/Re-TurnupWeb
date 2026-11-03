"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TCreditGrant,
  TSavedCard,
  maskMoney,
  useCreditBalance,
  useCreditHistory,
  useHideBalance,
  useSavedCardActions,
  useSavedCards,
} from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { format } from "date-fns";
import {
  ArrowLeft,
  CreditCard,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useState } from "react";
import { toast } from "sonner";
import { useFeatures } from "@/hooks/use-features";

const STATE: Record<
  TCreditGrant["state"],
  { label: string; className: string }
> = {
  PENDING: { label: "On the way", className: "bg-amber-50 text-amber-700" },
  AVAILABLE: {
    label: "Available",
    className: "bg-emerald-50 text-emerald-700",
  },
  SPENT: { label: "Spent", className: "bg-secondary-50 text-secondary-500" },
  EXPIRED: {
    label: "Expired",
    className: "bg-secondary-50 text-secondary-500",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-secondary-50 text-secondary-500",
  },
};

const card =
  "rounded-[1.75rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]";

/** What they can spend, per currency, with what's on the way. */
const Balances: React.FC = () => {
  const { data: balances = [], isLoading } = useCreditBalance();
  const { hidden, toggle } = useHideBalance();
  const { creditSpending } = useFeatures();
  return (
    <section className="rounded-[1.75rem] bg-linear-to-br from-secondary-800 via-secondary-600 to-primary p-6 text-white shadow-[0_24px_60px_-30px_rgba(5,119,250,0.6)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">Turnupz Credit</p>
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
        >
          {hidden ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
          {hidden ? "Show" : "Hide"}
        </button>
      </div>
      {isLoading ? (
        <Skeleton className="mt-4 h-10 w-48 bg-white/20" />
      ) : balances.length ? (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {balances.map((row) => (
            <li key={row.currency}>
              <p className="text-3xl font-extrabold tracking-tight">
                {maskMoney(row.available.formatted.withCurrency, hidden)}
              </p>
              <p className="text-sm text-white/80">
                {row.pending.amount > 0
                  ? `${maskMoney(row.pending.formatted.withCurrency, hidden)} on the way`
                  : creditSpending
                    ? "Ready to spend"
                    : "Paused for now"}
              </p>
              {row.nextExpiry && row.available.amount > 0 && (
                <p className="mt-0.5 text-xs text-white/65">
                  Use some by {format(new Date(row.nextExpiry), "d MMM yyyy")}{" "}
                  before it expires
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-3xl font-extrabold tracking-tight">
          {maskMoney("0", hidden)}
        </p>
      )}
      <p className="mt-4 text-sm text-white/80">
        {creditSpending
          ? "Spend it on tickets at checkout. You earn it when friends you invite buy tickets."
          : "Paying with Turnupz Credit is paused for now. Your balance is safe and stays here."}
      </p>
    </section>
  );
};

const History: React.FC = () => {
  const { data: history = [], isLoading } = useCreditHistory();
  const { hidden } = useHideBalance();
  return (
    <section className={card}>
      <h2 className="text-lg font-bold text-secondary-950">
        Where it came from
      </h2>
      {isLoading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : history.length ? (
        <ul className="mt-4 divide-y divide-secondary-50">
          {history.map((grant) => (
            <li
              key={grant.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-secondary-950">
                  {grant.description}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-secondary-500">
                  {format(new Date(grant.createdAt), "d MMM yyyy")}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-semibold",
                      STATE[grant.state].className,
                    )}
                  >
                    {STATE[grant.state].label}
                    {grant.state === "PENDING" && grant.releaseAt
                      ? ` until ${format(new Date(grant.releaseAt), "d MMM")}`
                      : ""}
                  </span>
                </p>
              </div>
              <p className="shrink-0 font-bold text-secondary-950">
                +{maskMoney(grant.amount.formatted.withCurrency, hidden)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-secondary-200 px-6 py-10 text-center">
          <Sparkles className="mx-auto size-6 text-secondary-300" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-secondary-950">
            No credit yet
          </p>
          <p className="mt-1 text-sm text-secondary-500">
            Share your invite code from your profile. When friends buy, you earn
            credit.
          </p>
        </div>
      )}
    </section>
  );
};

const BRAND_STYLE: Record<string, string> = {
  visa: "from-[#1a1f71] to-[#3b47c7]",
  mastercard: "from-[#1b1b1b] to-[#4b4b4b]",
  verve: "from-[#00425f] to-[#0a7a9e]",
};

const SavedCardRow: React.FC<{ saved: TSavedCard }> = ({ saved }) => {
  const { makeDefault, remove } = useSavedCardActions();
  const [confirming, setConfirming] = useState(false);
  const brand = saved.brand?.toLowerCase() ?? "";
  // "VISA" or "visa" from the provider reads as "Visa".
  const brandName = brand ? brand[0].toUpperCase() + brand.slice(1) : "Card";
  const expiry = `${String(saved.expiryMonth).padStart(2, "0")}/${String(saved.expiryYear).slice(-2)}`;
  const busy = makeDefault.isPending || remove.isPending;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-secondary-100 p-3 sm:flex-row sm:items-center">
      <span
        className={cn(
          "flex h-14 w-24 shrink-0 flex-col justify-between rounded-xl bg-linear-to-br p-2 text-white",
          BRAND_STYLE[brand] ?? "from-secondary-700 to-secondary-500",
        )}
        aria-hidden
      >
        <span className="text-[10px] font-extrabold tracking-wide uppercase">
          {saved.brand}
        </span>
        <span className="font-mono text-xs">•••• {saved.last4}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-secondary-950">
            {brandName} ending {saved.last4}
          </span>
          {saved.isDefault && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-secondary-700">
              Pays first
            </span>
          )}
          {saved.isExpired && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
              Expired
            </span>
          )}
        </span>
        <span className="block text-xs text-secondary-500">
          Expires {expiry}
          {saved.lastUsedAt
            ? ` · last used ${format(new Date(saved.lastUsedAt), "d MMM yyyy")}`
            : ""}
        </span>
      </span>
      <span className="flex shrink-0 gap-2">
        {!saved.isDefault && !saved.isExpired && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              makeDefault.mutate(saved.id, {
                onSuccess: () => toast.success("That card pays first now"),
                onError: (error) =>
                  toast.error(
                    constructErrorMessage(
                      error as TApiErrorResponseType,
                      "Couldn't change that.",
                    ),
                  ),
              })
            }
            className="rounded-xl"
          >
            Pay with this first
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => setConfirming(true)}
          className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Remove
        </Button>
      </span>
      <ConfirmDialog
        open={confirming}
        title="Remove this card?"
        description={`Your ${brandName} ending ${saved.last4} won't be offered at checkout any more. You can save it again next time you pay.`}
        confirmLabel="Remove card"
        tone="danger"
        busy={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(saved.id, {
            onSuccess: () => {
              toast.success("Card removed");
              setConfirming(false);
            },
            onError: (error) =>
              toast.error(
                constructErrorMessage(
                  error as TApiErrorResponseType,
                  "Couldn't remove that card.",
                ),
              ),
          })
        }
      />
    </li>
  );
};

const SavedCards: React.FC = () => {
  const { data: cards = [], isLoading } = useSavedCards();
  return (
    <section className={card}>
      <h2 className="text-lg font-bold text-secondary-950">Saved cards</h2>
      <p className="mt-1 text-sm text-secondary-500">
        Tick &ldquo;Save this card&rdquo; when you pay to add one. The card that
        pays first is picked for you at checkout.
      </p>
      {isLoading ? (
        <Skeleton className="mt-4 h-20 rounded-2xl" />
      ) : cards.length ? (
        <ul className="mt-4 space-y-3">
          {cards.map((saved) => (
            <SavedCardRow key={saved.id} saved={saved} />
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-secondary-200 px-6 py-10 text-center">
          <CreditCard
            className="mx-auto size-6 text-secondary-300"
            aria-hidden
          />
          <p className="mt-2 text-sm font-semibold text-secondary-950">
            No saved cards
          </p>
          <p className="mt-1 text-sm text-secondary-500">
            Your next checkout can save one for you.
          </p>
        </div>
      )}
      <p className="mt-4 flex items-start gap-2 text-xs text-secondary-500">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        We never see your full card number: the payment provider keeps it.
      </p>
    </section>
  );
};

/** Turnupz Credit and saved cards, as the app's wallet. */
const WalletPage = () => (
  <div className="@container space-y-6">
    <div className="flex items-center gap-3">
      <Link
        href={ROUTES.USER_PROFILE.href}
        aria-label="Back to your profile"
        className="flex size-10 items-center justify-center rounded-full border border-secondary-100 bg-white text-secondary-700 hover:bg-secondary-50"
      >
        <ArrowLeft className="size-4" />
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-secondary-950">
        Wallet
      </h1>
    </div>
    <div className="grid items-start gap-6 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Balances />
        <SavedCards />
      </div>
      <History />
    </div>
  </div>
);

export default memo(WalletPage);
