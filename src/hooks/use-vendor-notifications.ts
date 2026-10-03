import { getData } from "@/api";
import { useQuery } from "@tanstack/react-query";

export interface VendorNotification {
  id: string;
  title: string;
  description: string;
  href?: string;
  read?: boolean;
  createdAt: string;
}

const normalizeListResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }
  return [];
};

export const useVendorNotifications = ({
  enabled = true,
}: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ["vendor-notifications"],
    queryFn: async () => {
      const response = await getData<VendorNotification[]>("/vendor/notifications");
      return normalizeListResponse<VendorNotification>(response.data.data);
    },
    retry: 0,
    enabled,
    // Keeps the unread badge in the nav current without a page reload.
    refetchInterval: 60_000,
  });
