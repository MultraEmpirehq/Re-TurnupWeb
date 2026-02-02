import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import useUserStore, { TUserDetails } from "@/stores/user-store";
import { useCallback } from "react";
import { toast } from "sonner";

const useUser = () => {
  const setUserDetails = useUserStore((state) => state?.setUserDetails);
  const getUserDetails = useCallback(
    async (retries: number = 0, shouldThrowError: boolean = false) => {
      try {
        const { data } = await getData<TUserDetails>("/user");
        setUserDetails(data?.data);
      } catch (error) {
        if (retries < 5) {
          return getUserDetails(retries + 1, shouldThrowError);
        }
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Something went wrong while fetching user details!",
          ),
        );
        if (shouldThrowError) {
          throw error;
        }
      }
    },
    [setUserDetails],
  );
  return { getUserDetails };
};

export default useUser;
