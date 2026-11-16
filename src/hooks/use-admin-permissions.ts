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
  | "FILES_MANAGE"
  | "USERS_MANAGE"
  | "SUPPORT_MANAGE"
  | "REFUNDS_MANAGE"
  | "FINANCE_VIEW"
  | "MARKETING_MANAGE"
  | "TICKETS_SCAN"
  | "ORGANISERS_CONTACT"
  | "FINANCE_MANAGE"
  | "ANALYTICS_VIEW"
  | "ACTIONS_UNDO"
  | "EVENTS_HOST"
  | "SALES_MANAGE"
  | "STAFF_MANAGE"
  | "IDENTITY_REVEAL";

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
    value: "USERS_MANAGE",
    label: "Suspend users",
    description:
      "Suspend (no sign-in) or restrict (no publishing, buying, sending tickets or messaging, and payouts held) attendee and vendor accounts, and undo either.",
  },
  {
    value: "SUPPORT_MANAGE",
    label: "Handle inquiries",
    description: "Read and resolve messages sent through the Contact Us form.",
  },
  {
    value: "FINANCE_VIEW",
    label: "View finance",
    description:
      "See sales, Turnupz fees, credit spent and refunds on the dashboard and the finance pages. Read-only: it can't move money.",
  },
  {
    value: "MARKETING_MANAGE",
    label: "Manage marketing",
    description:
      "See who referred whom, and create and switch off influencer codes.",
  },
  {
    value: "TICKETS_SCAN",
    label: "Scan tickets",
    description:
      "Check tickets in at the door for any event, to help organisers out. Every check-in is in the audit log.",
  },
  {
    value: "ORGANISERS_CONTACT",
    label: "Contact organisers",
    description:
      "Message organisers and join event chats, posting as the Turnupz team. Speaks for Turnupz: give it only to people who should.",
  },
  {
    value: "ANALYTICS_VIEW",
    label: "View analytics",
    description: "See audience, the sales funnel, how events did and where buyers come from, as totals. Read-only.",
  },
  {
    value: "FINANCE_MANAGE",
    label: "Manage tax and organiser payments",
    description:
      "Approve tax decisions (which changes what buyers pay), review organisers' tax details, and record money sent to organisers. Give it only to people you trust with that.",
  },
  {
    value: "REFUNDS_MANAGE",
    label: "Handle refunds",
    description:
      "Refund orders, cancel events with refunds for everyone, and mark payment disputes. Moves money: give it only to people you trust with that.",
  },
  {
    value: "ACTIONS_UNDO",
    label: "Undo admin actions",
    description:
      "Take back actions from the audit log: reopen an application decision, restore a suspended event, reactivate a suspended account. Also needs the permission for that area. Give it only to people you trust to overrule others.",
  },
  {
    value: "EVENTS_HOST",
    label: "Create events",
    description:
      "Create events hosted by Turnupz, with sales paid to the Turnupz account, and set up draft events for organisers to check and publish.",
  },
  {
    value: "SALES_MANAGE",
    label: "Manage sales leads",
    description:
      "See and answer sales and partnership enquiries from the Contact page, and set the 'Book a call' link.",
  },
  {
    value: "STAFF_MANAGE",
    label: "Manage departments",
    description:
      "Put admins in departments (Support, Sales, Trust & safety, Finance, Marketing), choose each department's head, and set who hears about work nobody picked up.",
  },
  {
    value: "IDENTITY_REVEAL",
    label: "See full ID numbers",
    description:
      "See a vendor's full ID number and tax ID (normally only the last 4), giving a reason each time. Every look is in the audit log. Give it only to the people who handle fraud, chargebacks and legal requests.",
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

/** A new admin account; their temporary password is emailed to them. */
export const useAddAdmin = () =>
  useAdminMutation(
    (body: {
      email: string;
      firstName: string;
      lastName: string;
      permissions: TAdminPermission[];
    }) =>
      postData("/admin/admins", {
        ...body,
        email: body.email.trim().toLowerCase(),
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
      }),
  );

/** Emails an admin a fresh temporary password and signs them out everywhere. */
export const useResendTemporaryPassword = () =>
  useAdminMutation((id: string) => postData(`/admin/admins/${id}/temporary-password`, {}));

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
