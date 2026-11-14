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
  /** Their name, when the actor is a person with one. */
  actorName?: string | null;
  /** Taken back later with the Undo button. */
  undone?: { at: string; by: string | null; reason: string | null } | null;
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

export type TAuditFilters = {
  targetType?: TAuditTargetType;
  action?: string;
  actorType?: "admin" | "member" | "automatic";
  targetId?: string;
  from?: string;
  to?: string;
  search: string;
  page: number;
};

export const useAdminAuditLogs = ({ page, search, ...filters }: TAuditFilters) =>
  useQuery({
    queryKey: ["admin-audit-logs", filters, search, page],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries({ ...filters, search }).filter(([, value]) => !!value),
      );
      const { data } = await getData<IAuditLogEntry[]>("/admin/audit-logs", {
        params: { page, limit: AUDIT_PAGE_SIZE, ...params },
      });
      return { entries: data?.data ?? [], total: data?.pagination?.total ?? 0 };
    },
    retry: 0,
  });

/** Every action recorded so far, for the filter. */
export const useAuditActions = () =>
  useQuery({
    queryKey: ["admin-audit-actions"],
    queryFn: async () =>
      (await getData<{ action: string; count: number }[]>("/admin/audit-logs/actions")).data?.data ?? [],
    staleTime: 5 * 60_000,
  });
