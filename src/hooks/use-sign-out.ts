import { postData } from "@/api";
import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import useWorkspaceStore from "@/stores/workspace-store";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Signs out from any header or sidebar. Admins go back to their own sign-in page,
 * since the public one turns them away; everyone else goes to the home page.
 */
const useSignOut = () => {
  const router = useRouter();
  const clearStore = useUserStore((state) => state.clearStore);
  const role = useUserStore((state) => state.userDetails?.role);

  return useCallback(() => {
    const destination =
      role === EUserRoles.ADMIN ? ROUTES.ADMIN_LOGIN.href : ROUTES.HOME.href;
    // Ends the session on the server too, so it leaves the signed-in devices
    // list. Best effort: signing out here never waits on it.
    void postData("/user/logout").catch(() => undefined);
    clearStore();
    useWorkspaceStore.getState().clearWorkspace();
    router.push(destination);
  }, [clearStore, role, router]);
};

export default useSignOut;
