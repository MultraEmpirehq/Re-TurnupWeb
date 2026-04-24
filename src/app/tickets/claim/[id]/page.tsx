"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function ClaimTicketPage() {
  const params = useParams();
  const router = useRouter();
  const transferId = params?.id?.toString() ?? "";
  const userDetails = useUserStore((state) => state.userDetails);
  const isLoading = useUserStore((state) => state.isLoading);
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !transferId || hasAttemptedRef.current) {
      return;
    }

    if (!userDetails) {
      const currentUrl = `${ROUTES.TICKET_CLAIM.href.replace(":id", transferId)}`;
      const loginUrl = new URL(ROUTES.LOGIN.href, window.location.origin);
      loginUrl.searchParams.set("redirect", currentUrl);
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      return;
    }

    hasAttemptedRef.current = true;
    (async () => {
      try {
        await postData(`/ticket/transfer/${transferId}/claim`);
        toast.success("Ticket claimed successfully");
        router.replace(ROUTES.PROFILE_TICKETS.href);
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Something went wrong while claiming this ticket!",
          ),
        );
        router.replace(ROUTES.PROFILE_TICKETS.href);
      }
    })();
  }, [isLoading, userDetails, transferId, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-foreground" />
      <p className="text-sm text-muted-foreground">Claiming your ticket...</p>
    </div>
  );
}
