import { TAuthIntent, withIntent } from "@/lib/auth-intent";
import { ROUTES } from "@/lib/variables";
import { EUserRoles, TUserDetails } from "@/stores/user-store";

/**
 * Whether a signed-in account still owes its sign-up details. Setting a password
 * finishes the account on the api, but the name, username and date of birth come
 * after, so they're checked here (as the app does). Admins are created by the
 * team and aren't asked.
 */
export const needsProfileDetails = (user?: TUserDetails | null) =>
  !!user &&
  user.role !== EUserRoles.ADMIN &&
  (user.isAccountCreationCompleted === false ||
    !user.firstName ||
    !user.username ||
    !user.dateOfBirth);

/** Where to finish sign-up, coming back to `redirectTo` afterwards. */
export const completeProfileRoute = (
  redirectTo?: string | null,
  intent: TAuthIntent = "attendee",
) =>
  withIntent(
    redirectTo
      ? `${ROUTES.COMPLETE_USER_INFORMATION.href}?redirect=${encodeURIComponent(redirectTo)}`
      : ROUTES.COMPLETE_USER_INFORMATION.href,
    intent,
  );
