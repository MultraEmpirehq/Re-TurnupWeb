"use client";

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
} from "@/hooks/use-admin-permissions";
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
];

// What each recorded action reads as, and the colour of its pill.
const ACTIONS: Record<string, { label: string; tone: string }> = {
  "vendor_verification.reviewed": {
    label: "Reviewed verification",
    tone: "bg-blue-50 text-blue-700",
  },
  "event.deleted": { label: "Deleted event", tone: "bg-red-50 text-red-700" },
  "event.suspended": {
    label: "Suspended event",
    tone: "bg-amber-50 text-amber-800",
  },
  "event.restored": {
    label: "Restored event",
    tone: "bg-emerald-50 text-emerald-700",
  },
  "category.created": {
    label: "Created category",
    tone: "bg-emerald-50 text-emerald-700",
  },
  "category.updated": {
    label: "Edited category",
    tone: "bg-muted text-muted-foreground",
  },
  "category.deleted": {
    label: "Deleted category",
    tone: "bg-red-50 text-red-700",
  },
  "venue.created": {
    label: "Created venue",
    tone: "bg-emerald-50 text-emerald-700",
  },
  "venue.updated": {
    label: "Edited venue",
    tone: "bg-muted text-muted-foreground",
  },
  "venue.deleted": { label: "Deleted venue", tone: "bg-red-50 text-red-700" },
  "faq.created": { label: "Added FAQ", tone: "bg-emerald-50 text-emerald-700" },
  "faq.updated": {
    label: "Edited FAQ",
    tone: "bg-muted text-muted-foreground",
  },
  "faq.deleted": { label: "Deleted FAQ", tone: "bg-red-50 text-red-700" },
  "admin.added": { label: "Added admin", tone: "bg-emerald-50 text-emerald-700" },
  "admin.permissions_changed": {
    label: "Changed permissions",
    tone: "bg-blue-50 text-blue-700",
  },
  "admin.suspended": {
    label: "Suspended admin",
    tone: "bg-amber-50 text-amber-800",
  },
  "admin.reactivated": {
    label: "Reactivated admin",
    tone: "bg-emerald-50 text-emerald-700",
  },
  "admin.removed": { label: "Removed admin", tone: "bg-red-50 text-red-700" },
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
        <h1 className="text-xl font-bold text-secondary-800">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Sensitive actions across the platform, newest first: verification
          decisions, event removals and suspensions, catalogue changes and changes
          to admin access.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex flex-wrap rounded-lg border border-border bg-card p-1">
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
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
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
                      {entry.actor.email ?? "Unknown"}
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
