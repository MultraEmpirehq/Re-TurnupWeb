import { getData } from "@/api";
import { IVenueDetailsType } from "@/lib/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

interface IVenuesParam {
  q?: string;
  maxNoOfSeats?: string;
  minNoOfSeats?: string;
  country?: string;
  city?: string;
  state?: string;
}

const getVenues = async (page: number = 1, params?: IVenuesParam) => {
  const urlParams = new URLSearchParams();
  urlParams.set("page", page.toString());
  if (params?.q) urlParams.set("q", params.q);
  if (params?.maxNoOfSeats) urlParams.set("maxNoOfSeats", params.maxNoOfSeats);
  if (params?.minNoOfSeats) urlParams.set("minNoOfSeats", params.minNoOfSeats);
  if (params?.country) urlParams.set("country", params.country);
  if (params?.city) urlParams.set("city", params.city);
  if (params?.state) urlParams.set("state", params.state);
  const url = `/venues?${urlParams.toString()}`;
  const { data } = await getData<IVenueDetailsType[]>(url);
  return data;
};

export const useVenues = (params?: IVenuesParam) => {
  return useInfiniteQuery({
    queryKey: ["venues", ...Object.values(params || {})],
    queryFn: ({ pageParam }) => getVenues(pageParam, params),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextPage,
  });
};

const getVenue = async (id: string) => {
  const url = `/venue/${id}`;
  const { data } = await getData<IVenueDetailsType>(url);
  return data?.data;
};

export const useVenue = (id: string) => {
  return useQuery({
    queryKey: ["venue", id],
    queryFn: () => getVenue(id),
    enabled: !!id,
  });
};
