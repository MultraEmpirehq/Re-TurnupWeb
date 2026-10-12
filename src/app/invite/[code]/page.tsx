"use client";

import BrandLoader from "@/components/ui/brand-loader";
import { rememberInvite } from "@/lib/invite";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Where an invite link lands: remember the code, then sign up (it's filled in
 * on the details step). Someone already signed in goes to their profile, where
 * they can still add it if they're new enough.
 */
const InvitePage = () => {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const userDetails = useUserStore((state) => state.userDetails);
  const isLoading = useUserStore((state) => state.isLoading);

  useEffect(() => {
    if (isLoading) return;
    const code = decodeURIComponent(params?.code ?? "").trim();
    if (code) rememberInvite(code);
    router.replace(
      userDetails ? ROUTES.USER_PROFILE.href : ROUTES.SIGNUP.href,
    );
  }, [params?.code, router, userDetails, isLoading]);

  return <BrandLoader fullScreen />;
};

export default InvitePage;
