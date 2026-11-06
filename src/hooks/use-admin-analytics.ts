import { getData } from "@/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

// Admin analytics (read only): totals, never who did what.

export type TAnalyticsRange = { from: Date; to: Date };

export interface IAnalyticsAudience {
  totals: {
    signups: number;
    signupsChange: number | null;
    organisersApplied: number;
    organisersApproved: number;
    activeMonth: number;
    activeWeek: number;
    cameBack: number | null;
    cameBackOf: number;
  };
  months: { month: string; attendees: number; organisers: number }[];
  places: { city: string; orders: number }[];
  platforms: { app: number; web: number };
  cohorts: { month: string; buyers: number; after: (number | null)[] }[];
}

export interface IAnalyticsEvent {
  eventId: string;
  name: string;
  organiser: string | null;
  date: string | null;
  views: number;
  ticketViews: number;
  started: number;
  bought: number;
  tickets: number;
  rate: number | null;
}

export interface IAnalyticsSource {
  key: string;
  label: string;
  orders: number;
  tickets: number;
  share: number | null;
}

export interface IAnalyticsFunnel {
  steps: { key: string; label: string; count: number; ofPrevious: number | null }[];
  events: IAnalyticsEvent[];
  sources: IAnalyticsSource[];
}

const params = (range: TAnalyticsRange, paidOnly?: boolean) => {
  const search = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
  if (paidOnly) search.set("paidOnly", "true");
  return search.toString();
};

const useAnalytics = <T,>(path: string, range: TAnalyticsRange, paidOnly?: boolean) =>
  useQuery({
    queryKey: ["admin-analytics", path, range, !!paidOnly],
    placeholderData: keepPreviousData,
    queryFn: async () => (await getData<T>(`/admin/analytics/${path}?${params(range, paidOnly)}`)).data?.data,
  });

export const useAnalyticsAudience = (range: TAnalyticsRange) => useAnalytics<IAnalyticsAudience>("audience", range);
export const useAnalyticsFunnel = (range: TAnalyticsRange, paidOnly: boolean) =>
  useAnalytics<IAnalyticsFunnel>("funnel", range, paidOnly);
export const useAnalyticsEvents = (range: TAnalyticsRange, paidOnly: boolean) =>
  useAnalytics<{ items: IAnalyticsEvent[]; total: number }>("events", range, paidOnly);
export const useAnalyticsSources = (range: TAnalyticsRange, paidOnly: boolean) =>
  useAnalytics<{ sources: IAnalyticsSource[]; codes: { code: string; orders: number; tickets: number }[] }>(
    "sources",
    range,
    paidOnly,
  );
