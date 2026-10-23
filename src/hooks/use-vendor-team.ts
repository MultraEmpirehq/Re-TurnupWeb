import { deleteData, getData, patchData, postData } from "@/api";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { TVendorPermission } from "@/stores/workspace-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** What each team permission lets someone do, in the order they're offered. */
export const VENDOR_PERMISSIONS: {
  value: TVendorPermission;
  label: string;
  description: string;
}[] = [
  {
    value: "TICKETS_SCAN",
    label: "Scan tickets",
    description: "Check people in at the door, for any of your events.",
  },
  {
    value: "EVENTS_MANAGE",
    label: "Manage events",
    description: "Create and edit events, tickets, days, line-ups and posts.",
  },
  {
    value: "SCANNERS_MANAGE",
    label: "Manage door scanners",
    description: "Invite or remove scanners for a single event.",
  },
  {
    value: "REGISTRATIONS_REVIEW",
    label: "Review registrations",
    description: "Approve or reject people who registered.",
  },
  {
    value: "SALES_VIEW",
    label: "See sales",
    description: "Ticket sales, the ticket ledger and analytics.",
  },
  {
    value: "FINANCE_VIEW",
    label: "See the wallet",
    description: "Earnings and payouts. They can never change bank details.",
  },
  {
    value: "CHATS_MANAGE",
    label: "Moderate chats",
    description: "Post in and moderate your event group chats.",
  },
];

export const permissionLabel = (permission: TVendorPermission) =>
  VENDOR_PERMISSIONS.find((item) => item.value === permission)?.label ??
  permission;

export type TTeamMember = {
  id: string;
  email: string;
  permissions: TVendorPermission[];
  hasAccount: boolean;
  name: string | null;
  image: string | null;
  addedAt: string;
};

export type TWorkspaceListItem = {
  membershipId: string;
  vendorId: string;
  name: string;
  username?: string | null;
  image: string | null;
  permissions: TVendorPermission[];
};

const TEAM_KEY = ["vendor-team"];

/** The signed-in vendor's own team. */
export const useVendorTeam = () =>
  useQuery({
    queryKey: TEAM_KEY,
    queryFn: async () => {
      const { data } = await getData<TTeamMember[]>("/vendor/team");
      return data?.data ?? [];
    },
  });

export const useSaveTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      email?: string;
      permissions: TVendorPermission[];
    }) => {
      const { data } = input.id
        ? await patchData<{ permissions: TVendorPermission[] }, TTeamMember>(
            `/vendor/team/${input.id}`,
            { permissions: input.permissions },
          )
        : await postData<
            { email: string; permissions: TVendorPermission[] },
            TTeamMember
          >("/vendor/team", {
            email: input.email ?? "",
            permissions: input.permissions,
          });
      return data?.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEAM_KEY }),
  });
};

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteData(`/vendor/team/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEAM_KEY }),
  });
};

/** Organisers who added the signed-in person to their team. */
export const useMyWorkspaces = () => {
  const userId = useUserStore((state) => state.userDetails?.id);
  const isAdmin = useUserStore(
    (state) => state.userDetails?.role === EUserRoles.ADMIN,
  );
  return useQuery({
    queryKey: ["vendor-workspaces", userId],
    queryFn: async () => {
      const { data } = await getData<TWorkspaceListItem[]>(
        "/vendor/workspaces",
      );
      return data?.data ?? [];
    },
    enabled: !!userId && !isAdmin,
    staleTime: 60_000,
  });
};
