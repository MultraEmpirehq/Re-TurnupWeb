"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import ResultPagination from "@/components/ui/result-pagination";
import {
  IInquiry,
  MODERATION_PAGE_SIZE,
  useInquiries,
  useResolveInquiry,
} from "@/hooks/use-admin-moderation";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Inbox, Mail } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { FilterTabs, ListSkeleton, PageHeading } from "./moderation-ui";

type TStatus = "new" | "resolved" | undefined;
const TABS: { value: TStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "resolved", label: "Resolved" },
  { value: undefined, label: "All" },
];

const replyLink = (inquiry: IInquiry) =>
  `mailto:${inquiry.email}?subject=${encodeURIComponent(
    `Re: ${inquiry.subject || "Your message to Turnupz"}`,
  )}&body=${encodeURIComponent(
    `Hi ${inquiry.name.split(" ")[0] || "there"},\n\n\n\n> ${inquiry.message.replace(/\n/g, "\n> ")}`,
  )}`;

/** Messages sent through the Contact Us form. Reply by email, then mark them done. */
const Inquiries = () => {
  const [status, setStatus] = useState<TStatus>("new");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status]);
  const { data, error, isLoading, refetch } = useInquiries(status, page);
  const resolve = useResolveInquiry();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const inquiries = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / MODERATION_PAGE_SIZE);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await resolve.mutateAsync(id);
      toast.success("Marked as resolved.");
    } catch (resolveError) {
      toast.error(
        constructErrorMessage(
          resolveError as TApiErrorResponseType,
          "Couldn't update it.",
        ),
      );
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading title="Contact Messages">
        Messages from the Contact Us form, newest first. Each one is also
        emailed to the support inbox. Reply by email, then mark it resolved.
      </PageHeading>

      <FilterTabs tabs={TABS} value={status} onChange={setStatus} />

      {isLoading && <ListSkeleton />}

      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Could not load messages",
          )}
          retryFunction={() => void refetch()}
        />
      )}

      {!isLoading && !error && inquiries.length === 0 && (
        <EmptyContainer
          icon={<Inbox className="size-6" />}
          title={status === "new" ? "Inbox zero" : "No messages here"}
          description="Messages from the Contact Us form will show up here."
        />
      )}

      <ul className="space-y-3">
        {inquiries.map((inquiry) => (
          <li
            key={inquiry.id}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {inquiry.subject || "No subject"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {inquiry.name} · {inquiry.email}
                  {inquiry.isSignedInUser && " · signed in"}
                  {" · "}
                  {formatDistanceToNow(new Date(inquiry.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  inquiry.status === "new"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {inquiry.status}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm text-foreground">
              {inquiry.message}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-lg"
              >
                <a href={replyLink(inquiry)}>
                  <Mail className="size-4" />
                  Reply by email
                </a>
              </Button>
              {inquiry.status === "new" && (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg bg-secondary-800 text-white hover:bg-secondary-900"
                  loading={resolvingId === inquiry.id}
                  disabled={!!resolvingId}
                  onClick={() => void handleResolve(inquiry.id)}
                >
                  Mark resolved
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <ResultPagination
          totalPages={totalPages}
          currentPage={page}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default memo(Inquiries);
