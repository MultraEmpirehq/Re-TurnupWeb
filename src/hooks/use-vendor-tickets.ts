import { deleteData, getData, postData } from "@/api";
import { PriceDetailsType } from "@/lib/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type BackendEntryStatus = "checked_in" | "not_checked_in";
export type BackendTransferStatus = "pending" | "claimed" | "cancelled" | string;
export type BackendScannerStatus = "invited" | "active" | "revoked" | "expired";
export type BackendScanStatus = "approved" | "denied" | "already_checked_in";

export interface VendorTicketLedgerApiRecord {
  ticketId: string;
  eventId: string;
  eventName: string;
  ticketCategory: string;
  purchaserName: string;
  purchaserEmail: string;
  currentHolderName: string;
  currentHolderEmail: string;
  price: PriceDetailsType | number;
  quantity: number;
  amount: PriceDetailsType | number;
  transferStatus: BackendTransferStatus;
  entryStatus: BackendEntryStatus;
  scannerEmail?: string;
  checkedInAt?: string;
  issueDate: string;
  eventDate?: string;
  eventDateTime?: string;
  venueName?: string;
  venueAddress?: string;
  ticketCode?: string;
  qrCodeValue?: string;
  barcodeValue?: string;
}

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

export const useVendorTicketLedger = ({
  eventId,
  page = 1,
  limit = 50,
}: VendorTicketQueryParams) => {
  return useQuery({
    queryKey: ["vendor-ticket-ledger", eventId ?? "all", page, limit],
    queryFn: async () => {
      const query = buildSearchParams({ eventId, page, limit });
      const response = await getData<VendorTicketLedgerApiRecord[]>(
        `/vendor/tickets/ledger?${query}`,
      );
      return {
        records: normalizeListResponse<VendorTicketLedgerApiRecord>(
          response.data.data,
        ),
        pagination: response.data.pagination,
      };
    },
    retry: 0,
  });
};

export const useVendorTicketAnalytics = ({
  eventId,
  from,
  to,
}: VendorTicketQueryParams) => {
  return useQuery({
    queryKey: ["vendor-ticket-analytics", eventId ?? "all", from ?? "", to ?? ""],
    queryFn: async () => {
      const query = buildSearchParams({ eventId, from, to });
      const response = await getData<VendorTicketAnalyticsApiResponse>(
        `/vendor/tickets/analytics?${query}`,
      );
      const payload = response.data.data;
      const rows = normalizeListResponse<VendorTicketAnalyticsApiRecord>(payload);

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
      const response = await postData<{ email: string }, ScannerAccessApiRecord>(
        `/event/${eventId}/scanners`,
        { email },
      );
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

export const useScanEventTicket = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await postData<{ code: string }, ScanTicketApiResponse>(
        `/event/${eventId}/scan`,
        { code },
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-ticket-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-ticket-analytics"] });
    },
  });
};

export type TInsightsDays = 7 | 30 | 90 | 365 | 0;

export interface IVendorInsights {
  period: { days: number; from: string; to: string; bucket: "day" | "week" | "month" };
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
