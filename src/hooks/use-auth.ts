import useUserStore, { TUserDetails } from "@/stores/user-store";
import { useCallback } from "react";
import useUser from "./use-user.hook";

const useAuth = () => {
  const setUserDetails = useUserStore((state) => state?.setUserDetails);
  const { getUserDetails } = useUser();
  const performAuthOperation = useCallback(
    async (userDetails?: TUserDetails) => {
      if (userDetails) {
        setUserDetails(userDetails);
      }
      if (!userDetails) {
        await getUserDetails();
      }
    },
    [setUserDetails, getUserDetails],
  );
  return { performAuthOperation };
};

export default useAuth;
