"use client";

import { getData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type TSupportChat = {
  id: string;
  preview: string | null;
  lastMessageAt: string;
  person: { id: string; name: string; email: string; role: string };
  /** Their message is the latest: it's waiting on the team. */
  waitingOnUs: boolean;
};

export type TSupportMessage = {
  id: string;
  body: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
};

/** Every support chat, latest first; checked again every 20 seconds. */
export const useSupportChats = () =>
  useQuery({
    queryKey: ["admin-support-chats"],
    refetchInterval: 20_000,
    queryFn: async () =>
      (await getData<TSupportChat[]>("/admin/support/chats")).data?.data ?? [],
  });

/** One chat's latest messages, joining it first so the team can read and reply. */
export const useSupportMessages = (chatId: string | null) =>
  useQuery({
    queryKey: ["admin-support-messages", chatId],
    enabled: !!chatId,
    refetchInterval: 8_000,
    queryFn: async () => {
      await postData(`/admin/support/chats/${chatId}/join`, undefined);
      return (
        (
          await getData<TSupportMessage[]>(
            `/chats/${chatId}/messages?order=latest&limit=50`,
          )
        ).data?.data ?? []
      );
    },
  });

export const useReplyToSupport = (chatId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      postData(`/chats/${chatId}/messages`, { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-support-messages", chatId] });
      void queryClient.invalidateQueries({ queryKey: ["admin-support-chats"] });
    },
  });
};
