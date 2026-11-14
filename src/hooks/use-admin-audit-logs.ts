import { getData, postData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TAdminPermission } from "./use-admin-permissions";

export const AUDIT_PAGE_SIZE = 20;

export type TAuditTargetType =
  | "vendor_verification"
  | "event"
  | "category"
  | "venue"
  | "faq"
  | "admin"
  | "user"
  | "event_report"
  | "contact_message"
  | "ticket_transfer";

export interface IAuditLogEntry {
  id: string;
  action: string;
  targetType: TAuditTargetType;
  targetId: string | null;
  targetLabel: string | null;
  details: Record<string, unknown> | null;
  actor: { id: string | null; email: string | null; role: string | null };
  ipAddress: string | null;
  createdAt: string;
  /** Set when it can still be undone: the button's words and the area permission it needs. */
  undo?: { label: string; permission: TAdminPermission } | null;
}

/** Takes back one audit entry; needs Undo admin actions plus that area's permission. */
export const useUndoAuditEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      postData(`/admin/audit-logs/${id}/undo`, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    },
  });
};

export const useAdminAuditLogs = ({
  targetType,
  search,
  page,
}: {
  targetType?: TAuditTargetType;
  search: string;
  page: number;
}) =>
  useQuery({
    queryKey: ["admin-audit-logs", targetType ?? "all", search, page],
    queryFn: async () => {
      const { data } = await getData<IAuditLogEntry[]>("/admin/audit-logs", {
        params: {
          page,
          limit: AUDIT_PAGE_SIZE,
          ...(targetType ? { targetType } : {}),
          ...(search ? { search } : {}),
        },
      });
      return { entries: data?.data ?? [], total: data?.pagination?.total ?? 0 };
    },
    retry: 0,
  });
