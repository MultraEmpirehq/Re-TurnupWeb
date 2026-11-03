import { getData } from "@/api";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { useActiveWorkspace } from "@/stores/workspace-store";
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
      const { data } = await getData<{
        status?: TVerificationStatus;
        approvalLevel?: string | null;
        canSellTickets?: boolean;
        organiserName?: string | null;
      }>("/vendor/verification");
      const status = data?.data?.status ?? "not_started";
      return {
        status,
        // Approved once at any level keeps hosting open, e.g. a free host
        // finishing verification to sell tickets; a rejection closes it. The
        // api applies the same rule when an event is published.
        canHost:
          status === "approved" ||
          (!!data?.data?.approvalLevel &&
            !["rejected", "not_started"].includes(status)),
        canSellTickets: !!data?.data?.canSellTickets,
        organiserName: data?.data?.organiserName ?? null,
      };
    },
    enabled: !!userId && !isAdmin,
    retry: 0,
  });
  // On an organiser's team the organiser's account is what counts, and the api
  // enforces their verification on everything the member does.
  const workspace = useActiveWorkspace();
  if (workspace) {
    return {
      status: "approved" as TVerificationStatus,
      isApproved: true,
      canSellTickets: true,
      // The organiser's own name is filled in by the api when it's left blank.
      organiserName: null,
      isChecking: false,
    };
  }

  return {
    status: query.data?.status,
    isApproved: isAdmin || !!query.data?.canHost,
    /** Approved to sell tickets; hosts approved for free events only aren't. */
    canSellTickets: isAdmin || !!query.data?.canSellTickets,
    /** The name their events go out under ("Organised by"). */
    organiserName: query.data?.organiserName ?? null,
    // A failed check counts as "not approved" rather than "still checking".
    isChecking: !isAdmin && !!userId && query.isPending,
  };
};

export default useVendorVerificationStatus;
