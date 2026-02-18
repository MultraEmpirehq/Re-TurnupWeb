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
}

const getEvents = async (page: number = 1, params: IEventParams) => {
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

  const url = `/events?${urlParams.toString()}`;
  const { data } = await getData<IEventDetailsType[]>(url);
  return data;
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
