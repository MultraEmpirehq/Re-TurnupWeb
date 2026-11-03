import { getData } from "@/api";
import { TAuthIntent } from "@/lib/auth-intent";
import { ROUTES } from "@/lib/variables";
import {
  completeProfileRoute,
  needsProfileDetails,
} from "@/lib/profile-complete";
import { EUserRoles, TUserDetails } from "@/stores/user-store";
import useWorkspaceStore, { TVendorWorkspace } from "@/stores/workspace-store";

/**
 * Where someone who works for organisers goes, rather than applying to be one:
 * a team member into the (first) team's dashboard, door staff to scanning.
 * Undefined when they're neither.
 */
const staffLanding = async (user: TUserDetails) => {
  try {
    const { data: teams } = await getData<(TVendorWorkspace & { membershipId: string })[]>(
      "/vendor/workspaces",
    );
    const team = teams?.data?.[0];
    if (team) {
      useWorkspaceStore.getState().setWorkspace(user.id, {
        vendorId: team.vendorId,
        name: team.name,
        image: team.image,
        permissions: team.permissions,
      });
      return ROUTES.DASHBOARD.href;
    }
    const { data: doors } = await getData<{ via: string }[]>("/scanning/events");
    if (doors?.data?.some((event) => event.via === "door")) {
      return ROUTES.SCAN_TICKETS.href;
    }
  } catch {
    // Can't tell, so they carry on to the vendor application.
  }
  return undefined;
};

/**
 * Where someone goes after signing in. An explicit redirect always wins, so a link
 * that sent them to log in brings them back. Otherwise admins land on the admin
 * console and approved vendors on their dashboard. Anyone else who came in by
 * the vendor door goes on to vendor verification, to start hosting (unless
 * they're on an organiser's team or door staff: they go to that work instead);
 * everyone else lands on Explore, to find something to go to.
 *
 * Login doesn't return the verification status, so it's asked for here, the same
 * way the create-event guard asks. Needs the session token to be stored already.
 */
export const resolveLandingRoute = async (
  user?: TUserDetails | null,
  redirectTo?: string | null,
  intent: TAuthIntent = "attendee",
) => {
  // Sign-up isn't finished until the details are in, wherever they were going.
  if (needsProfileDetails(user)) return completeProfileRoute(redirectTo, intent);

  if (redirectTo) return redirectTo;

  if (user?.role === EUserRoles.ADMIN) return ROUTES.ADMIN_OVERVIEW.href;

  if (user?.role === EUserRoles.VENDOR) {
    try {
      const { data } = await getData<{ status?: string }>(
        "/vendor/verification",
      );
      if (data?.data?.status === "approved") return ROUTES.DASHBOARD.href;
    } catch {
      // Can't tell, so treat them like any other user.
    }
  }

  if (intent !== "vendor") return ROUTES.EXPLORE.href;
  // The organiser door, but already on a team or on the door for an event.
  if (user && user.role !== EUserRoles.VENDOR) {
    const staff = await staffLanding(user);
    if (staff) return staff;
  }
  return ROUTES.VENDOR_VERIFICATION.href;
};
