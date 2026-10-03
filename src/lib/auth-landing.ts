import { getData } from "@/api";
import { ROUTES } from "@/lib/variables";
import { EUserRoles, TUserDetails } from "@/stores/user-store";

/**
 * Where someone goes after signing in. An explicit redirect always wins, so a link
 * that sent them to log in brings them back. Otherwise admins and approved vendors
 * land on the dashboard and everyone else (unverified vendors included) on the site.
 *
 * Login doesn't return the verification status, so it's asked for here, the same
 * way the create-event guard asks. Needs the session token to be stored already.
 */
export const resolveLandingRoute = async (
  user?: TUserDetails | null,
  redirectTo?: string | null,
) => {
  if (redirectTo) return redirectTo;

  if (user?.role === EUserRoles.ADMIN) return ROUTES.DASHBOARD.href;

  if (user?.role === EUserRoles.VENDOR) {
    try {
      const { data } = await getData<{ status?: string }>("/vendor/verification");
      if (data?.data?.status === "approved") return ROUTES.DASHBOARD.href;
    } catch {
      // Can't tell, so treat them like any other user.
    }
  }

  return ROUTES.HOME.href;
};
