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
  /** Finish on the provider's own page (Stripe), then come back here. */
  | { status: "onboarding"; provider: VendorPayoutAccount["provider"]; url: string }
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
    case "onboarding":
      return "Taking you to Stripe to add your bank details…";
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

/**
 * Stripe's own screens in the Wallet (organisers paid through Stripe, in
 * Canada): `ready` with what loads them, otherwise why not (e.g. paid through
 * Flutterwave, or not approved yet).
 */
export type TStripeSession =
  | { status: "ready"; clientSecret: string; publishableKey: string; active: boolean }
  | { status: "unsupported_country" | "not_configured" | "not_approved" }
  | { status: "missing_details"; missing: string[] }
  | { status: "failed"; message: string };

export const fetchStripeSession = async () => {
  const { data } = await postData<undefined, TStripeSession>(
    "/vendor/verification/payout-account/stripe-session",
  );
  return data?.data ?? null;
};

export const useStripeSession = () =>
  useQuery({
    queryKey: ["stripe-session"],
    queryFn: fetchStripeSession,
    retry: 0,
    // A fresh one each visit: they expire quickly.
    staleTime: 0,
    gcTime: 0,
  });

/** One of Flutterwave's payouts to the organiser's bank (amounts in major units). */
export interface VendorPayout {
  id: string;
  status: string;
  currency: string;
  gross: number | null;
  net: number | null;
  fees: number;
  refunds: number;
  transactions: number | null;
  dueDate: string | null;
  paidAt: string | null;
}

export const useVendorPayouts = (enabled: boolean) =>
  useQuery({
    queryKey: ["vendor-payouts"],
    queryFn: async () => {
      const { data } = await getData<VendorPayout[]>("/vendor/wallet/payouts");
      return data?.data ?? [];
    },
    enabled,
  });

/** Banks payouts can go to in a country (with the code to save). */
export const usePayoutBanks = (country?: string) =>
  useQuery({
    queryKey: ["payout-banks", country],
    queryFn: async () => {
      const { data } = await getData<{ code: string; name: string }[]>(
        `/vendor/verification/banks?country=${country}`,
      );
      return data?.data ?? [];
    },
    enabled: !!country,
    staleTime: 60 * 60 * 1000,
  });

/** Whose account it is (Nigerian banks), to confirm before saving. */
export const resolvePayoutAccountName = async (accountNumber: string, bankCode: string) => {
  const { data } = await postData<
    { accountNumber: string; bankCode: string },
    { accountName: string }
  >("/vendor/verification/resolve-account", { accountNumber, bankCode });
  return data?.data?.accountName ?? null;
};

/** Moves Flutterwave payouts to another bank, confirmed with the password. */
export const useChangePayoutBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      bankCode: string;
      bankName?: string;
      accountNumber: string;
      password: string;
    }) => {
      const { data } = await postData<
        typeof body,
        { account: VendorPayoutAccount | null; attempt?: PayoutSetupAttempt }
      >("/vendor/verification/payout-account/bank", body);
      return data?.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vendor-earnings"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor-payouts"] });
    },
  });
};
