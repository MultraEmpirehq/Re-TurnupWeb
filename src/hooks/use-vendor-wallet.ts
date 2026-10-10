import { getData, postData } from "@/api";
import { PriceDetailsType } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * An organiser's earnings. Turnupz doesn't hold their money: ticket payments
 * split at checkout and the payment platform pays their share to their bank,
 * so there's nothing to withdraw, only a report of what came in.
 */

export interface VendorPayoutAccount {
  provider: "FLUTTERWAVE" | "PAYSTACK" | "STRIPE";
  status: "ACTIVE" | "DISABLED";
  livemode: boolean;
  country: string;
  currency: string;
  bankName: string | null;
  accountLast4: string | null;
}

export interface VendorCurrencyEarnings {
  currency: string;
  ticketsSold: number;
  sales: PriceDetailsType;
  fees: PriceDetailsType;
  earnings: PriceDetailsType;
  /** Paid to the organiser's bank by the payment platform. */
  paidDirect: PriceDetailsType;
  /** Collected by Turnupz before direct payouts, still owed to them. */
  owed: PriceDetailsType;
  refunded: PriceDetailsType;
}

export interface VendorEarnings {
  payoutAccount: VendorPayoutAccount | null;
  currencies: VendorCurrencyEarnings[];
}

export interface VendorSale {
  id: string;
  date: string;
  event: { id: string; name: string } | null;
  ticketName: string | null;
  quantity: number;
  status: "paid" | "refunded";
  provider: VendorPayoutAccount["provider"];
  settlement: "direct" | "held";
  settledTo: string | null;
  amount: PriceDetailsType;
  fee: PriceDetailsType;
  earnings: PriceDetailsType;
}

export type PayoutSetupAttempt =
  | { status: "active"; provider: VendorPayoutAccount["provider"] }
  | { status: "unsupported_country" | "not_configured" | "not_approved" }
  | { status: "missing_details"; missing: string[] }
  | { status: "failed"; message: string };

export const useVendorEarnings = () =>
  useQuery({
    queryKey: ["vendor-earnings"],
    queryFn: async () => {
      const { data } = await getData<VendorEarnings>("/vendor/wallet");
      return data?.data ?? { payoutAccount: null, currencies: [] };
    },
  });

export const useVendorSales = (page = 1) =>
  useQuery({
    queryKey: ["vendor-sales", page],
    queryFn: async () => {
      const { data } = await getData<VendorSale[]>(
        `/vendor/wallet/sales?page=${page}&limit=20`,
      );
      return { sales: data?.data ?? [], pagination: data?.pagination };
    },
    placeholderData: (previous) => previous,
  });

/** Tries setting up payouts again; `attempt` says how it went. */
export const useRetryPayoutSetup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await postData<
        undefined,
        { account: VendorPayoutAccount | null; attempt?: PayoutSetupAttempt }
      >("/vendor/verification/payout-account");
      return data?.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["vendor-earnings"] }),
  });
};

/** Why payouts aren't set up yet, in the organiser's terms. */
export const payoutAttemptMessage = (attempt?: PayoutSetupAttempt) => {
  switch (attempt?.status) {
    case undefined:
    case "active":
      return null;
    case "not_approved":
      return "Payouts are set up once your verification is approved.";
    case "unsupported_country":
      return "Direct payouts aren't available in your payout country yet. We'll be in touch about getting you paid.";
    case "not_configured":
      return "Direct payouts aren't switched on yet. Try again later.";
    case "missing_details":
      return attempt.missing.includes("bankCode")
        ? "We need your bank picked from our list. Contact support and we'll set it for you."
        : `Your payout details are missing: ${attempt.missing.join(", ")}.`;
    case "failed":
      return `The payment provider couldn't set up your payouts: ${attempt.message}`;
  }
};
