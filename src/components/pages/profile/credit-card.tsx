"use client";

import { getData } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Wallet } from "lucide-react";
import React, { memo, useState } from "react";

type TMoney = { amount: number; formatted: { withCurrency: string } };
type TBalance = {
  currency: string;
  available: TMoney;
  pending: TMoney;
  nextExpiry: string | null;
};
type TGrant = {
  id: string;
  amount: TMoney;
  state: "PENDING" | "AVAILABLE" | "SPENT" | "EXPIRED" | "CANCELLED";
  description: string;
  releaseAt: string | null;
  createdAt: string;
};

const STATE_LABEL: Record<TGrant["state"], string> = {
  PENDING: "On the way",
  AVAILABLE: "Available",
  SPENT: "Spent",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

/**
 * Turnupz Credit: spendable now, on the way, when it next expires, and where
 * each amount came from. Hidden until they've had any.
 */
const CreditCard: React.FC<{ className?: string }> = ({ className }) => {
  const [open, setOpen] = useState(false);
  const { data: balance } = useQuery({
    queryKey: ["credit", "balance"],
    queryFn: async () =>
      (await getData<TBalance[]>("/credit")).data?.data ?? [],
  });
  const { data: history } = useQuery({
    queryKey: ["credit", "history"],
    enabled: open,
    queryFn: async () =>
      (await getData<TGrant[]>("/credit/history?limit=50")).data?.data ?? [],
  });
  if (!balance?.length) return null;

  return (
    <section className={className}>
      <div className="flex items-center gap-2">
        <Wallet className="size-5 text-primary-600" />
        <h2 className="text-base font-bold text-secondary-950">
          Turnupz Credit
        </h2>
      </div>
      {balance.map((row) => (
        <div key={row.currency} className="mt-3">
          <p className="text-2xl font-bold text-secondary-950">
            {row.available.formatted.withCurrency}
          </p>
          {row.pending.amount > 0 && (
            <p className="text-sm text-secondary-600">
              {row.pending.formatted.withCurrency} on the way
            </p>
          )}
          {row.nextExpiry && row.available.amount > 0 && (
            <p className="text-xs text-secondary-500">
              Use some by {format(new Date(row.nextExpiry), "d MMM yyyy")}{" "}
              before it expires
            </p>
          )}
        </div>
      ))}
      <p className="mt-2 text-xs text-secondary-500">
        Spend it on tickets at checkout.
      </p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-3 text-sm font-semibold text-primary-700 hover:underline"
      >
        {open ? "Hide history" : "See history"}
      </button>
      {open && (
        <ul className="mt-3 space-y-3">
          {(history ?? []).map((grant) => (
            <li
              key={grant.id}
              className="flex items-start justify-between gap-3 border-t border-secondary-100 pt-3 text-sm"
            >
              <div>
                <p className="text-secondary-900">{grant.description}</p>
                <p className="text-xs text-secondary-500">
                  {format(new Date(grant.createdAt), "d MMM yyyy")} ·{" "}
                  {STATE_LABEL[grant.state]}
                  {grant.state === "PENDING" && grant.releaseAt
                    ? ` until ${format(new Date(grant.releaseAt), "d MMM")}`
                    : ""}
                </p>
              </div>
              <p className="font-semibold">
                +{grant.amount.formatted.withCurrency}
              </p>
            </li>
          ))}
          {history && !history.length && (
            <li className="text-sm text-secondary-500">Nothing yet.</li>
          )}
        </ul>
      )}
    </section>
  );
};

export default memo(CreditCard);
