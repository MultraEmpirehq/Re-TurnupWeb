"use client";

import { constructErrorMessage } from "@/api/functions";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Input } from "@/components/ui/input";
import ResultPagination from "@/components/ui/result-pagination";
import {
  IAdminReferral,
  REFERRALS_PAGE_SIZE,
  TReferralStatus,
  useAdminReferrals,
  useReferralSummary,
} from "@/hooks/use-admin-referrals";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowRight, Gift, Search } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  FilterTabs,
  ListSkeleton,
  PageHeading,
} from "../moderation/moderation-ui";

export const REFERRAL_STATUS: Record<
  TReferralStatus,
  { label: string; className: string; hint: string }
> = {
  ATTACHED: {
    label: "Joined",
    className: "bg-secondary-50 text-secondary-700",
    hint: "Signed up with a code; no qualifying purchase yet.",
  },
  PENDING_REWARD: {
    label: "Reward pending",
    className: "bg-primary-50 text-primary-700",
    hint: "Bought their first ticket; credit releases after the event.",
  },
  REWARDED: {
    label: "Rewarded",
    className: "bg-emerald-50 text-emerald-700",
    hint: "Credit released to both.",
  },
  NOT_ELIGIBLE: {
    label: "Not eligible",
    className: "bg-muted text-muted-foreground",
    hint: "Didn't meet the rules (e.g. shared device, cap reached).",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700",
    hint: "The qualifying order was refunded or disputed.",
  },
};

const STATUS_TABS: { value: TReferralStatus | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "ATTACHED", label: "Joined" },
  { value: "PENDING_REWARD", label: "Pending" },
  { value: "REWARDED", label: "Rewarded" },
  { value: "NOT_ELIGIBLE", label: "Not eligible" },
  { value: "CANCELLED", label: "Cancelled" },
];

const SOURCE_TABS: {
  value: "INVITE" | "INFLUENCER" | undefined;
  label: string;
}[] = [
  { value: undefined, label: "Every source" },
  { value: "INVITE", label: "Friend invites" },
  { value: "INFLUENCER", label: "Influencer codes" },
];

const personName = (
  person?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    username: string | null;
  } | null,
) =>
  person
    ? [person.firstName, person.lastName].filter(Boolean).join(" ") ||
      person.username ||
      person.email
    : "—";

const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
}> = ({ label, value, hint }) => (
  <div className="rounded-xl border border-border bg-card p-4" title={hint}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
  </div>
);

/** Who referred whom: every sign-up that came with a friend's or an influencer's code. */
const Referrals = () => {
  const [status, setStatus] = useState<TReferralStatus | undefined>();
  const [source, setSource] = useState<"INVITE" | "INFLUENCER" | undefined>();
  const [search, setSearch] = useState("");
  const [q] = useDebounce(search.trim(), 400);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status, source, q]);

  const summary = useReferralSummary();
  const { data, error, isLoading, refetch } = useAdminReferrals({
    page,
    q: q || undefined,
    status,
    source,
  });
  const referrals = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / REFERRALS_PAGE_SIZE);

  const totals = useMemo(() => {
    const rows = summary.data?.referrals ?? [];
    const count = (match: (row: (typeof rows)[number]) => boolean) =>
      rows.filter(match).reduce((sum, row) => sum + row.count, 0);
    return {
      all: count(() => true),
      invites: count((row) => row.source === "INVITE"),
      influencer: count((row) => row.source === "INFLUENCER"),
      rewarded: count((row) => row.status === "REWARDED"),
    };
  }, [summary.data]);

  return (
    <div className="space-y-6">
      <PageHeading title="Referrals">
        Who referred whom. Friends invite with their username; influencers with
        a code you give them. All rewards on an order together are at most 20%
        of Turnupz&apos;s commission on it (0.8% of the ticket at 4%), and each
        has its own maximum. {summary.data?.rulesNote}
      </PageHeading>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sign-ups with a code" value={totals.all} />
        <Stat label="From friend invites" value={totals.invites} />
        <Stat label="From influencer codes" value={totals.influencer} />
        <Stat label="Rewarded" value={totals.rewarded} />
      </div>

      {!!summary.data?.credit.length && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3 font-medium">Turnupz Credit</th>
                <th className="p-3 font-medium">On the way</th>
                <th className="p-3 font-medium">Spendable</th>
                <th className="p-3 font-medium">Spent on tickets</th>
                <th className="p-3 font-medium">Expired</th>
              </tr>
            </thead>
            <tbody>
              {summary.data.credit.map((row) => (
                <tr
                  key={row.currency}
                  className="border-b border-border last:border-0"
                >
                  <td className="p-3 font-semibold">{row.currency}</td>
                  <td className="p-3">{row.pending.formatted.withCurrency}</td>
                  <td className="p-3">
                    {row.available.formatted.withCurrency}
                  </td>
                  <td className="p-3">{row.spent.formatted.withCurrency}</td>
                  <td className="p-3">{row.expired.formatted.withCurrency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search names, emails, usernames or the code"
            className="pl-9"
          />
        </div>
        <FilterTabs tabs={SOURCE_TABS} value={source} onChange={setSource} />
        <FilterTabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
      </div>

      {isLoading && <ListSkeleton />}

      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Could not load referrals",
          )}
          retryFunction={() => void refetch()}
        />
      )}

      {!isLoading && !error && referrals.length === 0 && (
        <EmptyContainer
          icon={<Gift className="size-6" />}
          title="No referrals here"
          description="Sign-ups that used an invite or influencer code show up here."
        />
      )}

      {referrals.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3 font-medium">Referred by</th>
                <th className="p-3 font-medium" />
                <th className="p-3 font-medium">New person</th>
                <th className="p-3 font-medium">Code</th>
                <th className="p-3 font-medium">Joined</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <ReferralRow key={referral.id} referral={referral} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <ResultPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

const ReferralRow: React.FC<{ referral: IAdminReferral }> = ({ referral }) => {
  const status = REFERRAL_STATUS[referral.status];
  const byInfluencer = referral.source === "INFLUENCER";
  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="p-3">
        {byInfluencer ? (
          <>
            <p className="font-medium">{referral.influencerCode?.name}</p>
            <p className="text-xs text-muted-foreground">Influencer</p>
          </>
        ) : (
          <>
            <p className="font-medium">{personName(referral.referrer)}</p>
            <p className="text-xs text-muted-foreground">
              {referral.referrer?.email}
            </p>
          </>
        )}
      </td>
      <td className="p-3 text-muted-foreground">
        <ArrowRight className="mt-0.5 size-4" />
      </td>
      <td className="p-3">
        <p className="font-medium">{personName(referral.referred)}</p>
        <p className="text-xs text-muted-foreground">
          {referral.referred.email}
        </p>
      </td>
      <td className="p-3 font-mono text-xs">{referral.codeUsed}</td>
      <td className="p-3 whitespace-nowrap text-muted-foreground">
        {format(new Date(referral.attachedAt), "d MMM yyyy")}
      </td>
      <td className="p-3">
        <span
          title={referral.statusReason ?? status.hint}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
            status.className,
          )}
        >
          {status.label}
        </span>
        {referral.statusReason && (
          <p className="mt-1 max-w-[180px] text-xs text-muted-foreground">
            {referral.statusReason}
          </p>
        )}
      </td>
      <td className="p-3 text-xs">
        {referral.grants.length ? (
          referral.grants.map((grant, index) => (
            <p key={index}>
              {grant.amount.formatted.withCurrency}{" "}
              <span className="text-muted-foreground">
                to{" "}
                {grant.userId === referral.referred.id
                  ? "new person"
                  : "referrer"}{" "}
                · {grant.state.toLowerCase()}
              </span>
            </p>
          ))
        ) : (
          <span className="text-muted-foreground">None yet</span>
        )}
      </td>
    </tr>
  );
};

export default memo(Referrals);
