import { getData } from "@/api";
import { IEventDetailsType } from "@/lib/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

interface IEventParams {
  q?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
  venueId?: string;
  userId?: string;
  categoryId?: string;
  status?: "UPCOMING" | "PAST";
  priceType?: "FREE" | "EXTERNAL_LINK" | "PAID";
  isTrending?: boolean;
  /** The signed-in person's saved events. */
  isFavorite?: boolean;
  /** One performer's events. */
  performerId?: string;
  /** One organiser's published events: a planner's page. */
  organizerId?: string;
  /** ISO country code, e.g. "NG". */
  countryCode?: string;
  city?: string;
  /** Admins only: include suspended events. */
  includeSuspended?: boolean;
  /** With userId (your own events): only the ones you've archived. */
  archived?: boolean;
}

type NormalizedEventsResponse = {
  data: IEventDetailsType[];
  pagination?: {
    nextPage?: number;
    page?: number;
    totalPages?: number;
  };
};

const normalizeEventsResponse = (payload: any): NormalizedEventsResponse => {
  if (Array.isArray(payload)) {
    return { data: payload };
  }

  if (!payload || typeof payload !== "object") {
    return { data: [] };
  }

  // Handles: { data: [...], meta: {...}, pagination: {...} }
  if (Array.isArray(payload.data)) {
    return {
      data: payload.data,
      pagination: payload.pagination || payload.meta,
    };
  }

  // Handles Axios-style or custom wrapper: { data: { data: [...] } }
  if (payload.data && typeof payload.data === "object") {
    const inner = payload.data;

    if (Array.isArray(inner.data)) {
      return {
        data: inner.data,
        pagination: inner.pagination || inner.meta || payload.pagination,
      };
    }

    if (Array.isArray(inner.events)) {
      return {
        data: inner.events,
        pagination: inner.pagination || inner.meta || payload.pagination,
      };
    }
  }

  // Handles: { events: [...] }
  if (Array.isArray(payload.events)) {
    return {
      data: payload.events,
      pagination: payload.pagination || payload.meta,
    };
  }

  return { data: [] };
};

const getEvents = async (
  page: number = 1,
  params: IEventParams = {},
): Promise<NormalizedEventsResponse> => {
  const urlParams = new URLSearchParams();

  urlParams.set("page", page.toString());
  urlParams.set("limit", params.limit?.toString() || "10");

  if (params.q) urlParams.set("q", params.q);
  if (params.startDate) urlParams.set("startDate", params.startDate);
  if (params.endDate) urlParams.set("endDate", params.endDate);
  if (params.venueId) urlParams.set("venueId", params.venueId);
  if (params.userId) urlParams.set("userId", params.userId);
  if (params.categoryId) urlParams.set("categoryId", params.categoryId);
  if (params.status) urlParams.set("status", params.status);
  if (params.priceType) urlParams.set("priceType", params.priceType);
  if (params.includeSuspended) urlParams.set("includeSuspended", "true");
  if (params.archived) urlParams.set("archived", "true");
  if (params.isFavorite) urlParams.set("isFavorite", "true");
  if (params.performerId) urlParams.set("performerId", params.performerId);
  if (params.organizerId) urlParams.set("organizerId", params.organizerId);
  if (params.countryCode) urlParams.set("countryCode", params.countryCode);
  if (params.city) urlParams.set("city", params.city);
  if (params.isTrending !== undefined) {
    urlParams.set("isTrending", params.isTrending.toString());
  }

  const url = `/events?${urlParams.toString()}`;

  const response = await getData<any>(url);

  const normalized = normalizeEventsResponse(response);


  return normalized;
};

export interface IUseEventsOptions {
  enabled?: boolean;
}

export const useEvents = (
  params?: IEventParams,
  options?: IUseEventsOptions,
) => {
  return useInfiniteQuery({
    queryKey: ["events", params],
    queryFn: ({ pageParam = 1 }) => getEvents(Number(pageParam), params ?? {}),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage?.pagination?.nextPage || undefined;
    },
    enabled: options?.enabled ?? true,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

const normalizeSingleEventResponse = (
  payload: any,
): IEventDetailsType | null => {
  if (!payload) return null;

  if (payload.id) return payload;

  if (payload.data?.id) return payload.data;

  if (payload.data?.data?.id) return payload.data.data;

  return null;
};

// A private ticket is only returned when its access code is sent along.
const getEvent = async (id: string, access?: string) => {
  const url = access
    ? `/event/${id}?${new URLSearchParams({ access }).toString()}`
    : `/event/${id}`;

  const response = await getData<any>(url);

  return normalizeSingleEventResponse(response);
};

export const useEvent = (id: string, access?: string) => {
  return useQuery({
    queryKey: access ? ["event", id, access] : ["event", id],
    queryFn: () => getEvent(id, access),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
