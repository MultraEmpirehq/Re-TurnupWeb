import { deleteData, getData, patchData, postData } from "@/api";
import { PriceDetailsType } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type BackendEntryStatus = "checked_in" | "not_checked_in";
export type BackendTransferStatus =
  "pending" | "claimed" | "cancelled" | string;
export type BackendScannerStatus = "invited" | "active" | "revoked" | "expired";
export type BackendScanStatus = "approved" | "denied" | "already_checked_in";

export interface VendorTicketAnalyticsApiRecord {
  eventId?: string;
  eventName?: string;
  event?: string;
  ticketCategory?: string;
  category?: string;
  purchased?: number;
  totalPurchased?: number;
  attended?: number;
  totalAttended?: number;
  transferred?: number;
  totalTransferred?: number;
  remaining?: number;
  totalRemaining?: number;
  revenue?: PriceDetailsType | number;
}

export interface VendorTicketRevenueByCurrency {
  currencyCode?: string;
  amount?: number;
  revenue?: PriceDetailsType | number;
  formatted?: PriceDetailsType["formatted"];
  currency?: PriceDetailsType["currency"];
}

export interface VendorTicketAnalyticsApiResponse {
  rows: VendorTicketAnalyticsApiRecord[];
  totalPurchased?: number;
  totalAttended?: number;
  totalTransferred?: number;
  totalRemaining?: number;
  revenue?: PriceDetailsType | number;
  revenueByCurrency?: VendorTicketRevenueByCurrency[];
  groupedByEvent?: VendorTicketAnalyticsApiRecord[];
  groupedByTicketCategory?: VendorTicketAnalyticsApiRecord[];
}

export interface ScannerAccessApiRecord {
  id: string;
  eventId: string;
  email: string;
  userId?: string;
  invitedByVendorId?: string;
  status: BackendScannerStatus;
  expiresAt: string;
  createdAt: string;
}

export interface ScanTicketApiResponse {
  status: BackendScanStatus;
  message: string;
  ticketId?: string;
  eventId: string;
  attendeeName?: string;
  attendeeEmail?: string;
  ticketCategory?: string;
  checkedInAt?: string;
  scannerEmail?: string;
}

interface VendorTicketQueryParams {
  eventId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

const buildSearchParams = (
  params: Record<string, string | number | undefined>,
) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
};

const normalizeListResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    "rows" in payload &&
    Array.isArray((payload as { rows?: unknown }).rows)
  ) {
    return (payload as { rows: T[] }).rows;
  }
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }
  return [];
};

export const useVendorTicketAnalytics = ({
  eventId,
  from,
  to,
}: VendorTicketQueryParams) => {
  return useQuery({
    queryKey: [
      "vendor-ticket-analytics",
      eventId ?? "all",
      from ?? "",
      to ?? "",
    ],
    queryFn: async () => {
      const query = buildSearchParams({ eventId, from, to });
      const response = await getData<VendorTicketAnalyticsApiResponse>(
        `/vendor/tickets/analytics?${query}`,
      );
      const payload = response.data.data;
      const rows =
        normalizeListResponse<VendorTicketAnalyticsApiRecord>(payload);

      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        return {
          rows,
          totalPurchased: payload.totalPurchased,
          totalAttended: payload.totalAttended,
          totalTransferred: payload.totalTransferred,
          totalRemaining: payload.totalRemaining,
          revenue: payload.revenue,
          revenueByCurrency: payload.revenueByCurrency ?? [],
          groupedByEvent: payload.groupedByEvent ?? [],
          groupedByTicketCategory: payload.groupedByTicketCategory ?? [],
        } satisfies VendorTicketAnalyticsApiResponse;
      }

      return { rows } satisfies VendorTicketAnalyticsApiResponse;
    },
    retry: 0,
  });
};

export const useEventScanners = (eventId?: string) => {
  return useQuery({
    queryKey: ["event-scanners", eventId],
    queryFn: async () => {
      const response = await getData<ScannerAccessApiRecord[]>(
        `/event/${eventId}/scanners`,
      );
      return normalizeListResponse<ScannerAccessApiRecord>(response.data.data);
    },
    enabled: !!eventId,
    retry: 0,
  });
};

export const useAddEventScanner = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await postData<
        { email: string },
        ScannerAccessApiRecord
      >(`/event/${eventId}/scanners`, { email });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-scanners", eventId] });
    },
  });
};

export const useRevokeEventScanner = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scannerId: string) => {
      await deleteData(`/event/${eventId}/scanners/${scannerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-scanners", eventId] });
    },
  });
};

export type TInsightsDays = 7 | 30 | 90 | 365 | 0;

export interface IVendorInsights {
  period: {
    days: number;
    from: string;
    to: string;
    bucket: "day" | "week" | "month";
  };
  /** Every currency the vendor's events are priced in. */
  currencies: string[];
  currency: string | null;
  summary: {
    ticketsSold: number;
    ticketsSoldChange: number | null;
    buyers: number;
    buyersChange: number | null;
    /** One entry per currency; money is never added across currencies. */
    revenue: { code: string; total: PriceDetailsType; change: number | null }[];
    checkInRate: number | null;
    checkedIn: number;
    checkInBase: number;
    events: number;
    upcomingEvents: number;
  };
  series: { start: string; tickets: number; revenue: Record<string, number> }[];
  events: {
    id: string;
    name: string;
    date: string;
    endDate: string | null;
    status: string;
    currency: string;
    isPast: boolean;
    hasStarted: boolean;
    capacity: number;
    sold: number;
    soldInPeriod: number;
    sellThrough: number | null;
    revenue: PriceDetailsType;
    checkedIn: number;
  }[];
  topTicketTypes: {
    id: string;
    name: string;
    eventId: string;
    eventName: string;
    sold: number;
    revenue: PriceDetailsType;
  }[];
}

/** The analytics page: a period's sales, compared with the period before, and every event. */
export const useVendorInsights = (days: TInsightsDays, currency?: string) =>
  useQuery({
    queryKey: ["vendor-insights", days, currency ?? "ALL"],
    queryFn: async () => {
      const query = buildSearchParams({ days, currency });
      const { data } = await getData<IVendorInsights>(
        `/vendor/tickets/insights?${query}`,
      );
      return data?.data ?? null;
    },
    placeholderData: (previous) => previous,
  });

export type TLedgerStatus =
  "checked_in" | "not_checked_in" | "transferred" | "refunded" | "pending";

export type TLedgerFilters = {
  eventId?: string;
  ticketTypeId?: string;
  q?: string;
  status?: TLedgerStatus;
  /** "checked_in" puts the latest check-ins first. */
  sort?: TLedgerSort;
};

export type TLedgerSort = "newest" | "oldest" | "checked_in";

export interface ILedgerRecord {
  id: string;
  ticketCode: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  ticketTypeId: string;
  ticketType: string;
  holderName: string;
  holderEmail: string;
  /** Someone else bought it for them. */
  buyerName: string | null;
  buyerEmail: string | null;
  venue: { name: string | null; address: string | null } | null;
  orderId: string | null;
  orderReference: string | null;
  price: PriceDetailsType;
  boughtAt: string;
  status: Exclude<TLedgerStatus, "transferred"> | "declined";
  statusLabel: string;
  refundedAt: string | null;
  checkedInAt: string | null;
  scannerEmail: string | null;
  /** Multi-day events: days it covers and days it's been let in on. */
  days: { covered: number; checkedIn: number } | null;
  transfer: {
    status: string;
    to: string | null;
    toEmail: string | null;
    at: string;
  } | null;
}

export type TLedgerTicketTypeBreakdown = {
  id: string;
  name: string;
  sold: number;
  /** Null when the organiser didn't cap it. */
  capacity: number | null;
  left: number | null;
  checkedIn: number;
  transferred: number;
  revenue: PriceDetailsType;
};

export type TLedgerSummary = {
  all: number;
  checkedIn: number;
  notCheckedIn: number;
  transferred: number;
  refunded: number;
  pending: number;
  /** Only when one event is picked. */
  capacity: { sold: number; total: number | null; left: number | null } | null;
  byTicketType: TLedgerTicketTypeBreakdown[] | null;
};

/** One page of the ledger, filtered on the server. */
export const useVendorLedger = (
  filters: TLedgerFilters,
  page: number,
  limit = 25,
) =>
  useQuery({
    queryKey: ["vendor-ledger", filters, page, limit],
    queryFn: async () => {
      const query = buildSearchParams({ ...filters, page, limit });
      const { data } = await getData<ILedgerRecord[]>(
        `/vendor/tickets/ledger?${query}`,
      );
      return {
        records: data?.data ?? [],
        total: (data?.pagination as { total?: number } | undefined)?.total ?? 0,
      };
    },
    placeholderData: (previous) => previous,
  });

/** How many tickets are in each state, for the same filters (status aside). */
export const useVendorLedgerSummary = (
  filters: Omit<TLedgerFilters, "status" | "sort">,
) =>
  useQuery({
    queryKey: ["vendor-ledger-summary", filters],
    queryFn: async () => {
      const { data } = await getData<TLedgerSummary>(
        `/vendor/tickets/ledger/summary?${buildSearchParams(filters)}`,
      );
      return data?.data ?? null;
    },
    placeholderData: (previous) => previous,
  });

/** Bookings across every event still waiting on the organiser, for the nav badge. */
export const usePendingApprovalCount = (enabled = true) =>
  useQuery({
    queryKey: ["vendor-ledger-summary", {}],
    queryFn: async () => {
      const { data } = await getData<TLedgerSummary>(
        "/vendor/tickets/ledger/summary",
      );
      return data?.data ?? null;
    },
    select: (summary) => summary?.pending ?? 0,
    enabled,
    refetchInterval: 60_000,
  }).data ?? 0;

/** Lets a booking that needs approval in, or turns it down. */
export const useReviewRegistration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      ticketId,
      status,
    }: {
      eventId: string;
      ticketId: string;
      status: "confirmed" | "rejected";
    }) =>
      patchData<{ status: "confirmed" | "rejected" }, unknown>(
        `/event/${eventId}/registrations/${ticketId}/review`,
        { status },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vendor-ledger"] });
      void queryClient.invalidateQueries({
        queryKey: ["vendor-ledger-summary"],
      });
    },
  });
};

/** Downloads the filtered ledger as a CSV; says whether it was cut short. */
export const downloadLedgerCsv = async (filters: TLedgerFilters) => {
  const response = await getData<Blob>(
    `/vendor/tickets/ledger/export?${buildSearchParams(filters)}`,
    { responseType: "blob" },
  );
  const disposition = String(response.headers["content-disposition"] ?? "");
  const filename =
    /filename="([^"]+)"/.exec(disposition)?.[1] ?? "turnupz-tickets.csv";
  const url = URL.createObjectURL(response.data as unknown as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return { truncated: response.headers["x-export-truncated"] === "true" };
};
