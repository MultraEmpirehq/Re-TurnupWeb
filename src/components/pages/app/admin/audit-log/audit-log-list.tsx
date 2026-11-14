"use client";

import ScrollRow from "@/components/ui/scroll-row";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Input } from "@/components/ui/input";
import ResultPagination from "@/components/ui/result-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AUDIT_PAGE_SIZE,
  IAuditLogEntry,
  TAuditTargetType,
  useAdminAuditLogs,
  useAuditActions,
} from "@/hooks/use-admin-audit-logs";
import PageHeader from "@/components/ui/page-header";
import StatusBadge from "@/components/ui/status-badge";
import AuditEntrySheet from "./audit-entry-sheet";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import UndoEntryButton from "./undo-entry-button";
import {
  actionLabel,
  actionTone,
  summariseDetails,
  TARGET_LABELS,
} from "./audit-format";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollText, Search } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";

const TABS: { value?: TAuditTargetType; label: string }[] = [
  { label: "All" },
  { value: "vendor_verification", label: "Verifications" },
  { value: "event", label: "Events" },
  { value: "category", label: "Categories" },
  { value: "venue", label: "Venues" },
  { value: "faq", label: "FAQs" },
  { value: "admin", label: "Admins" },
  { value: "user", label: "Users" },
  { value: "event_report", label: "Reports" },
  { value: "contact_message", label: "Inquiries" },
  { value: "ticket_transfer", label: "Transfers" },
];

const FIELD =
  "h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

const AuditLogList = () => {
  const [targetType, setTargetType] = useState<TAuditTargetType | undefined>();
  const [action, setAction] = useState("");
  const [actorType, setActorType] = useState<"" | "admin" | "member" | "automatic">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [targetId, setTargetId] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<IAuditLogEntry | null>(null);

  // Debounced so a query is not fired on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [targetType, action, actorType, from, to, targetId, search]);

  const { has } = useAdminPermissions();
  // Undo needs its own permission plus the one for that area.
  const canUndo = (entry: IAuditLogEntry) =>
    !!entry.undo && !entry.undone && has("ACTIONS_UNDO") && has(entry.undo.permission);
  const showUndo = has("ACTIONS_UNDO");

  const { data: actions } = useAuditActions();
  const { data, error, isLoading, refetch } = useAdminAuditLogs({
    targetType,
    action: action || undefined,
    actorType: actorType || undefined,
    from: from || undefined,
    to: to || undefined,
    targetId,
    search,
    page,
  });

  const entries = useMemo(() => data?.entries ?? [], [data]);
  // Worked out here from the total: the api's own page count rounds down and would
  // hide a last, partly filled page.
  const totalPages = Math.ceil((data?.total ?? 0) / AUDIT_PAGE_SIZE);
  const showSkeleton = isLoading && !data;
  const isEmpty = !!data && entries.length === 0;
  const filtered = !!(action || actorType || from || to || targetId || search);
  const clearFilters = () => {
    setAction("");
    setActorType("");
    setFrom("");
    setTo("");
    setTargetId(undefined);
    setSearchInput("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Everything sensitive, newest first: who did it, when, from where, what changed and why. Open an entry for the full record."
      />

      <div className="space-y-3">
        <ScrollRow>
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            {TABS.map((tab) => (
              <Button
                key={tab.label}
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={targetType === tab.value}
                onClick={() => setTargetType(tab.value)}
                className={cn(
                  "rounded-md px-4",
                  targetType === tab.value &&
                    "bg-secondary-800 text-white hover:bg-secondary-800 hover:text-white",
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </ScrollRow>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_auto_minmax(0,1fr)]">
          <select
            aria-label="Action"
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className={FIELD}
          >
            <option value="">Every action</option>
            {(actions ?? []).map((row) => (
              <option key={row.action} value={row.action}>
                {actionLabel(row.action)} ({row.count})
              </option>
            ))}
          </select>
          <select
            aria-label="Who"
            value={actorType}
            onChange={(event) => setActorType(event.target.value as typeof actorType)}
            className={FIELD}
          >
            <option value="">Anyone</option>
            <option value="admin">Admins</option>
            <option value="member">Organisers and attendees</option>
            <option value="automatic">Automatic</option>
          </select>
          <input
            type="date"
            aria-label="From"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            className={FIELD}
          />
          <input
            type="date"
            aria-label="To"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            className={FIELD}
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Email or name of what it's about"
              className="h-10 rounded-xl pl-9"
              aria-label="Search the audit log"
            />
          </div>
        </div>

        {filtered && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {targetId && (
              <StatusBadge tone="info">One record&apos;s history</StatusBadge>
            )}
            {data && (
              <span className="text-muted-foreground">
                {data.total} entr{data.total === 1 ? "y" : "ies"}
              </span>
            )}
            <button type="button" className="font-semibold text-primary hover:underline" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {showSkeleton && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Could not load the audit log",
          )}
          retryFunction={() => void refetch()}
        />
      )}

      {isEmpty && !error && (
        <EmptyContainer
          icon={<ScrollText className="size-6" />}
          title={filtered ? "Nothing matches" : "Nothing recorded yet"}
          description={
            filtered
              ? "No entry matches these filters."
              : "Admin actions will appear here as they happen."
          }
        />
      )}

      {!showSkeleton && !error && entries.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table label="Audit log">
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>About</TableHead>
                <TableHead>Details</TableHead>
                {showUndo && (
                  <TableHead>
                    <span className="sr-only">Undo</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const summary = summariseDetails(entry);
                return (
                  <TableRow
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => setOpen(entry)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setOpen(entry);
                      }
                    }}
                  >
                    <TableCell className="whitespace-nowrap">
                      <span className="block text-foreground">
                        {format(new Date(entry.createdAt), "d MMM yyyy")}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {format(new Date(entry.createdAt), "HH:mm:ss")}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[14rem]">
                      {entry.actor.id ? (
                        <>
                          <span className="block truncate font-medium">
                            {entry.actorName ?? entry.actor.email}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {entry.actorName ? `${entry.actor.email} · ` : ""}
                            {entry.actor.role === "admin" ? "Admin" : entry.actor.role === "vendor" ? "Organiser" : "Attendee"}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Automatic</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        <StatusBadge tone={actionTone(entry.action)}>{actionLabel(entry.action)}</StatusBadge>
                        {entry.undone && <StatusBadge tone="warning">Undone</StatusBadge>}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[16rem]">
                      <span className="block truncate">{entry.targetLabel ?? entry.targetId ?? "—"}</span>
                      <span className="block text-xs text-muted-foreground">
                        {TARGET_LABELS[entry.targetType] ?? entry.targetType}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[22rem] truncate text-muted-foreground" title={summary}>
                      {summary}
                    </TableCell>
                    {showUndo && (
                      <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                        {canUndo(entry) && <UndoEntryButton entry={entry} />}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <ResultPagination
          totalPages={totalPages}
          currentPage={page}
          onPageChange={setPage}
        />
      )}

      <AuditEntrySheet
        entry={open}
        onOpenChange={(value) => !value && setOpen(null)}
        canUndo={!!open && canUndo(open)}
        onShowHistory={(id) => {
          setOpen(null);
          setTargetType(undefined);
          setTargetId(id);
        }}
      />
    </div>
  );
};

export default memo(AuditLogList);
