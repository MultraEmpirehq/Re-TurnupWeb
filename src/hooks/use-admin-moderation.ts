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
  /** Why it was held before going live; the organiser isn't shown these. */
  reviewFlags?: string[];
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
  /** How much it counts: 2 ticket holders and buyers, 0.5 new or unreliable, 0 the organiser's team. */
  weight?: number;
  holdsTicket?: boolean;
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
    /** Its reports reached a bar and need a look. */
    needsReview?: boolean;
    /** New sales paused over scam reports from ticket holders. */
    salesPaused?: boolean;
  };
}

export const useEventReports = (
  status: TReportStatus | undefined,
  page: number,
  level?: "review" | "single",
) =>
  useQuery({
    queryKey: ["admin-reports", status ?? "all", level ?? "any", page],
    queryFn: () =>
      pageOf<IEventReport>("/admin/reports", {
        page,
        limit: MODERATION_PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(level ? { level } : {}),
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
  /** What it's about; sales leads go to the sales team. */
  topic: "support" | "organiser" | "sales" | "press" | "general";
  company: string | null;
  jobTitle: string | null;
  country: string | null;
  eventsPerYear: string | null;
  /** Someone said "I'm on it". */
  pickedUpAt: string | null;
  status: "new" | "resolved";
  handledAt: string | null;
  createdAt: string;
}

export type TInquiryTopic = IInquiry["topic"];

/** Open messages per topic this admin can see (support topics, or sales leads). */
export const useInquiryCounts = () =>
  useQuery({
    queryKey: ["admin-inquiries", "counts"],
    queryFn: async () =>
      (await getData<Partial<Record<TInquiryTopic, number>>>("/admin/inquiries/counts")).data?.data ?? {},
    retry: 0,
  });

export const usePickUpInquiry = () =>
  useModerationAction(
    (id: string) => patchData(`/admin/inquiries/${id}/pick-up`, undefined),
    ["admin-inquiries"],
  );

export const useInquiries = (
  status: "new" | "resolved" | undefined,
  page: number,
  topic?: TInquiryTopic,
) =>
  useQuery({
    queryKey: ["admin-inquiries", status ?? "all", topic ?? "any", page],
    queryFn: () =>
      pageOf<IInquiry>("/admin/inquiries", {
        page,
        limit: MODERATION_PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(topic ? { topic: topic.toUpperCase() } : {}),
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

/** Restrict (signs in, can't publish, buy, send or message) or lift it. */
export const useSetUserRestriction = () =>
  useModerationAction(
    ({
      id,
      restricted,
      reason,
    }: {
      id: string;
      restricted: boolean;
      reason?: string;
    }) => patchData(`/admin/users/${id}/restriction`, { restricted, reason }),
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
