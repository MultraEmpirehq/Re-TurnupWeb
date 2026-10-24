import { getData, patchData, postData } from "@/api";
import { PriceDetailsType } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type TReadinessId =
  "cover" | "description" | "venue" | "tickets" | "lineup" | "deadline";

export interface IEventPromotion {
  eventId: string;
  ready: boolean;
  score: { done: number; total: number };
  checklist: {
    id: TReadinessId;
    label: string;
    done: boolean;
    optional?: boolean;
  }[];
  isUpcoming: boolean;
  labels: { sellingFast: boolean; almostGone: boolean; soldOut: boolean };
  /** What Turnupz sends for them: done, or when it will go. */
  automations: {
    key: string;
    kind: "followers" | "savers" | "holders";
    title: string;
    audience: number;
    status: "sent" | "scheduled";
    at: string;
  }[];
  sales: {
    total: number;
    lastWeek: number;
    capacity: number | null;
    left: number | null;
    /** Tickets from paid orders in the last 7 days, by where the buyer came from. */
    sources: {
      yourLink: number;
      attendeeShares: number;
      promoCodes: number;
      followers: number;
      turnupz: number;
    };
    promoCodes: { code: string; tickets: number }[];
    /** The event page, last 7 days. */
    views: number;
    visitors: number;
    /** Visitors who went on to pay, as a percentage. */
    conversion: number | null;
  };
  share: {
    ref: string | null;
    fromPrice: PriceDetailsType | null;
    city: string | null;
  };
}

/** Whether an event is ready to promote, how it's selling, and the share kit's details. */
export const useEventPromotion = (eventId?: string, enabled = true) =>
  useQuery({
    queryKey: ["event-promotion", eventId],
    enabled: !!eventId && enabled,
    queryFn: async () =>
      (await getData<IEventPromotion>(`/event/${eventId}/promotion`)).data
        ?.data ?? null,
  });

export interface IPromoCode {
  id: string;
  code: string;
  promoterName: string;
  event: { id: string; name: string } | null;
  discountLabel: string | null;
  discountPercent: number | null;
  maxUses: number | null;
  isActive: boolean;
  status: "live" | "paused" | "ended" | "scheduled" | "used_up";
  startsAt: string | null;
  endsAt: string | null;
  stats: {
    tickets: number;
    revenue: PriceDetailsType;
    discountGiven: PriceDetailsType;
  };
}

/** The organiser's codes that work for this event (its own, and ones for all events). */
export const usePromoCodes = (eventId?: string, enabled = true) =>
  useQuery({
    queryKey: ["promo-codes", eventId],
    enabled: !!eventId && enabled,
    queryFn: async () =>
      (await getData<IPromoCode[]>(`/vendor/promo-codes?eventId=${eventId}`))
        .data?.data ?? [],
  });

export type TNewPromoCode = {
  code: string;
  promoterName: string;
  eventId?: string;
  discountPercent?: number;
  discountAmount?: number;
  maxUses?: number;
  endsAt?: string;
};

export const usePromoCodeActions = () => {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    void queryClient.invalidateQueries({ queryKey: ["event-promotion"] });
  };
  const create = useMutation({
    mutationFn: (body: TNewPromoCode) =>
      postData<TNewPromoCode, IPromoCode>("/vendor/promo-codes", body),
    onSuccess: refresh,
  });
  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      patchData<{ isActive: boolean }, IPromoCode>(
        `/vendor/promo-codes/${id}`,
        { isActive },
      ),
    onSuccess: refresh,
  });
  return { create, setActive };
};
