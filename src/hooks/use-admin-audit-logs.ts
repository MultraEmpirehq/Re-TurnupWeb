import { getData } from "@/api";
import { useQuery } from "@tanstack/react-query";

export const AUDIT_PAGE_SIZE = 20;

export type TAuditTargetType =
  | "vendor_verification"
  | "event"
  | "category"
  | "venue"
  | "faq"
  | "admin";

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
}

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
