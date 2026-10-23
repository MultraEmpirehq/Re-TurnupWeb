import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import useUserStore from "./user-store";

export type TVendorPermission =
  | "EVENTS_MANAGE"
  | "TICKETS_SCAN"
  | "SCANNERS_MANAGE"
  | "REGISTRATIONS_REVIEW"
  | "SALES_VIEW"
  | "FINANCE_VIEW"
  | "CHATS_MANAGE";

/** An organiser whose team the signed-in person is on, and what they may do there. */
export type TVendorWorkspace = {
  vendorId: string;
  name: string;
  image?: string | null;
  permissions: TVendorPermission[];
};

type TWorkspaceState = {
  /** Whose account picked it, so it never carries over to the next person to sign in. */
  ownerUserId: string | null;
  workspace: TVendorWorkspace | null;
  setWorkspace: (ownerUserId: string, workspace: TVendorWorkspace) => void;
  clearWorkspace: () => void;
};

/**
 * The organiser a team member is working for right now; null when they're in
 * their own account. While it's set, every api call carries the organiser's id in
 * `X-Vendor-Workspace` (see src/api), and the api lets the member do only what
 * that organiser allowed.
 */
const useWorkspaceStore = create(
  persist<TWorkspaceState>(
    (set) => ({
      ownerUserId: null,
      workspace: null,
      setWorkspace: (ownerUserId, workspace) => set({ ownerUserId, workspace }),
      clearWorkspace: () => set({ ownerUserId: null, workspace: null }),
    }),
    {
      name: "vendor-workspace",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return localStorage;
        return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
      }),
    },
  ),
);

/** The active workspace, but only for the account that chose it. */
export const getActiveWorkspace = () => {
  const { ownerUserId, workspace } = useWorkspaceStore.getState();
  const userId = useUserStore.getState().userDetails?.id;
  return workspace && userId && ownerUserId === userId ? workspace : null;
};

export const useActiveWorkspace = () => {
  const userId = useUserStore((state) => state.userDetails?.id);
  const ownerUserId = useWorkspaceStore((state) => state.ownerUserId);
  const workspace = useWorkspaceStore((state) => state.workspace);
  return workspace && userId && ownerUserId === userId ? workspace : null;
};

/**
 * Whose events and sales the dashboard shows (the organiser being helped, or the
 * signed-in vendor), and whether the person may do something there. An owner may
 * do everything.
 */
export const useActingVendor = () => {
  const userId = useUserStore((state) => state.userDetails?.id);
  const workspace = useActiveWorkspace();
  return {
    vendorId: workspace?.vendorId ?? userId,
    workspace,
    isTeamMember: Boolean(workspace),
    can: (permission: TVendorPermission) =>
      !workspace || workspace.permissions.includes(permission),
  };
};

// Signing in as someone else leaves the workspace behind. The id is briefly
// empty while a session loads, so only a different account counts; signing out
// clears it explicitly (see useSignOut), and getActiveWorkspace never hands one
// account's workspace to another anyway.
if (typeof window !== "undefined") {
  useUserStore.subscribe(
    (state) => state.userDetails?.id,
    (userId) => {
      const { ownerUserId, clearWorkspace } = useWorkspaceStore.getState();
      if (userId && ownerUserId && ownerUserId !== userId) clearWorkspace();
    },
  );
}

export default useWorkspaceStore;
