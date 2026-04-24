import { getData } from "@/api";
import { getDevMockEventById, getDevMockEvents } from "@/lib/dev-mock-events";
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
}

const applyEventFilters = (
  events: IEventDetailsType[],
  params: IEventParams,
): IEventDetailsType[] => {
  const now = new Date();

  return events.filter((event) => {
    const eventDate = event.date ? new Date(event.date) : null;
    const eventText = `${event.name ?? ""} ${event.description ?? ""} ${event.venue?.name ?? ""}`
      .toLowerCase()
      .trim();

    if (params.q && !eventText.includes(params.q.toLowerCase())) {
      return false;
    }

    if (params.venueId && event.venue?.id !== params.venueId) {
      return false;
    }

    if (params.startDate && eventDate && eventDate < new Date(params.startDate)) {
      return false;
    }

    if (params.endDate && eventDate && eventDate > new Date(params.endDate)) {
      return false;
    }

    if (params.status === "PAST" && eventDate && eventDate >= now) {
      return false;
    }

    if (params.status === "UPCOMING" && eventDate && eventDate < now) {
      return false;
    }

    return true;
  });
};

const getEvents = async (page: number = 1, params: IEventParams) => {
  const devMockEvents =
    process.env.NODE_ENV === "development"
      ? applyEventFilters(getDevMockEvents(), params)
      : [];

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
  if (params.isTrending)
    urlParams.set("isTrending", params.isTrending.toString());
  const url = `/events?${urlParams.toString()}`;
  try {
    const { data } = await getData<IEventDetailsType[]>(url);

    if (devMockEvents.length === 0) {
      return data;
    }

    return {
      ...data,
      data: [...devMockEvents, ...(data?.data ?? [])],
      pagination: {
        ...data.pagination,
        total: (data?.pagination?.total ?? 0) + devMockEvents.length,
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      return {
        data: devMockEvents,
        meta: {
          nextLink: null,
          previousLink: null,
          presentLink: null,
        },
        pagination: {
          presentPage: page,
          total: devMockEvents.length,
          limit: params.limit ?? devMockEvents.length,
          previousPage: null,
          nextPage: null,
          totalPage: 1,
        },
      };
    }
    throw error;
  }
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
    queryFn: ({ pageParam }) => getEvents(pageParam, params ?? {}),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextPage,
    enabled: options?.enabled ?? true,
  });
};

const getEvent = async (id: string) => {
  if (process.env.NODE_ENV === "development") {
    const mockEvent = getDevMockEventById(id);
    if (mockEvent) {
      return mockEvent;
    }
  }

  const url = `/event/${id}`;
  const { data } = await getData<IEventDetailsType>(url);
  return data?.data;
};

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id),
    enabled: !!id,
  });
};
