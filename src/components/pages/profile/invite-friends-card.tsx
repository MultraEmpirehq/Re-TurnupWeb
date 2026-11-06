"use client";

import { getData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { Skeleton } from "@/components/ui/skeleton";
import { forgetInvite, inviteLink, readInvite } from "@/lib/invite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Gift, Share2 } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { toast } from "@/lib/toast";

type TPrice = { amount: number; formatted: { withCurrency: string } };

type TReferralMe = {
  code: string | null;
  canAddCode: boolean;
  addCodeUntil: string | null;
  counts: { invited: number; pending: number; rewarded: number };
  earnings: { currency: string; earned: TPrice; pending: TPrice }[];
  referredBy: string | null;
  rules: { rewardSharePercent: number; attachWindowDays: number };
};

const QUERY_KEY = ["referrals", "me"];

const copy = (value: string, what: string) =>
  navigator.clipboard
    ?.writeText(value)
    .then(() => toast.success(`${what} copied`))
    .catch(() => toast.error("Couldn't copy"));

/**
 * The user's invite code (their username) and link to share, what it's earned,
 * and, while they're new enough, a box to add the code of whoever invited them.
 */
const InviteFriendsCard: React.FC<{ className?: string }> = ({ className }) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () =>
      (await getData<TReferralMe>("/referrals/me")).data?.data ?? null,
  });
  const [code, setCode] = useState("");
  // A code from an invite link they opened after signing up.
  useEffect(() => {
    const stored = readInvite();
    if (stored) setCode(stored);
  }, []);

  const apply = useMutation({
    mutationFn: async () =>
      (
        await postData<{ code: string }, { invitedBy: string }>(
          "/referrals/apply",
          { code: code.trim() },
        )
      ).data?.data,
    onSuccess: (result) => {
      forgetInvite();
      setCode("");
      toast.success(
        `Added. ${result?.invitedBy ?? "Your friend"} invited you.`,
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) =>
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't add that code",
        ),
      ),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-[1.75rem]" />;
  }
  if (!data?.code) return null;

  const link = inviteLink(data.code);
  const share = () => {
    const text = `Join me on Turnupz and find what's on. Use my code ${data.code} when you sign up.`;
    if (navigator.share) {
      navigator.share({ title: "Turnupz", text, url: link }).catch(() => {});
    } else {
      void copy(`${text} ${link}`, "Invite");
    }
  };

  return (
    <section
      className={
        className ??
        "rounded-[1.75rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8"
      }
    >
      <div className="flex items-center gap-2">
        <Gift className="size-5 text-primary-600" />
        <h2 className="text-base font-bold text-secondary-950">
          Invite friends
        </h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-secondary-600">
        When a friend signs up with your code and buys their first ticket, you
        both get Turnupz Credit to spend on tickets.
      </p>

      <div className="mt-5 rounded-2xl bg-secondary-50 p-4">
        <p className="text-xs font-semibold tracking-wide text-secondary-500 uppercase">
          Your code
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate font-mono text-xl font-bold text-secondary-950">
            {data.code}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Copy your code"
            onClick={() => copy(data.code!, "Code")}
          >
            <Copy className="size-4" />
          </Button>
        </div>
        <p className="mt-2 truncate text-xs text-secondary-500">{link}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-2xl"
          onClick={() => copy(link, "Link")}
        >
          <Copy className="size-4" />
          Copy link
        </Button>
        <Button
          type="button"
          className="h-11 rounded-2xl bg-secondary-400 text-white hover:bg-secondary-500"
          onClick={share}
        >
          <Share2 className="size-4" />
          Share
        </Button>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Joined", value: data.counts.invited },
          { label: "Pending", value: data.counts.pending },
          { label: "Rewarded", value: data.counts.rewarded },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-secondary-100 p-2"
          >
            <dt className="text-xs text-secondary-500">{item.label}</dt>
            <dd className="text-lg font-bold text-secondary-950">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {data.earnings.map((row) => (
        <p key={row.currency} className="mt-3 text-sm text-secondary-700">
          Earned {row.earned.formatted.withCurrency}
          {row.pending.amount > 0 &&
            ` · ${row.pending.formatted.withCurrency} on the way`}
        </p>
      ))}

      {data.referredBy && (
        <p className="mt-4 text-sm text-secondary-600">
          You were invited by{" "}
          <span className="font-semibold">{data.referredBy}</span>.
        </p>
      )}

      {data.canAddCode && (
        <form
          className="mt-5 space-y-2 border-t border-secondary-100 pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim()) apply.mutate();
          }}
        >
          <InputField
            label="Got an invite code?"
            placeholder="A friend's username or a promo code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoCapitalize="none"
            helperText={
              data.addCodeUntil
                ? `You can add one until ${new Date(data.addCodeUntil).toLocaleDateString(undefined, { day: "numeric", month: "short" })}, before your first purchase.`
                : undefined
            }
          />
          <Button
            type="submit"
            variant="outline"
            className="h-11 w-full rounded-2xl"
            disabled={!code.trim() || apply.isPending}
            loading={apply.isPending}
          >
            Add code
          </Button>
        </form>
      )}
    </section>
  );
};

export default memo(InviteFriendsCard);
