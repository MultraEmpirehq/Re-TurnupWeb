import { deleteData, getData, patchData, postData } from "@/api";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export type TAdminPermission =
  | "ADMINS_MANAGE"
  | "USERS_VIEW"
  | "VENDORS_VERIFY"
  | "EVENTS_MODERATE"
  | "CATALOGUE_MANAGE"
  | "AUDIT_VIEW"
  | "FILES_MANAGE";

/** Every permission, in the order the admin screens list them. */
export const ADMIN_PERMISSIONS: {
  value: TAdminPermission;
  label: string;
  description: string;
}[] = [
  {
    value: "EVENTS_MODERATE",
    label: "Moderate events",
    description: "Suspend, restore and remove any organiser's event.",
  },
  {
    value: "VENDORS_VERIFY",
    label: "Verify vendors",
    description: "Review vendor applications and approve or reject them.",
  },
  {
    value: "CATALOGUE_MANAGE",
    label: "Manage catalogue",
    description: "Add, edit and remove venues, categories and FAQs.",
  },
  {
    value: "USERS_VIEW",
    label: "View users",
    description: "Look up attendees, vendors and admins and their details.",
  },
  {
    value: "AUDIT_VIEW",
    label: "View audit log",
    description: "See every sensitive action taken by admins.",
  },
  {
    value: "FILES_MANAGE",
    label: "Manage files",
    description: "Clean up uploaded files no longer in use.",
  },
  {
    value: "ADMINS_MANAGE",
    label: "Manage admins",
    description:
      "Add, suspend and remove admins, and change what they can do. Only within their own permissions.",
  },
];

export const ADMIN_PERMISSION_LABELS = Object.fromEntries(
  ADMIN_PERMISSIONS.map(({ value, label }) => [value, label]),
) as Record<TAdminPermission, string>;

/**
 * What the signed-in admin may do. The api checks every request anyway; this only
 * decides what the console shows, so nobody is offered a page that will refuse them.
 */
export const useAdminPermissions = () => {
  const userId = useUserStore((state) => state.userDetails?.id);
  const isAdmin = useUserStore(
    (state) => state.userDetails?.role === EUserRoles.ADMIN,
  );

  const query = useQuery({
    queryKey: ["admin-permissions", "me", userId],
    queryFn: async () => {
      const { data } = await getData<{ permissions: TAdminPermission[] }>(
        "/admin/permissions/me",
      );
      return data?.data?.permissions ?? [];
    },
    enabled: isAdmin && !!userId,
    staleTime: 60_000,
    retry: 1,
  });

  const permissions = query.data;
  const has = useCallback(
    (permission?: TAdminPermission) =>
      !permission || !!permissions?.includes(permission),
    [permissions],
  );

  return {
    permissions: permissions ?? [],
    has,
    /** Still finding out, so callers should wait before hiding or refusing anything. */
    isLoading: isAdmin && query.isLoading,
    error: query.error,
  };
};

export interface IAdminSummary {
  id: string;
  email: string;
  name: string | null;
  permissions: TAdminPermission[];
  isSuspended: boolean;
  isYou: boolean;
  createdAt: string;
}

const ADMINS_KEY = ["admin-admins"];

export const useAdmins = () =>
  useQuery({
    queryKey: ADMINS_KEY,
    queryFn: async () => {
      const { data } = await getData<IAdminSummary[]>("/admin/admins");
      return data?.data ?? [];
    },
    retry: 0,
  });

const useAdminMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMINS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
};

export const useAddAdmin = () =>
  useAdminMutation((body: { email: string; permissions: TAdminPermission[] }) =>
    postData("/admin/admins", {
      ...body,
      email: body.email.trim().toLowerCase(),
    }),
  );

export const useUpdateAdminPermissions = () =>
  useAdminMutation(
    ({ id, permissions }: { id: string; permissions: TAdminPermission[] }) =>
      patchData(`/admin/admins/${id}/permissions`, { permissions }),
  );

export const useSetAdminSuspension = () =>
  useAdminMutation(({ id, suspended }: { id: string; suspended: boolean }) =>
    patchData(`/admin/admins/${id}/suspension`, { suspended }),
  );

export const useRemoveAdmin = () =>
  useAdminMutation((id: string) => deleteData(`/admin/admins/${id}`));
