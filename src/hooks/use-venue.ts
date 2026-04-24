import { getData } from "@/api";
import {
  getCustomVenues,
  subscribeToCustomOptions,
} from "@/lib/custom-event-options";
import { IVenueDetailsType } from "@/lib/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface IVenuesParam {
  q?: string;
  maxNoOfSeats?: string;
  minNoOfSeats?: string;
  country?: string;
  city?: string;
  state?: string;
}

const mockVenues: IVenueDetailsType[] = [
  {
    id: "mock-venue-downtown-hall",
    name: "Downtown Hall",
    address: "101 Jasper Ave, Edmonton, AB",
    rating: 4.8,
    totalAvailableSeat: 1200,
    images: [],
  },
  {
    id: "mock-venue-riverfront-arena",
    name: "Riverfront Arena",
    address: "250 Riverfront Dr, Edmonton, AB",
    rating: 4.7,
    totalAvailableSeat: 2400,
    images: [],
  },
  {
    id: "mock-venue-skyline-rooftop",
    name: "Skyline Rooftop",
    address: "88 Whyte Ave, Edmonton, AB",
    rating: 4.5,
    totalAvailableSeat: 300,
    images: [],
  },
  {
    id: "mock-venue-warehouse-loft",
    name: "Warehouse Loft",
    address: "19 104 St NW, Edmonton, AB",
    rating: 4.4,
    totalAvailableSeat: 450,
    images: [],
  },
];

const buildMockVenueResponse = (
  page: number,
  params?: IVenuesParam,
): TApiCallResponseType<IVenueDetailsType[]> => {
  const query = params?.q?.trim().toLowerCase();
  const filteredVenues = query
    ? mockVenues.filter(
        (venue) =>
          venue.name.toLowerCase().includes(query) ||
          venue.address.toLowerCase().includes(query),
      )
    : mockVenues;

  return {
    data: filteredVenues,
    meta: {
      nextLink: null,
      previousLink: null,
      presentLink: null,
    },
    pagination: {
      presentPage: page,
      total: filteredVenues.length,
      limit: filteredVenues.length,
      previousPage: null,
      nextPage: null,
      totalPage: 1,
    },
  };
};

const getVenues = async (page: number = 1, params?: IVenuesParam) => {
  if (process.env.NODE_ENV === "development") {
    return buildMockVenueResponse(page, params);
  }

  const urlParams = new URLSearchParams();
  urlParams.set("page", page.toString());
  if (params?.q) urlParams.set("q", params.q);
  if (params?.maxNoOfSeats) urlParams.set("maxNoOfSeats", params.maxNoOfSeats);
  if (params?.minNoOfSeats) urlParams.set("minNoOfSeats", params.minNoOfSeats);
  if (params?.country) urlParams.set("country", params.country);
  if (params?.city) urlParams.set("city", params.city);
  if (params?.state) urlParams.set("state", params.state);
  const url = `/venues?${urlParams.toString()}`;
  try {
    const { data } = await getData<IVenueDetailsType[]>(url);
    return data;
  } catch (error) {
    throw error;
  }
};

export const useVenues = (params?: IVenuesParam) => {
  const [customVenues, setCustomVenues] = useState<IVenueDetailsType[]>([]);

  useEffect(() => {
    const sync = () => setCustomVenues(getCustomVenues());
    sync();
    return subscribeToCustomOptions(sync);
  }, []);

  const query = useInfiniteQuery({
    queryKey: ["venues", ...Object.values(params || {})],
    queryFn: ({ pageParam }) => getVenues(pageParam, params),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextPage,
    retry: 0,
  });
  const filteredCustomVenues = params?.q?.trim()
    ? customVenues.filter(
        (venue) =>
          venue.name.toLowerCase().includes(params.q!.trim().toLowerCase()) ||
          venue.address.toLowerCase().includes(params.q!.trim().toLowerCase()),
      )
    : customVenues;

  if (!query.data) {
    return query;
  }

  const [firstPage, ...restPages] = query.data.pages;
  const mergedFirstPage = {
    ...firstPage,
    data: [...filteredCustomVenues, ...(firstPage?.data ?? [])].filter(
      (venue, index, list) =>
        list.findIndex(
          (item) => item.name.toLowerCase() === venue.name.toLowerCase(),
        ) === index,
    ),
  };

  return {
    ...query,
    data: {
      ...query.data,
      pages: [mergedFirstPage, ...restPages],
    },
  };
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
