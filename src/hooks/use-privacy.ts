import { deleteData, getData, patchData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Who can start a one-to-one chat with you. */
export type TMessagePolicy = "EVERYONE" | "MUTUALS" | "NOBODY";

export type TPrivacy = {
  /** Only approved followers see your followers and following. */
  isPrivate: boolean;
  messagePolicy: TMessagePolicy;
  blockedCount: number;
};

export type TPersonSummary = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
};

export const usePrivacy = () =>
  useQuery({
    queryKey: ["privacy"],
    queryFn: async () => (await getData<TPrivacy>("/privacy")).data?.data ?? null,
  });

/** Saves a privacy setting, showing it straight away and undoing it on failure. */
export const useUpdatePrivacy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Partial<Pick<TPrivacy, "isPrivate" | "messagePolicy">>,
    ) => (await patchData<typeof body, TPrivacy>("/privacy", body)).data?.data,
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ["privacy"] });
      const previous = queryClient.getQueryData<TPrivacy>(["privacy"]);
      if (previous) {
        queryClient.setQueryData(["privacy"], { ...previous, ...body });
      }
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["privacy"], context.previous);
      }
    },
    onSuccess: (saved) => {
      if (saved) queryClient.setQueryData(["privacy"], saved);
      // Going public accepts everyone who asked.
      void queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
    },
  });
};

export const useBlocks = () =>
  useQuery({
    queryKey: ["blocks"],
    queryFn: async () =>
      (await getData<(TPersonSummary & { blockedAt: string })[]>("/privacy/blocks"))
        .data?.data ?? [],
  });

export const useUnblock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteData(`/privacy/blocks/${userId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["blocks"] });
      void queryClient.invalidateQueries({ queryKey: ["privacy"] });
    },
  });
};

export const useFollowRequests = (enabled = true) =>
  useQuery({
    queryKey: ["follow-requests"],
    enabled,
    queryFn: async () =>
      (await getData<(TPersonSummary & { requestedAt: string })[]>("/follows/requests"))
        .data?.data ?? [],
  });

export const useAnswerFollowRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, accept }: { userId: string; accept: boolean }) =>
      postData(`/follows/requests/${userId}/${accept ? "accept" : "decline"}`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["person"] });
    },
  });
};

/** Message requests: chats from people you don't follow back, waiting for you. */
export const answerMessageRequest = (chatId: string, accept: boolean) =>
  postData(`/chats/${chatId}/request/${accept ? "accept" : "decline"}`, {});
