"use client";

import { getData, patchData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type TSupportChat = {
  id: string;
  preview: string | null;
  lastMessageAt: string;
  person: { id: string; name: string; email: string; role: string };
  /** Their message is the latest and it isn't resolved: it's waiting on the team. */
  waitingOnUs: boolean;
  /** Who said "I'm on it" (or replied first). */
  pickedUpBy: { id: string; name: string } | null;
  pickedUpAt: string | null;
  /** Marked resolved; a new message from them reopens it. */
  resolvedAt: string | null;
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

/** "I'm on it" or "Mark resolved" on a support chat. */
export const useSupportChatAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, action }: { chatId: string; action: "pick-up" | "resolve" }) =>
      patchData(`/admin/support/chats/${chatId}/${action}`, undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-support-chats"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-support-team"] });
    },
  });
};

export type TSupportTeam = {
  /** Head of Support or an escalation admin: can hand chats to someone. */
  canAssign: boolean;
  meAway: boolean;
  staff: { id: string; name: string; away: boolean; isHead: boolean; openChats: number }[];
};

/** Who takes live chats and who's away; checked again every 30 seconds. */
export const useSupportTeam = (enabled = true) =>
  useQuery({
    queryKey: ["admin-support-team"],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => (await getData<TSupportTeam>("/admin/support/chats/team")).data?.data ?? null,
  });

/** Hand a chat to someone on Support. */
export const useAssignSupportChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, adminId }: { chatId: string; adminId: string }) =>
      patchData(`/admin/support/chats/${chatId}/assign`, { adminId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-support-chats"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-support-team"] });
    },
  });
};

/** Whether you're marked away (any admin). */
export const useAdminAwayStatus = (enabled = true) =>
  useQuery({
    queryKey: ["admin-away"],
    enabled,
    queryFn: async () => (await getData<{ away: boolean; since: string | null }>("/admin/me/away")).data?.data ?? null,
  });

/** Away (alerts skip you; your live chats go back to Support) or back. Any admin. */
export const useSupportAway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (away: boolean) =>
      (await patchData<{ away: boolean }, { away: boolean; released: number }>("/admin/me/away", { away })).data?.data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-away"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-support-chats"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-support-team"] });
    },
  });
};

/** The message after switching away on or off. */
export const awayToast = (away: boolean, released = 0) =>
  away
    ? released
      ? `You're away. ${released} open chat${released === 1 ? "" : "s"} went back to Support.`
      : "You're away. Alerts will skip you until you're back."
    : "You're back. Alerts reach you again.";
