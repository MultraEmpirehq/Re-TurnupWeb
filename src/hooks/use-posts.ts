import { deleteData, getData, patchData, postData } from "@/api";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadHighlightFiles } from "./use-event-highlights";

/** Mirrors the backend's limits (posts.rules.ts). */
export const POST_LIMITS = { media: 10, caption: 500, clipSeconds: 30 } as const;

export interface IPostMedia {
  id: string;
  url: string;
  type: "image" | "video";
  durationSeconds: number | null;
}

export interface IPost {
  id: string;
  caption: string | null;
  createdAt: string;
  author: { id: string; name: string; username: string | null; image: string | null };
  event: { id: string; name: string } | null;
  showName: boolean;
  media: IPostMedia[];
  mine: boolean;
  /** Shown to the author and admins: taken down, and why. */
  removed: { at: string; reason: string | null; byTeam: boolean } | null;
  /** The author's own: the organiser took it off the event page. */
  hiddenFromEvent?: boolean;
  /** Admins only. */
  reports?: number;
  likes: number;
  comments: number;
  likedByMe: boolean;
  /** People tagged in it. */
  tags: { id: string; name: string; username: string | null }[];
  /** You're tagged in it: whether you hid it from your Tagged tab. */
  myTag: { hidden: boolean } | null;
}

/** "with Ada", "with Ada and Chidi", "with Ada and 2 others". */
export const taggedLine = (tags: IPost["tags"]) =>
  !tags.length
    ? ""
    : tags.length === 1
      ? `with ${tags[0].name}`
      : tags.length === 2
        ? `with ${tags[0].name} and ${tags[1].name}`
        : `with ${tags[0].name} and ${tags.length - 1} others`;

export interface IPostComment {
  id: string;
  parentId: string | null;
  /** null once removed. */
  body: string | null;
  removed: boolean;
  createdAt: string;
  author: { id: string; name: string; username: string | null; image: string | null };
  mine: boolean;
  byPostAuthor: boolean;
  canRemove: boolean;
}

interface IPostsPage {
  locked: boolean;
  total: number;
  items: IPost[];
  nextCursor: string | null;
}

const profileKey = (username?: string | null, which: "posts" | "tagged" = "posts") =>
  which === "posts" ? ["posts", "user", username] : ["posts", "user", username, "tagged"];

/**
 * Someone's posts, or the posts they're tagged in, newest first (locked when
 * their profile is private to you).
 */
export const useProfilePosts = (username?: string | null, which: "posts" | "tagged" = "posts") =>
  useInfiniteQuery({
    queryKey: profileKey(username, which),
    enabled: !!username,
    initialPageParam: "",
    queryFn: async ({ pageParam }) =>
      (
        await getData<IPostsPage>(
          `/posts/user/${encodeURIComponent(username!)}${which === "tagged" ? "/tagged" : ""}${pageParam ? `?cursor=${pageParam}` : ""}`,
        )
      ).data?.data ?? { locked: false, total: 0, items: [], nextCursor: null },
    getNextPageParam: (last) => last.nextCursor || undefined,
  });

/**
 * Post photos and clips: each file is uploaded first. With an event, it also
 * shows in that event's highlights.
 */
export const useCreatePost = (username?: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      files: File[];
      caption: string;
      eventId?: string;
      showName: boolean;
      consent: boolean;
      /** People tagged in it (who follow you back). */
      tagUserIds?: string[];
    }) =>
      postData("/posts", {
        items: await uploadHighlightFiles(body.files),
        caption: body.caption.trim() || undefined,
        ...(body.eventId ? { eventId: body.eventId, showName: body.showName, consent: body.consent } : {}),
        ...(body.tagUserIds?.length ? { tagUserIds: body.tagUserIds } : {}),
      }),
    onSuccess: (_, body) => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (body.eventId) void queryClient.invalidateQueries({ queryKey: ["event-highlights", body.eventId] });
    },
  });
};

export const useDeletePost = (username?: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteData(`/posts/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
};

/** For a post you're tagged in: hide it from your Tagged tab (or show it again), or take yourself off it. */
export const useMyTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, action }: { postId: string; action: "hide" | "show" | "remove" }) =>
      action === "remove"
        ? deleteData(`/posts/${postId}/tags/me`)
        : patchData(`/posts/${postId}/tags/me`, { hidden: action === "hide" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
};

/** A circle above Explore: someone (or you) who posted lately. */
export interface IPostCircle {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  /** Posts in the last week. */
  posts: number;
  latestAt: string | null;
  /** Posted in the last day: a blue ring. */
  fresh: boolean;
}

/** You, then the people you follow who posted in the last week, most recent first. */
export const usePostCircles = (enabled: boolean) =>
  useQuery({
    queryKey: ["posts", "circles"],
    enabled,
    queryFn: async () =>
      (await getData<{ me: IPostCircle | null; people: IPostCircle[] }>("/posts/circles")).data?.data ?? { me: null, people: [] },
    retry: false,
  });

export const useReportPost = () =>
  useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => postData(`/posts/${id}/report`, { reason }),
  });

/* ------------------------------------------------------------------ admin */

const adminKey = (filter: "reported" | "removed") => ["admin", "posts", filter];

export const useAdminPosts = (filter: "reported" | "removed") =>
  useQuery({
    queryKey: adminKey(filter),
    queryFn: async () => (await getData<IPost[]>(`/admin/posts?filter=${filter}`)).data?.data ?? [],
  });

export const useAdminPostAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "remove" | "restore"; reason?: string }) =>
      patchData(`/admin/posts/${id}/${action}`, action === "remove" ? { reason } : {}),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "posts"] }),
  });
};

/* ------------------------------------------------------- likes, comments */

export const useTogglePostLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await postData<object, { liked: boolean; likes: number }>(`/posts/${id}/like`, {})).data?.data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
};

/** A post's comments, oldest first; replies carry what they answer. */
export const usePostComments = (postId: string | null) =>
  useInfiniteQuery({
    queryKey: ["posts", postId, "comments"],
    enabled: !!postId,
    initialPageParam: "",
    queryFn: async ({ pageParam }) =>
      (
        await getData<{ items: IPostComment[]; nextCursor: string | null }>(
          `/posts/${postId}/comments${pageParam ? `?cursor=${pageParam}` : ""}`,
        )
      ).data?.data ?? { items: [], nextCursor: null },
    getNextPageParam: (last) => last.nextCursor || undefined,
  });

export const useAddPostComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { body: string; parentId?: string }) => postData(`/posts/${postId}/comments`, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
};

export const useRemovePostComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteData(`/posts/comments/${commentId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
};
