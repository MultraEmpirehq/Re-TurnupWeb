import { deleteData, getData, patchData, postData } from "@/api";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** A post on the company blog (turnupz.com/news). */
export interface ICompanyPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  /** The whole post (on a post's page and in the admin editor). */
  body?: string;
  /** The start of it (on the list). */
  preview?: string;
  cover: string | null;
  coverId: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: string;
}

export type TCompanyPostInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  coverId?: string | null;
  published?: boolean;
};

export const useCompanyNews = () =>
  useInfiniteQuery({
    queryKey: ["company-news"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await getData<ICompanyPost[]>(`/news?page=${pageParam}&limit=12`);
      return { items: data?.data ?? [], pagination: data?.pagination };
    },
    getNextPageParam: (last) => last.pagination?.nextPage ?? undefined,
  });

export const useCompanyPost = (slug?: string) =>
  useQuery({
    queryKey: ["company-post", slug],
    enabled: !!slug,
    queryFn: async () => (await getData<ICompanyPost>(`/news/${slug}`)).data?.data ?? null,
    retry: false,
  });

const ADMIN_KEY = ["admin-company-news"];

export const useAdminCompanyNews = () =>
  useQuery({
    queryKey: ADMIN_KEY,
    queryFn: async () => (await getData<ICompanyPost[]>("/admin/news?limit=50")).data?.data ?? [],
  });

export const useSaveCompanyPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: TCompanyPostInput & { id?: string }) => {
      const { data } = id
        ? await patchData<TCompanyPostInput, ICompanyPost>(`/admin/news/${id}`, body)
        : await postData<TCompanyPostInput, ICompanyPost>("/admin/news", body);
      return data?.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
      void queryClient.invalidateQueries({ queryKey: ["company-news"] });
    },
  });
};

export const useDeleteCompanyPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteData(`/admin/news/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
      void queryClient.invalidateQueries({ queryKey: ["company-news"] });
    },
  });
};
