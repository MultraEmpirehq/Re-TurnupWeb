import { useEffect, useState } from "react";
import { deleteData, getData, patchData, postData } from "@/api";
import {
  IEventLocation,
  IFollowedItem,
  IPerformer,
  IPlanner,
  TFollowTargetType,
  TPerformerType,
} from "@/lib/types";
import useUserStore from "@/stores/user-store";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * Performers, planners, places, follows and hidden events: the discovery data the
 * mobile app already uses, on the same endpoints.
 */

export const PERFORMER_TYPE_LABELS: Record<TPerformerType, string> = {
  ARTIST: "Artist",
  DJ: "DJ",
  BAND: "Band",
  SPEAKER: "Speaker",
  COMEDIAN: "Comedian",
  HOST: "Host",
  ATHLETE: "Athlete",
  CHEF: "Chef",
  OTHER: "Performer",
};

export const CHART_REGIONS = [
  { value: "global", label: "Global" },
  { value: "africa", label: "Africa" },
  { value: "europe", label: "Europe" },
  { value: "americas", label: "Americas" },
  { value: "asia", label: "Asia" },
] as const;

export type TChartRegion = (typeof CHART_REGIONS)[number]["value"];

const PAGE_SIZE = 20;

// Performers ------------------------------------------------------------------

export const usePerformers = (
  {
    q = "",
    type,
    forLineup,
    mine,
    limit = PAGE_SIZE,
  }: {
    q?: string;
    type?: TPerformerType;
    /** Also find performers not verified yet, so nobody adds them twice. */
    forLineup?: boolean;
    /** Only the ones the signed-in organiser added, whatever their review. */
    mine?: boolean;
    limit?: number;
  } = {},
  enabled = true,
) =>
  useInfiniteQuery({
    queryKey: [
      "performers",
      q,
      type ?? "all",
      forLineup ? "lineup" : mine ? "mine" : "public",
      limit,
    ],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(limit),
      });
      if (q.trim()) params.set("q", q.trim());
      if (type) params.set("type", type);
      if (forLineup) params.set("forLineup", "true");
      if (mine) params.set("mine", "true");
      const { data } = await getData<IPerformer[]>(`/performers?${params}`);
      return { performers: data?.data ?? [], pagination: data?.pagination };
    },
    getNextPageParam: (lastPage) => lastPage.pagination?.nextPage ?? undefined,
    enabled,
    retry: false,
  });

export const usePerformer = (id?: string) =>
  useQuery({
    queryKey: ["performer", id],
    queryFn: async () => {
      const { data } = await getData<IPerformer>(`/performers/${id}`);
      return data?.data;
    },
    enabled: !!id,
    retry: false,
  });

/** Performers ranked by tickets sold for their events over the last year. */
export const usePerformerChart = (region: TChartRegion, limit = 20) =>
  useQuery({
    queryKey: ["performer-chart", region, limit],
    queryFn: async () => {
      const { data } = await getData<{
        region: TChartRegion;
        performers: IPerformer[];
      }>(`/performers/charts?region=${region}&limit=${limit}`);
      return data?.data?.performers ?? [];
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

export type TPerformerInput = {
  name: string;
  type?: TPerformerType;
  bio?: string;
  imageId?: string;
  countryCode?: string;
  country?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
};

const usePerformerMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<IPerformer | undefined>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (performer) => {
      queryClient.invalidateQueries({ queryKey: ["performers"] });
      queryClient.invalidateQueries({ queryKey: ["performer-chart"] });
      if (performer?.id) {
        queryClient.invalidateQueries({
          queryKey: ["performer", performer.id],
        });
      }
    },
  });
};

export const useCreatePerformer = () =>
  usePerformerMutation(async (body: TPerformerInput) => {
    const { data } = await postData<TPerformerInput, IPerformer>(
      "/performers",
      body,
    );
    return data?.data;
  });

export const useUpdatePerformer = () =>
  usePerformerMutation(
    async ({ id, ...body }: Partial<TPerformerInput> & { id: string }) => {
      const { data } = await patchData<Partial<TPerformerInput>, IPerformer>(
        `/performers/${id}`,
        body,
      );
      return data?.data;
    },
  );

export const useDeletePerformer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteData(`/performers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performers"] });
      queryClient.invalidateQueries({ queryKey: ["performer-chart"] });
    },
  });
};

// Planners and places ---------------------------------------------------------

/** Organisers with something coming up, busiest first. */
export const usePlanners = (q = "", limit = PAGE_SIZE) =>
  useQuery({
    queryKey: ["planners", q, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (q.trim()) params.set("q", q.trim());
      const { data } = await getData<IPlanner[]>(`/events/planners?${params}`);
      return data?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

/** Countries (and their cities) with upcoming events, busiest first. */
export const useEventLocations = () =>
  useQuery({
    queryKey: ["event-locations"],
    queryFn: async () => {
      const { data } = await getData<IEventLocation[]>("/events/locations");
      return data?.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

// Follows ---------------------------------------------------------------------

const useIsSignedIn = () => !!useUserStore((state) => state.userDetails);

export const useFollows = () => {
  const isSignedIn = useIsSignedIn();
  return useQuery({
    queryKey: ["follows"],
    queryFn: async () => {
      const { data } = await getData<IFollowedItem[]>("/follows");
      return data?.data ?? [];
    },
    enabled: isSignedIn,
    retry: false,
  });
};

export const useToggleFollow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: {
      targetType: TFollowTargetType;
      targetId: string;
    }) => {
      const { data } = await postData<typeof target, { isFollowing: boolean }>(
        "/follows",
        target,
      );
      return !!data?.data?.isFollowing;
    },
    onSuccess: (isFollowing, target) => {
      // Show an unfollow straight away; the list refetches names and pictures.
      if (!isFollowing) {
        queryClient.setQueryData<IFollowedItem[]>(["follows"], (current = []) =>
          current.filter(
            (item) =>
              !(
                item.targetType === target.targetType &&
                item.targetId === target.targetId
              ),
          ),
        );
      }
      queryClient.invalidateQueries({ queryKey: ["follows"] });
      // Follower numbers and lists on profiles.
      queryClient.invalidateQueries({ queryKey: ["person"] });
    },
  });
};

// Hidden events ---------------------------------------------------------------

export const useHiddenEventIds = () => {
  const isSignedIn = useIsSignedIn();
  return useQuery({
    queryKey: ["hidden-events"],
    queryFn: async () => {
      const { data } = await getData<string[] | { eventId: string }[]>(
        "/events/hidden",
      );
      return (data?.data ?? []).map((item) =>
        typeof item === "string" ? item : item.eventId,
      );
    },
    enabled: isSignedIn,
    retry: false,
  });
};

/** Hides an event from your listings, or shows it again. */
export const useToggleHiddenEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await postData<undefined, { isHidden: boolean }>(
        `/events/hidden/${eventId}`,
      );
      return !!data?.data?.isHidden;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hidden-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

/**
 * The chart for a country's part of the world ("Top performers in Africa"), as
 * the app shows it; the world's chart when there's no country.
 */
export const usePerformerChartFor = (
  countryCode?: string,
  limit = 12,
  enabled = true,
) =>
  useQuery({
    enabled,
    queryKey: ["performer-chart-for", countryCode ?? "", limit],
    queryFn: async () => {
      const get = (params: string) =>
        getData<{ region: TChartRegion; performers: IPerformer[] }>(
          `/performers/charts?${params}&limit=${limit}`,
        );
      const { data } = countryCode
        ? await get(`countryCode=${countryCode}`).catch(() =>
            get("region=global"),
          )
        : await get("region=global");
      return {
        region: data?.data?.region ?? "global",
        performers: data?.data?.performers ?? [],
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

/**
 * Asks the database whether a performer name is taken, matching the way adding
 * does (capitals, spaces, punctuation and accents ignored; verified or not).
 * `null` while it can't tell, so nothing is blocked on an older api.
 */
export const usePerformerNameCheck = (name: string, enabled = true) => {
  const [debounced, setDebounced] = useState(name);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(name.trim()), 300);
    return () => clearTimeout(timer);
  }, [name]);
  const query = useQuery({
    queryKey: ["performer-name-check", debounced],
    enabled: enabled && debounced.length > 0,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await getData<{
        available: boolean;
        performer: IPerformer | null;
      }>(`/performers/name-check?name=${encodeURIComponent(debounced)}`);
      return data?.data ?? null;
    },
  });
  const settled = debounced === name.trim() && !query.isFetching;
  return {
    checking: enabled && !!name.trim() && !settled,
    taken: settled && query.data ? !query.data.available : false,
    existing: settled ? (query.data?.performer ?? null) : null,
  };
};
