import { deleteData, getData, patchData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** A directory venue the organiser's events use. */
export interface VendorVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  capacity: number;
  image: string | null;
  upcomingEvents: number;
  pastEvents: number;
}

/** A venue the organiser suggested that isn't in the directory yet. */
export interface VenueSuggestion {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: "pending" | "rejected";
  reviewNote: string | null;
  createdAt: string;
  /** The event it was typed on, if any. */
  event: { id: string; name: string; date: string } | null;
}

export interface VendorVenues {
  venues: VendorVenue[];
  suggestions: VenueSuggestion[];
  counts: {
    venuesUsed: number;
    upcomingEvents: number;
    waitingForReview: number;
    needChanges: number;
  };
}

export type TVenueSuggestionInput = {
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
};

const KEY = ["vendor-venues"];

export const useVendorVenues = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await getData<VendorVenues>("/vendor/venues");
      return data?.data ?? null;
    },
  });

/** Suggests a new venue, or (with `id`) changes one and sends it for review again. */
export const useSaveVenueSuggestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: TVenueSuggestionInput & { id?: string }) =>
      id
        ? patchData<TVenueSuggestionInput, { id: string }>(`/vendor/venues/suggestions/${id}`, body)
        : postData<TVenueSuggestionInput, { id: string }>("/vendor/venues/suggestions", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
};

export const useWithdrawVenueSuggestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteData(`/vendor/venues/suggestions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
};

/** Directions to a venue in Google Maps. */
export const mapsLink = (venue: {
  name: string;
  address?: string | null;
  city?: string | null;
  latitude?: number;
  longitude?: number;
}) =>
  venue.latitude && venue.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [venue.name, venue.address, venue.city].filter(Boolean).join(", "),
      )}`;
