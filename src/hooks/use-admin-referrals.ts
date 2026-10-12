import { getData, patchData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const REFERRALS_PAGE_SIZE = 20;

type TMoney = {
  amount: number;
  currency?: { code?: string };
  formatted: { withCurrency: string };
};

type TPerson = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  username: string | null;
};

export type TReferralStatus =
  "ATTACHED" | "PENDING_REWARD" | "REWARDED" | "NOT_ELIGIBLE" | "CANCELLED";

export interface IAdminReferral {
  id: string;
  source: "INVITE" | "INFLUENCER";
  codeUsed: string;
  status: TReferralStatus;
  statusReason: string | null;
  attachedAt: string;
  qualifiedAt: string | null;
  rewardedAt: string | null;
  referred: TPerson;
  referrer: TPerson | null;
  influencerCode: { id: string; code: string; name: string } | null;
  grants: {
    userId: string;
    reason: string;
    currency: string;
    amount: TMoney;
    state: string;
  }[];
}

export interface IReferralSummary {
  referrals: { source: string; status: TReferralStatus; count: number }[];
  credit: {
    currency: string;
    pending: TMoney;
    available: TMoney;
    spent: TMoney;
    expired: TMoney;
    cancelled: TMoney;
  }[];
  rulesNote: string;
}

export interface IInfluencerCodeStats {
  signUps: number;
  qualified: number;
  waiting: number;
  notEligible: number;
  ticketSpend: { currency: string; orders: number; total: TMoney }[];
  welcomeCreditIssued: TMoney[];
}

export interface IInfluencerCode {
  id: string;
  code: string;
  name: string;
  contact: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  deactivatedAt: string | null;
  user: { id: string; username: string | null } | null;
  createdBy?: { firstName: string | null; lastName: string | null } | null;
  stats: IInfluencerCodeStats;
  referrals?: {
    id: string;
    status: TReferralStatus;
    statusReason: string | null;
    attachedAt: string;
    qualifiedAt: string | null;
    referred: TPerson;
  }[];
}

export const useAdminReferrals = (filters: {
  page: number;
  q?: string;
  source?: "INVITE" | "INFLUENCER";
  status?: TReferralStatus;
}) =>
  useQuery({
    queryKey: ["admin-referrals", filters],
    queryFn: async () => {
      const { data } = await getData<IAdminReferral[]>("/admin/referrals", {
        params: {
          page: filters.page,
          limit: REFERRALS_PAGE_SIZE,
          ...(filters.q ? { q: filters.q } : {}),
          ...(filters.source ? { source: filters.source } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
      });
      return {
        items: data?.data ?? [],
        total: data?.pagination?.total ?? 0,
      };
    },
    retry: 0,
  });

export const useReferralSummary = () =>
  useQuery({
    queryKey: ["admin-referrals-summary"],
    queryFn: async () =>
      (await getData<IReferralSummary>("/admin/referrals/summary")).data
        ?.data ?? null,
    retry: 0,
  });

export const useInfluencerCodes = () =>
  useQuery({
    queryKey: ["admin-influencer-codes"],
    queryFn: async () =>
      (await getData<IInfluencerCode[]>("/admin/influencer-codes")).data
        ?.data ?? [],
    retry: 0,
  });

export const useInfluencerCode = (id: string | null) =>
  useQuery({
    queryKey: ["admin-influencer-code", id],
    enabled: !!id,
    queryFn: async () =>
      (await getData<IInfluencerCode>(`/admin/influencer-codes/${id}`)).data
        ?.data ?? null,
    retry: 0,
  });

const useRefreshCodes = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: ["admin-influencer-codes"],
    });
    void queryClient.invalidateQueries({ queryKey: ["admin-influencer-code"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-audit-log"] });
  };
};

export const useCreateInfluencerCode = () => {
  const refresh = useRefreshCodes();
  return useMutation({
    mutationFn: async (body: {
      code: string;
      name: string;
      contact?: string;
      notes?: string;
      username?: string;
    }) =>
      (
        await postData<typeof body, IInfluencerCode>(
          "/admin/influencer-codes",
          body,
        )
      ).data?.data,
    onSuccess: refresh,
  });
};

export const useSetInfluencerCodeActive = () => {
  const refresh = useRefreshCodes();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      patchData(`/admin/influencer-codes/${id}`, { isActive }),
    onSuccess: refresh,
  });
};
