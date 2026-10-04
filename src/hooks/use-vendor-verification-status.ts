import { getData } from "@/api";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { useQuery } from "@tanstack/react-query";

type TVerificationStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_more_info";

/**
 * Whether the signed-in account may use the vendor tools. The answer comes from the
 * api alone: the browser's saved verification snapshot isn't tied to an account, so
 * trusting it would let whoever last signed in on this browser decide. Admins aren't
 * vendors and have nothing to verify.
 */
const useVendorVerificationStatus = () => {
  const userId = useUserStore((state) => state.userDetails?.id);
  const isAdmin = useUserStore(
    (state) => state.userDetails?.role === EUserRoles.ADMIN,
  );

  const query = useQuery({
    queryKey: ["vendor-verification-status", userId],
    queryFn: async () => {
      const { data } = await getData<{ status?: TVerificationStatus }>(
        "/vendor/verification",
      );
      return data?.data?.status ?? "not_started";
    },
    enabled: !!userId && !isAdmin,
    retry: 0,
  });

  return {
    status: query.data,
    isApproved: isAdmin || query.data === "approved",
    // A failed check counts as "not approved" rather than "still checking".
    isChecking: !isAdmin && !!userId && query.isPending,
  };
};

export default useVendorVerificationStatus;
