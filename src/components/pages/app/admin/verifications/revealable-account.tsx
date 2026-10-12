"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

type TRevealed = {
  accountNumber: string | null;
  routingNumber: string | null;
  sortCode: string | null;
  iban: string | null;
};

const LABELS: Record<keyof TRevealed, string> = {
  accountNumber: "Account number",
  routingNumber: "Routing / branch",
  sortCode: "Sort code",
  iban: "IBAN",
};

/** How long full details stay on screen before they're masked again. */
const SHOW_FOR_MS = 60_000;

/**
 * The masked account, with Show to see the full bank details. Each look goes
 * through the API, which records it in the audit log, and the details mask
 * themselves again after a minute.
 */
const RevealableAccount: React.FC<{
  verificationId: string;
  last4: string | null;
}> = ({ verificationId, last4 }) => {
  const [revealed, setRevealed] = useState<TRevealed | null>(null);
  const queryClient = useQueryClient();
  const reveal = useMutation({
    mutationFn: async () => {
      const { data } = await postData<undefined, TRevealed>(
        `/admin/vendor-verifications/${verificationId}/reveal-payout`,
      );
      return data?.data ?? null;
    },
    onSuccess: (details) => {
      setRevealed(details);
      // The look is now in the history.
      void queryClient.invalidateQueries({
        queryKey: ["admin-verifications", "review", verificationId],
      });
    },
    onError: (error) =>
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't show the account details",
        ),
      ),
  });

  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setRevealed(null), SHOW_FOR_MS);
    return () => clearTimeout(timer);
  }, [revealed]);

  // A different application never shows the last one's details.
  useEffect(() => setRevealed(null), [verificationId]);

  if (!last4) return <span>—</span>;

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => reveal.mutate()}
        disabled={reveal.isPending}
        className="group inline-flex items-center gap-1.5 rounded-md text-left hover:text-secondary-800 disabled:opacity-60"
        title="Show the full bank details (this is logged)"
      >
        <span className="font-mono">•••• {last4}</span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary-500 underline-offset-2 group-hover:underline">
          <Eye className="size-3.5" />
          {reveal.isPending ? "Showing…" : "Show"}
        </span>
      </button>
    );
  }

  const shown = (Object.keys(LABELS) as (keyof TRevealed)[]).filter(
    (field) => !!revealed[field],
  );
  const copy = (value: string) =>
    navigator.clipboard
      ?.writeText(value)
      .then(() => toast.success("Copied"))
      .catch(() => toast.error("Couldn't copy"));

  // Only the last four digits were ever stored for this application (test data,
  // or a submission from before full numbers were kept): say so, not nothing.
  if (!shown.length) {
    return (
      <span className="flex flex-col gap-1.5">
        <span className="font-mono">•••• {last4}</span>
        <span className="text-xs text-muted-foreground">
          The full account number isn&apos;t on file for this application, only
          the last four digits. Ask the vendor to re-enter their bank details.
        </span>
        <button
          type="button"
          onClick={() => setRevealed(null)}
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-secondary-600 hover:underline"
        >
          <EyeOff className="size-3.5" /> Hide
        </button>
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-1.5">
      {shown.map((field) => (
        <span key={field} className="flex items-center gap-2">
          {shown.length > 1 && (
            <span className="text-xs text-muted-foreground">
              {LABELS[field]}
            </span>
          )}
          <span className="font-mono tracking-wide">{revealed[field]}</span>
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            aria-label={`Copy ${LABELS[field].toLowerCase()}`}
            onClick={() => copy(revealed[field]!)}
          >
            <Copy className="size-3.5" />
          </Button>
        </span>
      ))}
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        Your viewing is logged. Hides in a minute.
        <button
          type="button"
          onClick={() => setRevealed(null)}
          className="inline-flex items-center gap-1 font-medium text-secondary-600 hover:underline"
        >
          <EyeOff className="size-3.5" /> Hide
        </button>
      </span>
    </span>
  );
};

export default RevealableAccount;
