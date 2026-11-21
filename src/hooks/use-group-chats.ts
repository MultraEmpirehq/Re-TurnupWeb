"use client";

import { deleteData, getData, patchData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Friends' group chats (not tied to an event). Messages use the usual chat hooks. */
export type TGroupMember = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  isAdmin: boolean;
  isOwner: boolean;
};

export type TGroupInfo = {
  id: string;
  name: string;
  image: string | null;
  createdAt: string | null;
  memberCount: number;
  closed: boolean;
  me: { isAdmin: boolean; isOwner: boolean; muted: boolean };
  /** Admins only: the current invite link's token (null: no link). */
  inviteToken?: string | null;
  members: TGroupMember[];
  media: { id: string; url: string; name: string | null; kind?: string }[];
};

export const groupKey = (id?: string | null) => ["group-chat", id];

/** The link people open to join (the website page turns it into a join). */
export const groupInviteUrl = (token: string) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/groups/join/${token}`;

export const useGroupInfo = (id?: string | null) =>
  useQuery({
    queryKey: groupKey(id),
    enabled: !!id,
    queryFn: async () => (await getData<TGroupInfo>(`/chats/groups/${id}`)).data?.data ?? null,
  });

/** Every change refreshes the group and the chat list (name, picture, who's in it). */
const useRefresh = (id?: string | null) => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: groupKey(id) });
    void queryClient.invalidateQueries({ queryKey: ["event-chats"] });
  };
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; memberIds: string[]; imageUrl?: string }) =>
      (await postData<typeof body, { id: string; added: number; skipped: number }>("/chats/groups", body)).data
        ?.data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["event-chats"] }),
  });
};

export const useGroupActions = (id: string) => {
  const refresh = useRefresh(id);
  const run =
    <T,>(fn: (input: T) => Promise<unknown>) =>
    async (input: T) => {
      const result = await fn(input);
      refresh();
      return result;
    };
  return {
    rename: run((name: string) => patchData(`/chats/groups/${id}`, { name })),
    setPicture: run((imageUrl: string | null) => patchData(`/chats/groups/${id}`, { imageUrl })),
    addMembers: run(
      async (userIds: string[]) =>
        (await postData<{ userIds: string[] }, { added: number; skipped: number }>(`/chats/groups/${id}/members`, {
          userIds,
        })).data?.data,
    ),
    remove: run((userId: string) => deleteData(`/chats/groups/${id}/members/${userId}`)),
    setAdmin: run(({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      patchData(`/chats/groups/${id}/members/${userId}`, { isAdmin }),
    ),
    leave: run(() => postData(`/chats/groups/${id}/leave`, undefined)),
    makeInvite: run(
      async () => (await postData<undefined, { inviteToken: string }>(`/chats/groups/${id}/invite`, undefined)).data?.data,
    ),
    revokeInvite: run(() => deleteData(`/chats/groups/${id}/invite`)),
    report: (reason: string) => postData(`/chats/groups/${id}/report`, { reason }),
  };
};

export const useGroupInvite = (token?: string | null) =>
  useQuery({
    queryKey: ["group-invite", token],
    enabled: !!token,
    retry: 0,
    queryFn: async () =>
      (await getData<{ name: string; image: string | null; memberCount: number }>(`/chats/groups/invites/${token}`))
        .data?.data ?? null,
  });

export const joinGroup = async (token: string) =>
  (await postData<undefined, { id: string }>(`/chats/groups/invites/${token}/join`, undefined)).data?.data;

export const useMuteGroup = (id: string) => {
  const refresh = useRefresh(id);
  return useMutation({
    mutationFn: (muted: boolean) => patchData(`/chats/${id}/mute`, { muted }),
    onSuccess: refresh,
  });
};
