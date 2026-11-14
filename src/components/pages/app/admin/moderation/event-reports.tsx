"use client";

import StatusBadge from "@/components/ui/status-badge";
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
import { toast } from "@/lib/toast";
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
  resolved: "bg-success-soft text-success",
  dismissed: "bg-muted text-muted-foreground",
};

/** "Needs review" is what reached a bar (several people, trusted reporters); single reports wait apart. */
type TTab = "review" | "single" | "resolved" | "dismissed" | "all";
const TABS: { value: TTab; label: string }[] = [
  { value: "review", label: "Needs review" },
  { value: "single", label: "Single reports" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];
const TAB_QUERY: Record<TTab, { status?: TReportStatus; level?: "review" | "single" }> = {
  review: { status: "open", level: "review" },
  single: { status: "open", level: "single" },
  resolved: { status: "resolved" },
  dismissed: { status: "dismissed" },
  all: {},
};

/** How much one report counts, in words. */
const weightNote = (report: IEventReport) =>
  report.weight === 0
    ? "Not counted: the organiser's team"
    : report.weight === 2
      ? "Counts double: ticket holder or buyer"
      : report.weight === 0.5
        ? "Counts half: new account or often dismissed"
        : null;

type TClosing = {
  report: IEventReport;
  outcome: "resolved" | "dismissed";
} | null;

/**
 * What attendees have flagged. Open the event to check, reach its organiser if
 * needed, then close the report as resolved (something was done) or dismissed.
 */
const EventReports = () => {
  const [tab, setTab] = useState<TTab>("review");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [tab]);
  const { data, error, isLoading, refetch } = useEventReports(TAB_QUERY[tab].status, page, TAB_QUERY[tab].level);
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
        Every report is kept, but an event only needs a look once several
        people report it, weighted by trust and reason. Strong scam reports
        from ticket holders pause new sales until you close them.
      </PageHeading>

      <FilterTabs tabs={TABS} value={tab} onChange={setTab} />

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
          title={tab === "review" ? "Nothing needs a look" : "No reports here"}
          description={
            tab === "review"
              ? "Events show up here once enough people report them. Single reports are in their own tab."
              : "Reports from attendees will show up here."
          }
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
                  <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
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
                  {report.event.salesPaused && (
                    <StatusBadge tone="danger">New sales paused</StatusBadge>
                  )}
                  {report.holdsTicket && <StatusBadge tone="info">Ticket holder</StatusBadge>}
                  {report.event.openReports > 1 && (
                    <span className="text-xs font-medium text-danger">
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
                {weightNote(report) && (
                  <p className="text-xs text-muted-foreground">{weightNote(report)}</p>
                )}
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
