import { getData, patchData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const CATALOGUE_PAGE_SIZE = 20;

export type TCatalogueStatus = "PENDING" | "APPROVED" | "REJECTED";

type TCreator = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  username: string | null;
};

export interface IPerformerForReview {
  id: string;
  name: string;
  type: string;
  bio: string | null;
  country: string | null;
  instagram: string | null;
  twitter: string | null;
  website: string | null;
  image: string | null;
  reviewStatus: TCatalogueStatus;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  eventsCount: number;
  creatorDetails: TCreator | null;
}

export interface IVenueSuggestion {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: TCatalogueStatus;
  reviewNote: string | null;
  createdAt: string;
  creator: TCreator;
  event: { id: string; name: string; date: string; status: string } | null;
  venue: { id: string; name: string; address: string } | null;
}

/** A category an organiser typed on an event, waiting to be listed. */
export interface ICategoryForReview {
  id: string;
  name: string;
  reviewStatus: TCatalogueStatus;
  createdAt: string;
  creatorDetails: TCreator | null;
  eventsCount: number;
  /** A few of the events using it, newest first. */
  events: { id: string; name: string; date: string; status: string }[];
}

const pageOf = async <T>(
  url: string,
  status: TCatalogueStatus,
  page: number,
) => {
  const { data } = await getData<T[]>(url, {
    params: { status, page, limit: CATALOGUE_PAGE_SIZE },
  });
  return { items: data?.data ?? [], total: data?.pagination?.total ?? 0 };
};

export const useCatalogueReviewCounts = (enabled = true) =>
  useQuery({
    queryKey: ["catalogue-reviews", "counts"],
    enabled,
    queryFn: async () =>
      (
        await getData<{ performers: number; venues: number; categories: number }>(
          "/admin/catalogue-reviews/counts",
        )
      ).data?.data ?? { performers: 0, venues: 0, categories: 0 },
    refetchInterval: 60_000,
    retry: 0,
  });

export const usePerformersForReview = (
  status: TCatalogueStatus,
  page: number,
) =>
  useQuery({
    queryKey: ["catalogue-reviews", "performers", status, page],
    queryFn: () =>
      pageOf<IPerformerForReview>(
        "/admin/catalogue-reviews/performers",
        status,
        page,
      ),
    retry: 0,
  });

export const useVenueSuggestions = (status: TCatalogueStatus, page: number) =>
  useQuery({
    queryKey: ["catalogue-reviews", "venues", status, page],
    queryFn: () =>
      pageOf<IVenueSuggestion>("/admin/catalogue-reviews/venues", status, page),
    retry: 0,
  });

export const useCategoriesForReview = (
  status: TCatalogueStatus,
  page: number,
) =>
  useQuery({
    queryKey: ["catalogue-reviews", "categories", status, page],
    queryFn: () =>
      pageOf<ICategoryForReview>(
        "/admin/catalogue-reviews/categories",
        status,
        page,
      ),
    retry: 0,
  });

const useRefresh = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["catalogue-reviews"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-audit-log"] });
  };
};

export const useReviewPerformer = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      note,
    }: {
      id: string;
      decision: "approve" | "reject";
      note?: string;
    }) =>
      patchData(`/admin/catalogue-reviews/performers/${id}`, {
        decision,
        ...(note ? { note } : {}),
      }),
    onSuccess: refresh,
  });
};

export const useApproveVenueSuggestion = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, venueId }: { id: string; venueId: string }) =>
      postData(`/admin/catalogue-reviews/venues/${id}/approve`, { venueId }),
    onSuccess: refresh,
  });
};

export const useDismissVenueSuggestion = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      postData(`/admin/catalogue-reviews/venues/${id}/dismiss`, {
        ...(note ? { note } : {}),
      }),
    onSuccess: refresh,
  });
};

export const useApproveCategory = () => {
  const refresh = useRefresh();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      postData(`/admin/catalogue-reviews/categories/${id}/approve`, {}),
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

/** Moves a typed category's events to a listed one and removes it. */
export const useMergeCategory = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string }) =>
      postData(`/admin/catalogue-reviews/categories/${id}/merge`, {
        categoryId,
      }),
    onSuccess: refresh,
  });
};
