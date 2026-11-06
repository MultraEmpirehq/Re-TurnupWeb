"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import ResultPagination from "@/components/ui/result-pagination";
import {
  TWaitlistRole,
  TWaitlistSignup,
  WAITLIST_PAGE_SIZE,
  fetchWholeWaitlist,
  useWaitlist,
} from "@/hooks/use-admin-waitlist";
import { format } from "date-fns";
import { BadgeCheck, Clock, Download, ListChecks, Mail } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { ListSkeleton, PageHeading } from "../moderation/moderation-ui";

const csvCell = (value: string | null | undefined) =>
  `"${(value ?? "").replace(/"/g, '""')}"`;

const ROLE_LABEL: Record<TWaitlistRole, string> = {
  attendee: "Attendee",
  organiser: "Organiser",
  both: "Both",
};
const roleOf = (row: TWaitlistSignup) => row.role ?? row.interest;

/** What they agreed to hear about, in the order the form asks. */
const CONSENTS: { key: keyof TWaitlistSignup; label: string }[] = [
  { key: "launchEmails", label: "Launch" },
  { key: "marketingConsent", label: "Marketing" },
  { key: "newsletterConsent", label: "Newsletter" },
  { key: "researchConsent", label: "Research" },
  { key: "personalizationConsent", label: "Personalised" },
];
const yesNo = (value: unknown) => (value ? "Yes" : "No");
const when = (value: string | null) => (value ? format(new Date(value), "yyyy-MM-dd HH:mm") : "");

const toCsv = (rows: TWaitlistSignup[]) =>
  [
    "Email,Name,Here as,Country,Country code,City,Email confirmed,Launch emails,Marketing,Newsletter,Research,Personalised,Terms accepted,Privacy notice,Source,Joined",
    ...rows.map((row) =>
      [
        csvCell(row.email),
        csvCell(row.name),
        csvCell(roleOf(row) ? ROLE_LABEL[roleOf(row)!] : ""),
        csvCell(row.country),
        csvCell(row.countryCode),
        csvCell(row.city),
        csvCell(when(row.emailConfirmedAt)),
        ...CONSENTS.map((consent) => csvCell(yesNo(row[consent.key]))),
        csvCell(when(row.termsAcceptedAt)),
        csvCell(row.privacyNoticeVersion),
        csvCell(row.source),
        csvCell(when(row.createdAt)),
      ].join(","),
    ),
  ].join("\n");

/** Everyone who joined the waitlist on the Coming soon page. */
const Waitlist = () => {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const { data, error, isLoading, refetch } = useWaitlist(q, page);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      const rows = await fetchWholeWaitlist();
      const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `turnupz-waitlist-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      toast.error(
        constructErrorMessage(downloadError as TApiErrorResponseType, "Couldn't download the list."),
      );
    } finally {
      setDownloading(false);
    }
  };

  const items = data?.items ?? [];
  const totals = data?.totals;
  const totalPages = Math.ceil((data?.matching ?? 0) / WAITLIST_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading title="Waitlist">
          People who asked to hear when Turnupz opens, from the Coming soon page
          (turnupz.com/coming-soon). Only confirmed emails should get launch and
          marketing emails. Add ?ref=instagram to the link to see where they came from.
        </PageHeading>
        <div className="flex flex-wrap gap-2">
        <Button asChild className="gap-2">
          <Link href="/app/admin/marketing/waitlist/email">
            <Mail className="size-4" />
            Email the waitlist
          </Link>
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => void download()} loading={downloading}>
          <Download className="size-4" />
          Download CSV
        </Button>
        </div>
      </div>

      {!!totals && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "On the list", value: totals.total },
            { label: "Confirmed their email", value: totals.confirmed ?? 0 },
            { label: "Joined in the last 7 days", value: totals.lastWeek },
            { label: "Want to host events", value: totals.organisers },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-white p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by email, name, country or city"
        className="h-11 w-full max-w-md rounded-lg border px-3 text-sm outline-none focus:border-primary-400"
      />

      {error ? (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "Couldn't load the waitlist.")}
          retryFunction={() => void refetch()}
        />
      ) : isLoading ? (
        <ListSkeleton />
      ) : !items.length ? (
        <EmptyContainer
          icon={<ListChecks className="size-6" />}
          title={q ? "No one matches that" : "No one yet"}
          description="Sign-ups from the Coming soon page will show up here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-secondary-50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Here as</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Agreed to</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const role = roleOf(row);
                const agreed = CONSENTS.filter((consent) => row[consent.key]);
                return (
                <tr key={row.id} className="border-b align-top last:border-0">
                  <td className="px-4 py-3">
                    <span className="block font-medium">{row.email}</span>
                    {row.emailConfirmedAt ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <BadgeCheck className="size-3.5" aria-hidden />
                        Confirmed
                      </span>
                    ) : (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                        <Clock className="size-3.5" aria-hidden />
                        Not confirmed yet
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{row.name ?? "—"}</td>
                  <td className="px-4 py-3">{role ? ROLE_LABEL[role] : "—"}</td>
                  <td className="px-4 py-3">
                    {row.country ?? "—"}
                    {row.city && <span className="block text-xs text-muted-foreground">{row.city}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {agreed.length ? (
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {agreed.map((consent) => (
                          <span key={consent.key} className="rounded-full bg-secondary-50 px-2 py-0.5 text-xs text-secondary-700">
                            {consent.label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Nothing extra</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.source ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(row.createdAt), "d MMM yyyy, HH:mm")}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <ResultPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
};

export default memo(Waitlist);
