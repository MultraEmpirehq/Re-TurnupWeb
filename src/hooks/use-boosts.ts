import { getData, postData, putData } from "@/api";
import { IEventDetailsType, PriceDetailsType } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type TBoostPlacement = "HOME" | "EXPLORE" | "SEARCH";

export type TSponsoredEvent = IEventDetailsType & {
  sponsored: true;
  boostId: string;
};

/** Up to three boosted events for a placement and area, in a new order each time. */
export const useSponsored = (query: {
  placement: TBoostPlacement;
  countryCode?: string;
  city?: string;
  q?: string;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: [
      "sponsored",
      query.placement,
      query.countryCode,
      query.city,
      query.q,
    ],
    enabled: query.enabled ?? true,
    staleTime: 60_000,
    queryFn: async () => {
      const params = new URLSearchParams({ placement: query.placement });
      if (query.countryCode) params.set("countryCode", query.countryCode);
      if (query.city) params.set("city", query.city);
      if (query.q) params.set("q", query.q);
      return (
        (await getData<TSponsoredEvent[]>(`/boosts/sponsored?${params}`)).data
          ?.data ?? []
      );
    },
  });

/** Once per set shown: counts them as seen. Never throws. */
export const recordImpressions = (boostIds: string[]) => {
  if (!boostIds.length) return;
  void postData("/boosts/impressions", { boostIds }).catch(() => undefined);
};

export const recordClick = (boostId: string) => {
  void postData(`/boosts/${boostId}/click`, {}).catch(() => undefined);
};

export interface IBoostQuote {
  currency: string;
  startsAt: string;
  endsAt: string;
  days: number;
  shortened: boolean;
  area: "city" | "country";
  city: string | null;
  countryCode: string;
  lines: {
    placement: TBoostPlacement;
    label: string;
    perDay: PriceDetailsType;
    total: PriceDetailsType;
  }[];
  discount: PriceDetailsType;
  total: PriceDetailsType;
  eligible?: boolean;
  missing?: string[];
}

export type TBoostRequest = {
  eventId: string;
  placements: TBoostPlacement[];
  area: "city" | "country";
  days: number;
  startsAt?: string;
};

export interface IBoost {
  id: string;
  event: { id: string; name: string };
  placements: { placement: TBoostPlacement; label: string }[];
  area: { kind: "city" | "country"; name: string };
  startsAt: string;
  endsAt: string;
  days: number;
  amount: PriceDetailsType;
  refunded: PriceDetailsType;
  status: string;
  phase:
    | "awaiting_payment"
    | "in_review"
    | "scheduled"
    | "live"
    | "ended"
    | "paused"
    | "stopped"
    | "rejected"
    | "payment_failed";
  reviewReasons: string[];
  reviewNote: string | null;
  pausedReason: string | null;
  stats: {
    impressions: number;
    clicks: number;
    tickets: number;
    sales: PriceDetailsType;
  };
  organiser?: { id: string; name: string; email: string };
}

export const useBoostQuote = (request: TBoostRequest | null) =>
  useQuery({
    queryKey: ["boost-quote", request],
    enabled: !!request && request.placements.length > 0,
    placeholderData: (previous) => previous,
    queryFn: async () =>
      (
        await postData<TBoostRequest, IBoostQuote>(
          "/vendor/boosts/quote",
          request!,
        )
      ).data?.data ?? null,
    retry: false,
  });

export const useCreateBoost = () =>
  useMutation({
    mutationFn: async (request: TBoostRequest & { callbackUrl: string }) =>
      (
        await postData<
          typeof request,
          IBoostQuote & { boostId: string; url: string }
        >("/vendor/boosts", request)
      ).data?.data,
  });

export const useEventBoosts = (eventId?: string, enabled = true) =>
  useQuery({
    queryKey: ["boosts", eventId],
    enabled: !!eventId && enabled,
    queryFn: async () =>
      (await getData<IBoost[]>(`/vendor/boosts?eventId=${eventId}`)).data
        ?.data ?? [],
  });

/** One boost; asking also confirms a payment the webhook hasn't reported yet. */
export const fetchBoost = async (boostId: string) =>
  (await getData<IBoost>(`/vendor/boosts/${boostId}`)).data?.data ?? null;

export const useStopBoost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boostId: string) =>
      postData(`/vendor/boosts/${boostId}/stop`, {}),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["boosts"] }),
  });
};

/* ---------------------------------------------------------------- admin */

export const useAdminBoosts = (status?: string) =>
  useQuery({
    queryKey: ["admin-boosts", status ?? "all"],
    queryFn: async () =>
      (
        await getData<IBoost[]>(
          `/admin/boosts${status ? `?status=${status}` : ""}`,
        )
      ).data?.data ?? [],
  });

export const useAdminBoostActions = () => {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-boosts"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] });
  };
  const approve = useMutation({
    mutationFn: (id: string) => postData(`/admin/boosts/${id}/approve`, {}),
    onSuccess: refresh,
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      postData(`/admin/boosts/${id}/reject`, { reason }),
    onSuccess: refresh,
  });
  const stop = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      postData(`/admin/boosts/${id}/stop`, { reason }),
    onSuccess: refresh,
  });
  return { approve, reject, stop };
};

export type TBoostPrice = {
  placement: TBoostPlacement;
  label: string;
  currency: string;
  perDay: PriceDetailsType;
};

export const useBoostPrices = () =>
  useQuery({
    queryKey: ["boost-prices"],
    queryFn: async () =>
      (await getData<TBoostPrice[]>("/admin/boosts/prices")).data?.data ?? [],
  });

export const useSetBoostPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      placement: TBoostPlacement;
      currency: string;
      dailyPrice: number;
    }) => putData("/admin/boosts/prices", body),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["boost-prices"] }),
  });
};
