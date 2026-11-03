"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import ResultPagination from "@/components/ui/result-pagination";
import {
  IEventReport,
  MODERATION_PAGE_SIZE,
  TReportStatus,
  useEventReports,
  useResolveReport,
} from "@/hooks/use-admin-moderation";
import { REPORT_REASON_LABELS } from "@/lib/event-reports";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Flag } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import OrganiserContactDialog, {
  TOrganiserContactTarget,
} from "../../organiser-contact-dialog";
import {
  FilterTabs,
  ListSkeleton,
  NoteDialog,
  PageHeading,
} from "./moderation-ui";

const STATUS_TONES: Record<TReportStatus, string> = {
  open: "bg-secondary-50 text-secondary-800",
  resolved: "bg-emerald-50 text-emerald-700",
  dismissed: "bg-muted text-muted-foreground",
};

const TABS: { value: TReportStatus | undefined; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: undefined, label: "All" },
];

type TClosing = {
  report: IEventReport;
  outcome: "resolved" | "dismissed";
} | null;

/**
 * What attendees have flagged. Open the event to check, reach its organiser if
 * needed, then close the report as resolved (something was done) or dismissed.
 */
const EventReports = () => {
  const [status, setStatus] = useState<TReportStatus | undefined>("open");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status]);
  const { data, error, isLoading, refetch } = useEventReports(status, page);
  const resolve = useResolveReport();
  const [closing, setClosing] = useState<TClosing>(null);
  const [contact, setContact] = useState<TOrganiserContactTarget | null>(null);

  const reports = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / MODERATION_PAGE_SIZE);

  const handleClose = async (note: string) => {
    if (!closing) return;
    try {
      await resolve.mutateAsync({
        id: closing.report.id,
        outcome: closing.outcome,
        note: note || undefined,
      });
      toast.success(
        closing.outcome === "resolved"
          ? "Report resolved."
          : "Report dismissed.",
      );
      setClosing(null);
    } catch (closeError) {
      toast.error(
        constructErrorMessage(
          closeError as TApiErrorResponseType,
          "Couldn't update the report.",
        ),
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading title="Reported Events">
        Events attendees have flagged. Check the event, act if it needs it (you
        can suspend it from Manage Events), then close the report.
      </PageHeading>

      <FilterTabs tabs={TABS} value={status} onChange={setStatus} />

      {isLoading && <ListSkeleton />}

      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Could not load reports",
          )}
          retryFunction={() => void refetch()}
        />
      )}

      {!isLoading && !error && reports.length === 0 && (
        <EmptyContainer
          icon={<Flag className="size-6" />}
          title={status === "open" ? "No open reports" : "No reports here"}
          description="Reports from attendees will show up here."
        />
      )}

      <ul className="space-y-3">
        {reports.map((report) => (
          <li
            key={report.id}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    {REPORT_REASON_LABELS[report.reason] ?? report.reason}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                      STATUS_TONES[report.status],
                    )}
                  >
                    {report.status}
                  </span>
                  {report.event.openReports > 1 && (
                    <span className="text-xs font-medium text-red-700">
                      {report.event.openReports} open reports on this event
                    </span>
                  )}
                </div>
                <p className="font-semibold text-foreground">
                  {report.event.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reported by {report.reporter.name || report.reporter.email}{" "}
                  {formatDistanceToNow(new Date(report.createdAt), {
                    addSuffix: true,
                  })}
                  {" · "}event is {report.event.status.replace("_", " ")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <Link
                    href={`${ROUTES.EXPLORE.href}/event/${report.event.id}`}
                    target="_blank"
                  >
                    <ExternalLink className="size-4" />
                    View event
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() =>
                    setContact({ id: report.event.id, name: report.event.name })
                  }
                >
                  Contact organiser
                </Button>
              </div>
            </div>

            {report.details && (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground">
                &ldquo;{report.details}&rdquo;
              </p>
            )}
            {report.resolutionNote && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Moderator note:
                </span>{" "}
                {report.resolutionNote}
              </p>
            )}

            {report.status === "open" && (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setClosing({ report, outcome: "dismissed" })}
                >
                  Dismiss
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg bg-secondary-800 text-white hover:bg-secondary-900"
                  onClick={() => setClosing({ report, outcome: "resolved" })}
                >
                  Mark resolved
                </Button>
              </div>
            )}
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

      <NoteDialog
        open={!!closing}
        title={
          closing?.outcome === "resolved"
            ? "Mark this report resolved?"
            : "Dismiss this report?"
        }
        description={
          closing?.outcome === "resolved"
            ? "Use this when you acted on it, such as suspending the event. The reporter is thanked."
            : "Use this when nothing needed doing. The reporter is still thanked."
        }
        label="Note (optional)"
        placeholder="What you did or found, for the audit log."
        confirmLabel={
          closing?.outcome === "resolved" ? "Mark resolved" : "Dismiss"
        }
        busy={resolve.isPending}
        onCancel={() => setClosing(null)}
        onConfirm={(note) => void handleClose(note)}
      />

      <OrganiserContactDialog
        target={contact}
        onClose={() => setContact(null)}
      />
    </div>
  );
};

export default memo(EventReports);
