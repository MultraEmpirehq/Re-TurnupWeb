"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, MailX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { memo, useEffect, useRef, useState } from "react";

/**
 * The link in every waitlist email: no more waitlist emails of any kind.
 * Works straight from the link, with nothing to sign in to.
 */
const Unsubscribe = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<"working" | "done" | "failed">(id && token ? "working" : "failed");
  const [error, setError] = useState(id && token ? "" : "This unsubscribe link isn't complete.");
  const ran = useRef(false);

  useEffect(() => {
    if (!id || !token || ran.current) return;
    ran.current = true;
    postData("/waitlist/unsubscribe", { id, token })
      .then(() => setState("done"))
      .catch((failure) => {
        setError(constructErrorMessage(failure as TApiErrorResponseType, "We couldn't unsubscribe you."));
        setState("failed");
      });
  }, [id, token]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      {state === "working" ? (
        <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
      ) : state === "done" ? (
        <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
      ) : (
        <MailX className="size-12 text-secondary-400" aria-hidden />
      )}
      <h1 className="text-2xl font-bold text-secondary-950">
        {state === "working" ? "Unsubscribing…" : state === "done" ? "You're unsubscribed" : "That didn't work"}
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">
        {state === "done"
          ? "You won't get any more emails from the Turnupz waitlist. Emails about tickets you buy still come, since they're about your orders."
          : state === "failed"
            ? `${error} Email info@turnupz.com and we'll take you off the list.`
            : "One moment."}
      </p>
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/">Go to Turnupz</Link>
      </Button>
    </main>
  );
};

export default memo(Unsubscribe);
