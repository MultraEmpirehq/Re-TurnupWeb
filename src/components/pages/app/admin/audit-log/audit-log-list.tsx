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
} from "@/hooks/use-admin-audit-logs";
import {
  ADMIN_PERMISSION_LABELS,
  TAdminPermission,
  useAdminPermissions,
} from "@/hooks/use-admin-permissions";
import UndoEntryButton from "./undo-entry-button";
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

// What each recorded action reads as, and the colour of its pill.
const ACTIONS: Record<string, { label: string; tone: string }> = {
  "vendor_verification.reviewed": {
    label: "Reviewed verification",
    tone: "bg-info-soft text-info",
  },
  "vendor_verification.decision_undone": {
    label: "Undid a decision",
    tone: "bg-warning-soft text-warning",
  },
  "vendor_verification.payout_revealed": {
    label: "Viewed bank details",
    tone: "bg-primary-50 text-primary-700",
  },
  "event.deleted": { label: "Deleted event", tone: "bg-danger-soft text-danger" },
  "event.suspended": {
    label: "Suspended event",
    tone: "bg-secondary-50 text-secondary-800",
  },
  "event.restored": {
    label: "Restored event",
    tone: "bg-success-soft text-success",
  },
  "category.created": {
    label: "Created category",
    tone: "bg-success-soft text-success",
  },
  "category.updated": {
    label: "Edited category",
    tone: "bg-muted text-muted-foreground",
  },
  "category.deleted": {
    label: "Deleted category",
    tone: "bg-danger-soft text-danger",
  },
  "venue.created": {
    label: "Created venue",
    tone: "bg-success-soft text-success",
  },
  "venue.updated": {
    label: "Edited venue",
    tone: "bg-muted text-muted-foreground",
  },
  "venue.deleted": { label: "Deleted venue", tone: "bg-danger-soft text-danger" },
  "faq.created": { label: "Added FAQ", tone: "bg-success-soft text-success" },
  "faq.updated": {
    label: "Edited FAQ",
    tone: "bg-muted text-muted-foreground",
  },
  "faq.deleted": { label: "Deleted FAQ", tone: "bg-danger-soft text-danger" },
  "admin.added": {
    label: "Added admin",
    tone: "bg-success-soft text-success",
  },
  "admin.permissions_changed": {
    label: "Changed permissions",
    tone: "bg-info-soft text-info",
  },
  "admin.suspended": {
    label: "Suspended admin",
    tone: "bg-secondary-50 text-secondary-800",
  },
  "admin.reactivated": {
    label: "Reactivated admin",
    tone: "bg-success-soft text-success",
  },
  "admin.removed": { label: "Removed admin", tone: "bg-danger-soft text-danger" },
  "user.suspended": {
    label: "Suspended user",
    tone: "bg-secondary-50 text-secondary-800",
  },
  "user.restricted": {
    label: "Restricted user",
    tone: "bg-warning-soft text-warning",
  },
  "user.unrestricted": {
    label: "Lifted restriction",
    tone: "bg-success-soft text-success",
  },
  "vendor_verification.id_expiry_set": {
    label: "Set ID expiry",
    tone: "bg-muted text-muted-foreground",
  },
  "vendor_verification.id_renewal_reviewed": {
    label: "Checked new ID",
    tone: "bg-info-soft text-info",
  },
  "user.reactivated": {
    label: "Reactivated user",
    tone: "bg-success-soft text-success",
  },
  "event.approved": {
    label: "Approved event",
    tone: "bg-success-soft text-success",
  },
  "event.rejected": {
    label: "Sent event back",
    tone: "bg-secondary-50 text-secondary-800",
  },
  "event_report.resolved": {
    label: "Resolved report",
    tone: "bg-success-soft text-success",
  },
  "event_report.dismissed": {
    label: "Dismissed report",
    tone: "bg-muted text-muted-foreground",
  },
  "contact_message.resolved": {
    label: "Resolved inquiry",
    tone: "bg-success-soft text-success",
  },
  "ticket_transfer.cancelled": {
    label: "Cancelled transfer",
    tone: "bg-danger-soft text-danger",
  },
};

const permissionNames = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map(
          (permission) =>
            ADMIN_PERMISSION_LABELS[permission as TAdminPermission] ??
            String(permission),
        )
        .join(", ")
    : "";

const DECISIONS: Record<string, string> = {
  id_accepted: "Accepted the new ID",
  id_turned_down: "Turned down the new ID",
  approved: "Approved",
  rejected: "Rejected",
  needs_more_info: "Asked for more info",
};

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/** The one or two facts worth reading at a glance; the rest stays in the record. */
const summariseDetails = (entry: IAuditLogEntry) => {
  const details = entry.details ?? {};
  const parts: string[] = [];
  const undid = text(details.undid);
  if (undid) parts.push(`took back “${DECISIONS[undid] ?? undid}”`);
  if (details.undoneEntryId && !undid) parts.push("undone from the audit log");
  const decision = text(details.decision);
  if (decision) {
    parts.push(DECISIONS[decision] ?? decision);
    const level = text(details.approvalLevel);
    if (level) parts.push(`level: ${level.replace(/_/g, " ")}`);
    const step = text(details.step);
    if (step) parts.push(`step: ${step}`);
  }
  const reason = text(details.reason) ?? text(details.message);
  if (reason) parts.push(`“${reason}”`);
  const added = permissionNames(details.added);
  if (added) parts.push(`gave ${added}`);
  const removed = permissionNames(details.removed);
  if (removed) parts.push(`took ${removed}`);
  if (entry.action === "admin.added") {
    const granted = permissionNames(details.permissions);
    if (granted) parts.push(granted);
  }
  const newRole = text(details.newRole);
  if (newRole) parts.push(`now a ${newRole}`);
  if (Array.isArray(details.fields) && details.fields.length) {
    parts.push(`changed ${details.fields.join(", ")}`);
  }
  return parts.join(" · ") || "—";
};

const AuditLogList = () => {
  const [targetType, setTargetType] = useState<TAuditTargetType | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounced so a query is not fired on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [targetType, search]);

  const { has } = useAdminPermissions();
  // Undo needs its own permission plus the one for that area.
  const canUndo = (entry: IAuditLogEntry) =>
    !!entry.undo && has("ACTIONS_UNDO") && has(entry.undo.permission);
  const showUndo = has("ACTIONS_UNDO");

  const { data, error, isLoading, refetch } = useAdminAuditLogs({
    targetType,
    search,
    page,
  });

  const entries = useMemo(() => data?.entries ?? [], [data]);
  // Worked out here from the total: the api's own page count rounds down and would
  // hide a last, partly filled page.
  const totalPages = Math.ceil((data?.total ?? 0) / AUDIT_PAGE_SIZE);
  const showSkeleton = isLoading && !data;
  const isEmpty = !!data && entries.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Sensitive actions across the platform, newest first: verification
          decisions, event removals and suspensions, catalogue changes and
          changes to admin access.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search admin email or target"
            className="pl-9"
            aria-label="Search the audit log"
          />
        </div>
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
          title="Nothing recorded yet"
          description={
            search
              ? "No entry matches that search."
              : "Admin actions will appear here as they happen."
          }
        />
      )}

      {!showSkeleton && !error && entries.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table label="Audit log">
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
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
                const action = ACTIONS[entry.action] ?? {
                  label: entry.action,
                  tone: "bg-muted text-muted-foreground",
                };
                const summary = summariseDetails(entry);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(entry.createdAt), "d MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.actor.email ?? "Automatic"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                          action.tone,
                        )}
                      >
                        {action.label}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate">
                      {entry.targetLabel ?? entry.targetId ?? "—"}
                    </TableCell>
                    <TableCell
                      className="max-w-[22rem] truncate text-muted-foreground"
                      title={summary}
                    >
                      {summary}
                    </TableCell>
                    {showUndo && (
                      <TableCell className="text-right">
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
    </div>
  );
};

export default memo(AuditLogList);
