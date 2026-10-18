import { getData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const REFUNDS_PAGE_SIZE = 20;

type TMoney = { amount: number; formatted: { withCurrency: string } };
type TName = {
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export type TRefundStatus = "PROCESSING" | "COMPLETED" | "FAILED";
export type TRefundKind = "ORDER" | "EVENT_CANCELLED" | "DISPUTE";

export interface IAdminRefund {
  id: string;
  kind: TRefundKind;
  status: TRefundStatus;
  reason: string;
  currency: string;
  ticketCount: number;
  cardAmount: TMoney;
  creditAmount: TMoney;
  feeKept: TMoney;
  organiserShare: TMoney;
  settlement: string;
  provider: string | null;
  providerMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  createdBy: TName | null;
  order: {
    id: string;
    reference: string | null;
    userDetails: TName;
    ticketDetails: {
      name: string;
      eventDetails: { id: string; name: string } | null;
    } | null;
  };
}

export interface ILookupOrder {
  id: string;
  reference: string | null;
  status: string;
  quantity: number;
  createdAt: string;
  buyer: TName;
  ticketName: string | null;
  event: { id: string; name: string; date: string } | null;
  provider: string | null;
  paidByCard: TMoney;
  paidWithCredit: TMoney;
  tickets: {
    id: string;
    code: string;
    status: string;
    attendeeName: string | null;
    refundedAt: string | null;
    /** The ticket type, e.g. "VIP" (an order can mix types). */
    ticketName?: string | null;
  }[];
  refunds: {
    id: string;
    status: TRefundStatus;
    ticketCount: number;
    cardAmount: TMoney;
    creditAmount: TMoney;
    createdAt: string;
  }[];
}

export interface IRefundPreview {
  orderId: string;
  reference: string | null;
  ticketCount: number;
  ticketIds: string[];
  toCard: TMoney;
  asCredit: TMoney;
  feeKept: TMoney;
  fromOrganiser: TMoney;
  organiserWasPaid: string;
}

export const useAdminRefunds = (filters: {
  page: number;
  status?: TRefundStatus;
  q?: string;
}) =>
  useQuery({
    queryKey: ["admin-refunds", filters],
    queryFn: async () => {
      const { data } = await getData<IAdminRefund[]>("/admin/refunds", {
        params: {
          page: filters.page,
          limit: REFUNDS_PAGE_SIZE,
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.q ? { q: filters.q } : {}),
        },
      });
      return { items: data?.data ?? [], total: data?.pagination?.total ?? 0 };
    },
    retry: 0,
  });

export const useOrderLookup = (q: string) =>
  useQuery({
    queryKey: ["admin-order-lookup", q],
    enabled: q.trim().length >= 3,
    queryFn: async () =>
      (await getData<ILookupOrder[]>("/admin/orders", { params: { q } })).data
        ?.data ?? [],
    retry: 0,
  });

export const useRefundPreview = (orderId: string | null, ticketIds: string[]) =>
  useQuery({
    queryKey: ["admin-refund-preview", orderId, ticketIds],
    enabled: !!orderId && ticketIds.length > 0,
    queryFn: async () =>
      (
        await getData<IRefundPreview>(
          `/admin/orders/${orderId}/refund-preview`,
          { params: { ticketIds: ticketIds.join(",") } },
        )
      ).data?.data ?? null,
    retry: 0,
  });

const useRefreshRefunds = () => {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [
      "admin-refunds",
      "admin-order-lookup",
      "admin-refund-preview",
      "admin-audit-log",
    ]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
};

export const useRefundOrder = () => {
  const refresh = useRefreshRefunds();
  return useMutation({
    mutationFn: async ({
      orderId,
      ticketIds,
      reason,
    }: {
      orderId: string;
      ticketIds: string[];
      reason: string;
    }) => postData(`/admin/orders/${orderId}/refunds`, { ticketIds, reason }),
    onSuccess: refresh,
  });
};

export const useMarkDisputed = () => {
  const refresh = useRefreshRefunds();
  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason: string;
    }) => postData(`/admin/orders/${orderId}/dispute`, { reason }),
    onSuccess: refresh,
  });
};

export const useRetryRefund = () => {
  const refresh = useRefreshRefunds();
  return useMutation({
    mutationFn: async (refundId: string) =>
      postData(`/admin/refunds/${refundId}/retry`, {}),
    onSuccess: refresh,
  });
};

export const useCancelEventWithRefunds = () => {
  const refresh = useRefreshRefunds();
  return useMutation({
    mutationFn: async ({
      eventId,
      reason,
    }: {
      eventId: string;
      reason: string;
    }) => postData(`/admin/events/${eventId}/cancel`, { reason }),
    onSuccess: refresh,
  });
};
