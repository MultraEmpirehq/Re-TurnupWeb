"use client";

import { getData } from "@/api";
import useUserStore, { TUserDetails } from "@/stores/user-store";
import { useEffect, useRef } from "react";

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const userDetails = useUserStore((state) => state.userDetails);
  const setUserDetails = useUserStore((state) => state.setUserDetails);
  const clearStore = useUserStore((state) => state.clearStore);
  const hasValidated = useRef(false);

  useEffect(() => {
    if (hasValidated.current || !userDetails) return;
    hasValidated.current = true;

    getData<TUserDetails>("/user")
      .then(({ data }) => {
        if (data?.data) {
          setUserDetails(data.data);
        }
      })
      .catch((error) => {
        if (error?.response?.status === 401) {
          clearStore();
        }
      });
  }, [userDetails, setUserDetails, clearStore]);

  return <>{children}</>;
};

export default AuthProvider;
