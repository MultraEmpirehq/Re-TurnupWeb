import { getData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type TDashboardDays = 7 | 30 | 90;

type TMoney = { amount: number; formatted: { withCurrency: string } };
type TChange = number | null;
type TPoint = { date: string; value: number };

export interface IAdminDashboard {
  range: { days: number; from: string; to: string };
  sections: {
    people: {
      total: number;
      vendors: number;
      attendees: number;
      newPeople: { value: number; change: TChange };
      series: TPoint[];
    } | null;
    events: {
      upcoming: number;
      newEvents: { value: number; change: TChange };
      ticketsIssued: { value: number; change: TChange };
      mix: { selling: number; register: number; external: number };
      series: TPoint[];
    } | null;
    money:
      | {
          currency: string;
          sales: { value: TMoney; change: TChange };
          fees: { value: TMoney; change: TChange };
          creditSpent: { value: TMoney; change: TChange };
          refunds: { value: TMoney; change: TChange };
          orders: { value: number; change: TChange };
          series: TPoint[];
        }[]
      | null;
    engagement: {
      active30: { count: number; share: number };
      active7: { count: number; share: number };
      referredSignUps: number;
    } | null;
    /** Super admins only. */
    growth: IDashboardGrowth | null;
  };
  activity: {
    kind: "signup" | "order" | "event";
    at: string;
    title: string;
    detail: string;
  }[];
}

export interface IDashboardGrowth {
  totals: {
    attendees: number;
    vendors: number;
    verifiedSellers: number;
    freeHosts: number;
  };
  /** Seen in the last 5 minutes. */
  online: { attendees: number; vendors: number; anonymous: number };
  visited: {
    key: "today" | "week" | "month" | "quarter" | "year" | "all";
    label: string;
    attendees: number;
    vendors: number;
    anonymous: number;
  }[];
  series: TPoint[];
  installs: {
    android: number;
    ios: number;
    total: number;
    newThisPeriod: number;
  };
  /** null until each store's figures are connected. */
  stores: {
    /** The Play Console reports are set up (figures may still be on the way). */
    googlePlayConnected?: boolean;
    googlePlay: number | null;
    appStore: number | null;
    total: number | null;
  };
}

/** The admin overview; sections the admin can't see come back as null. */
export const useAdminDashboard = (days: TDashboardDays) =>
  useQuery({
    queryKey: ["admin-dashboard", days],
    queryFn: async () =>
      (await getData<IAdminDashboard>("/admin/dashboard", { params: { days } }))
        .data?.data ?? null,
    refetchInterval: 60_000,
    retry: 0,
  });

/** Reads the latest Play Console installs reports now (super admins). */
export const useImportPlayDownloads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (
        await postData<
          undefined,
          { connected: boolean; imported: number; months: string[] }
        >("/admin/store-downloads/google-play/import")
      ).data?.data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
  });
};
