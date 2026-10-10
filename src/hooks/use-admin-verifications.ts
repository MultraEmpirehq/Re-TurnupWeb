import { getData, patchData } from "@/api";
import {
  IVendorVerification,
  TApprovalLevel,
  TVerificationDecision,
  TVerificationStatus,
  TVerificationStepKey,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 20;

export type TReviewPayload = {
  id: string;
  status: TVerificationDecision;
  approvalLevel?: TApprovalLevel;
  message?: string;
  /** Decide one step rather than the whole application. */
  stepKey?: TVerificationStepKey;
};

export const useAdminVerifications = ({
  status,
  search,
  page,
  enabled = true,
}: {
  status: TVerificationStatus | "all";
  search: string;
  page: number;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: ["admin-verifications", status, search, page],
    enabled,
    queryFn: async () => {
      const { data } = await getData<IVendorVerification[]>(
        "/admin/vendor-verifications",
        {
          params: {
            page,
            limit: PAGE_SIZE,
            ...(status === "all" ? {} : { status }),
            ...(search ? { search } : {}),
          },
        },
      );
      return {
        verifications: data?.data ?? [],
        pagination: data?.pagination,
      };
    },
    retry: 0,
  });

export const useAdminVerification = (id: string) =>
  useQuery({
    // Under the list's key, so a review invalidates the open application too.
    queryKey: ["admin-verifications", "detail", id],
    queryFn: async () => {
      const { data } = await getData<IVendorVerification>(
        `/admin/vendor-verifications/${id}`,
      );
      return data?.data;
    },
    enabled: !!id,
    retry: 0,
  });

export const useReviewVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: TReviewPayload) => {
      const { data } = await patchData<
        Omit<TReviewPayload, "id">,
        IVendorVerification
      >(`/admin/vendor-verifications/${id}/review`, body);
      return data?.data;
    },
    onSuccess: () => {
      // A decision also changes what the user-details sheet reports, so both go.
      void queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-user"] });
    },
  });
};

export type TReviewCheckStatus = "pass" | "warn" | "fail" | "info";

export interface IReviewCheck {
  key: string;
  group: "identity" | "business" | "payout" | "duplicates" | "account";
  label: string;
  status: TReviewCheckStatus;
  detail: string;
}

export interface IVerificationReview {
  checks: IReviewCheck[];
  summary: { pass: number; warn: number; fail: number };
  /** The name the bank has for the payout account, where it can be asked. */
  bankAccountName: string | null;
  activity: {
    events: {
      total: number;
      published: number;
      draft: number;
      pendingReview: number;
      suspended: number;
    };
    ticketsSold: number;
    paidOrders: number;
    reports: { total: number; open: number };
  };
  history: {
    at: string;
    kind: "started" | "submitted" | "decision";
    decision: string;
    step: string | null;
    message: string | null;
    actor: string | null;
  }[];
}

/** Checks, activity and history for one application, worked out by the API. */
export const useVerificationReview = (id: string) =>
  useQuery({
    // Under the list's key too, so a decision refreshes the history.
    queryKey: ["admin-verifications", "review", id],
    queryFn: async () => {
      const { data } = await getData<IVerificationReview>(
        `/admin/vendor-verifications/${id}/review`,
      );
      return data?.data;
    },
    enabled: !!id,
    retry: 0,
  });

/** The next application waiting for a decision after this one, oldest first in the queue. */
export const useNextInQueue = (currentId: string) =>
  useQuery({
    queryKey: ["admin-verifications", "queue", currentId],
    queryFn: async () => {
      const { data } = await getData<IVendorVerification[]>(
        "/admin/vendor-verifications",
        { params: { status: "submitted", limit: 50, page: 1 } },
      );
      const waiting = (data?.data ?? []).filter((item) => item.id !== currentId);
      return { nextId: waiting[0]?.id ?? null, waiting: waiting.length };
    },
    enabled: !!currentId,
    staleTime: 30_000,
  });
