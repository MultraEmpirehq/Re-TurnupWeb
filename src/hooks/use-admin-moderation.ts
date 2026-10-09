import { getData, patchData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const MODERATION_PAGE_SIZE = 20;

type TPage<T> = { items: T[]; total: number };

const pageOf = async <T>(url: string, params: Record<string, unknown>) => {
  const { data } = await getData<T[]>(url, { params });
  return {
    items: data?.data ?? [],
    total: data?.pagination?.total ?? 0,
  } satisfies TPage<T>;
};

// Events waiting for approval -------------------------------------------------

export interface IEventAwaitingReview {
  id: string;
  name: string;
  date?: string;
  image?: string;
  description?: string;
  organizerName?: string;
  submittedAt: string;
  organiser: { id: string; email: string; name: string | null };
}

export const useEventReviews = (page: number) =>
  useQuery({
    queryKey: ["admin-event-reviews", page],
    queryFn: () =>
      pageOf<IEventAwaitingReview>("/admin/event-reviews", {
        page,
        limit: MODERATION_PAGE_SIZE,
      }),
    retry: 0,
  });

// Reports ---------------------------------------------------------------------

export type TReportStatus = "open" | "resolved" | "dismissed";

export interface IEventReport {
  id: string;
  reason: string;
  details: string | null;
  status: TReportStatus;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reporter: { id: string; email: string; name: string | null };
  event: {
    id: string;
    name: string;
    status: string;
    organizerName: string | null;
    openReports: number;
  };
}

export const useEventReports = (
  status: TReportStatus | undefined,
  page: number,
) =>
  useQuery({
    queryKey: ["admin-reports", status ?? "all", page],
    queryFn: () =>
      pageOf<IEventReport>("/admin/reports", {
        page,
        limit: MODERATION_PAGE_SIZE,
        ...(status ? { status } : {}),
      }),
    retry: 0,
  });

// Contact messages ------------------------------------------------------------

export interface IInquiry {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isSignedInUser: boolean;
  status: "new" | "resolved";
  handledAt: string | null;
  createdAt: string;
}

export const useInquiries = (
  status: "new" | "resolved" | undefined,
  page: number,
) =>
  useQuery({
    queryKey: ["admin-inquiries", status ?? "all", page],
    queryFn: () =>
      pageOf<IInquiry>("/admin/inquiries", {
        page,
        limit: MODERATION_PAGE_SIZE,
        ...(status ? { status } : {}),
      }),
    retry: 0,
  });

// Actions ---------------------------------------------------------------------

/** A mutation that refreshes the given lists, and the audit log, when it lands. */
const useModerationAction = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  invalidates: string[],
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      [...invalidates, "admin-audit-logs"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      );
    },
  });
};

export const useApproveEvent = () =>
  useModerationAction(
    (id: string) => patchData(`/admin/event-reviews/${id}/approve`, undefined),
    ["admin-event-reviews", "events"],
  );

export const useRejectEvent = () =>
  useModerationAction(
    ({ id, reason }: { id: string; reason: string }) =>
      patchData(`/admin/event-reviews/${id}/reject`, { reason }),
    ["admin-event-reviews", "events"],
  );

export const useResolveReport = () =>
  useModerationAction(
    ({
      id,
      outcome,
      note,
    }: {
      id: string;
      outcome: "resolved" | "dismissed";
      note?: string;
    }) => patchData(`/admin/reports/${id}/resolve`, { outcome, note }),
    ["admin-reports"],
  );

export const useResolveInquiry = () =>
  useModerationAction(
    (id: string) => patchData(`/admin/inquiries/${id}/resolve`, undefined),
    ["admin-inquiries"],
  );

export const useSetUserSuspension = () =>
  useModerationAction(
    ({
      id,
      suspended,
      reason,
    }: {
      id: string;
      suspended: boolean;
      reason?: string;
    }) => patchData(`/admin/users/${id}/suspension`, { suspended, reason }),
    ["admin-users", "admin-user"],
  );

// Ticket transfers ------------------------------------------------------------

export interface IAdminUserTransfer {
  id: string;
  status: "PENDING" | "CLAIMED" | "CANCELLED";
  direction: "sent" | "received";
  createdAt: string;
  claimedAt: string | null;
  from: { name: string | null; email?: string };
  to: { name: string | null; email: string };
  ticketName: string;
  ticketCode?: string;
  event: { id: string; name: string; date: string } | null;
}

export const useAdminUserTransfers = (userId?: string) =>
  useQuery({
    queryKey: ["admin-user-transfers", userId],
    queryFn: async () => {
      const { data } = await getData<IAdminUserTransfer[]>(
        `/admin/users/${userId}/transfers`,
      );
      return data?.data ?? [];
    },
    enabled: !!userId,
    retry: 0,
  });

export const useAdminCancelTransfer = () =>
  useModerationAction(
    ({ id, reason }: { id: string; reason: string }) =>
      postData(`/admin/transfers/${id}/cancel`, { reason }),
    ["admin-user-transfers"],
  );
