import { getData } from "@/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

// Admin finance (read only). Amounts arrive in the currency's main unit
// (naira, dollars), already split by the api the way the vendor wallet does.

export type TFinanceRange = { currency: string; from: Date; to: Date };

const rangeParams = ({ currency, from, to }: TFinanceRange) => ({
  currency,
  from: from.toISOString(),
  to: to.toISOString(),
});

export interface IFinanceRevenue {
  currency: string;
  totals: {
    sales: number;
    salesChange: number | null;
    fees: number;
    feesChange: number | null;
    refunds: number;
    refundRate: number;
    credit: number;
    orders: number;
    tickets: number;
  };
  months: {
    month: string;
    start: string;
    sales: number;
    fees: number;
    refunds: number;
    credit: number;
    orders: number;
  }[];
  byCountry: { currency: string; country: string; sales: number }[];
  topCities: { city: string; currency: string; sales: number }[];
  taxCollected: number | null;
}

export type TTransactionStatus =
  | "completed"
  | "partly_refunded"
  | "refunded"
  | "failed"
  | "held"
  | "needs_review";

export interface IFinanceTransaction {
  id: string;
  reference: string | null;
  createdAt: string;
  status: TTransactionStatus;
  buyer: string;
  event: { id: string; name: string } | null;
  organiser: string | null;
  provider: "PAYSTACK" | "FLUTTERWAVE" | "STRIPE" | null;
  providerRef: string | null;
  tickets: number;
  gross: number;
  discount: number;
  fee: number;
  credit: number;
  toOrganiser: number;
  refunded: number;
  settledTo:
    | { kind: "direct"; provider: string; bankName: string | null; last4: string | null }
    | { kind: "held" }
    | null;
}

export type TTransactionFilter = "all" | "paid" | "refunded" | "failed" | "held" | "review";

export interface IFinanceOrganiser {
  vendorId: string;
  name: string;
  country: string | null;
  paidThrough: { provider: string; bankName: string | null; last4: string | null } | null;
  payouts: "on" | "setup_unfinished" | "no_account";
  sales: number;
  fees: number;
  paidToThem: number;
  owed: number;
  tickets: number;
}

export type TOrganiserFilter = "all" | "on" | "attention";

export interface IFinanceCredit {
  currency: string;
  spendingOn: boolean;
  totals: { given: number; spent: number; unspent: number; holders: number; lapsed: number };
  byReason: { reason: string; amount: number }[];
  months: { month: string; start: string; given: number; spent: number; unspentAtEnd: number }[];
  largestBalances: { userId: string; name: string; username: string | null; balance: number }[];
}

export const TRANSACTIONS_PAGE_SIZE = 25;

export const useFinanceCurrencies = () =>
  useQuery({
    queryKey: ["admin-finance", "currencies"],
    queryFn: async () => {
      const { data } = await getData<string[]>("/admin/finance/currencies");
      return data?.data ?? ["NGN"];
    },
    staleTime: 5 * 60 * 1000,
  });

export const useFinanceRevenue = (range: TFinanceRange) =>
  useQuery({
    queryKey: ["admin-finance", "revenue", rangeParams(range)],
    queryFn: async () => {
      const { data } = await getData<IFinanceRevenue>("/admin/finance/revenue", {
        params: rangeParams(range),
      });
      return data?.data ?? null;
    },
    placeholderData: keepPreviousData,
    retry: 0,
  });

export const fetchFinanceTransactions = async (
  range: TFinanceRange,
  filters: { status: TTransactionFilter; q?: string; page: number; limit: number },
) => {
  const { data } = await getData<{
    counts: Record<TTransactionFilter, number>;
    items: IFinanceTransaction[];
  }>("/admin/finance/transactions", {
    params: {
      ...rangeParams(range),
      status: filters.status,
      page: filters.page,
      limit: filters.limit,
      ...(filters.q ? { q: filters.q } : {}),
    },
  });
  return {
    counts: data?.data?.counts,
    items: data?.data?.items ?? [],
    total: data?.pagination?.total ?? 0,
  };
};

export const useFinanceTransactions = (
  range: TFinanceRange,
  filters: { status: TTransactionFilter; q?: string; page: number },
) =>
  useQuery({
    queryKey: ["admin-finance", "transactions", rangeParams(range), filters],
    queryFn: () =>
      fetchFinanceTransactions(range, { ...filters, limit: TRANSACTIONS_PAGE_SIZE }),
    placeholderData: keepPreviousData,
    retry: 0,
  });

export const useFinanceOrganisers = (
  range: TFinanceRange,
  filters: { filter: TOrganiserFilter; q?: string },
) =>
  useQuery({
    queryKey: ["admin-finance", "organisers", rangeParams(range), filters],
    queryFn: async () => {
      const { data } = await getData<{
        summary: {
          selling: number;
          newThisPeriod: number;
          paidToOrganisers: number;
          owed: number;
          owedTo: number;
          cantBePaid: number;
        };
        counts: Record<TOrganiserFilter, number>;
        items: IFinanceOrganiser[];
      }>("/admin/finance/organisers", {
        params: {
          ...rangeParams(range),
          filter: filters.filter,
          ...(filters.q ? { q: filters.q } : {}),
        },
      });
      return data?.data ?? null;
    },
    placeholderData: keepPreviousData,
    retry: 0,
  });

export const useFinanceCredit = (range: TFinanceRange) =>
  useQuery({
    queryKey: ["admin-finance", "credit", rangeParams(range)],
    queryFn: async () => {
      const { data } = await getData<IFinanceCredit>("/admin/finance/credit", {
        params: rangeParams(range),
      });
      return data?.data ?? null;
    },
    placeholderData: keepPreviousData,
    retry: 0,
  });
