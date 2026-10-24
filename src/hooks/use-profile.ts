import { deleteData, getData, patchData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";

type TMoney = { amount: number; formatted: { withCurrency: string } };

/** How someone looks to others, with their follower numbers. */
export interface IPersonProfile {
  id: string;
  name: string;
  username: string;
  image: string | null;
  bio: string | null;
  country: string | null;
  followers: number;
  following: number;
  isFollowing: boolean;
  followsYou: boolean;
  isMe: boolean;
}

export interface IPersonCard {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  isFollowing: boolean;
  followsYou: boolean;
}

export const usePerson = (username?: string | null) =>
  useQuery({
    queryKey: ["person", username],
    enabled: !!username,
    queryFn: async () =>
      (
        await getData<IPersonProfile>(
          `/people/${encodeURIComponent(username!)}`,
        )
      ).data?.data ?? null,
  });

/** Who follows them, or who they follow (people only). */
export const usePeopleConnections = (
  username: string | null | undefined,
  kind: "followers" | "following",
) =>
  useQuery({
    queryKey: ["person", username, kind],
    enabled: !!username,
    queryFn: async () =>
      (
        await getData<IPersonCard[]>(
          `/people/${encodeURIComponent(username!)}/${kind}`,
        )
      ).data?.data ?? [],
  });

export type TCreditBalance = {
  currency: string;
  /** Spendable now. */
  available: TMoney;
  /** Earned, released after the waiting period. */
  pending: TMoney;
  nextExpiry: string | null;
};

export type TCreditGrant = {
  id: string;
  currency: string;
  amount: TMoney;
  remaining: TMoney;
  state: "PENDING" | "AVAILABLE" | "SPENT" | "EXPIRED" | "CANCELLED";
  description: string;
  releaseAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

/** Turnupz Credit per currency. */
export const useCreditBalance = () =>
  useQuery({
    queryKey: ["credit", "balance"],
    queryFn: async () =>
      (await getData<TCreditBalance[]>("/credit")).data?.data ?? [],
  });

/** Every credit grant, newest first. */
export const useCreditHistory = (enabled = true) =>
  useQuery({
    queryKey: ["credit", "history"],
    enabled,
    queryFn: async () =>
      (await getData<TCreditGrant[]>("/credit/history?limit=50")).data?.data ??
      [],
  });

export type TSavedCard = {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  /** Picked first at checkout. */
  isDefault: boolean;
  isExpired: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

/** Cards saved by ticking "Save this card" at checkout. */
export const useSavedCards = () =>
  useQuery({
    queryKey: ["saved-cards"],
    queryFn: async () =>
      (await getData<TSavedCard[]>("/saved-cards")).data?.data ?? [],
  });

export const useSavedCardActions = () => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["saved-cards"] });
  const makeDefault = useMutation({
    mutationFn: (cardId: string) =>
      patchData(`/saved-cards/${cardId}/default`, undefined),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (cardId: string) => deleteData(`/saved-cards/${cardId}`),
    onSuccess: refresh,
  });
  return { makeDefault, remove };
};

// Hide the balance on this browser, wherever it's shown, as on the app.
const HIDE_KEY = "turnupz-hide-balance";
const HIDE_EVENT = "turnupz:hide-balance";
const readHidden = () => {
  try {
    return localStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
};
const subscribeHidden = (callback: () => void) => {
  window.addEventListener(HIDE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(HIDE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

export const useHideBalance = () => {
  const hidden = useSyncExternalStore(subscribeHidden, readHidden, () => false);
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(HIDE_KEY, readHidden() ? "0" : "1");
    } catch {
      // Storage blocked: it just won't be remembered.
    }
    window.dispatchEvent(new CustomEvent(HIDE_EVENT));
  }, []);
  return { hidden, toggle };
};

/** "₦12,500.00", or dots while hidden. */
export const maskMoney = (value: string, hidden: boolean) =>
  hidden ? "••••••" : value;
