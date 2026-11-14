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
import { useAdminUsers } from "@/hooks/use-admin-users";
import { IAdminUserListItem, TAdminUserType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EUserRoles } from "@/stores/user-store";
import { format } from "date-fns";
import { Search, Users } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import UserDetailsSheet from "./user-details-sheet";
import PageHeader from "@/components/ui/page-header";
import StatusBadge, { type TTone } from "@/components/ui/status-badge";

const TABS: { value: TAdminUserType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "vendors", label: "Vendors" },
  { value: "applicants", label: "Applicants" },
  { value: "users", label: "Users" },
  { value: "suspended", label: "Suspended" },
  { value: "restricted", label: "Restricted" },
  { value: "unverified", label: "Unverified" },
];

const TAB_NOTES: Partial<Record<TAdminUserType, string>> = {
  applicants:
    "People partway through applying to host, or organisers asking to sell tickets. Open one to go to their application.",
  unverified:
    "People who signed up but haven't verified their email yet. They aren't counted as users until they do.",
  suspended: "Accounts that can't sign in until an admin reactivates them.",
  restricted:
    "Accounts that can sign in but can't publish new events, get or send tickets, or message. Organisers' payouts are held.",
};

/** Suspension wins over verification: a suspended account can't sign in either way. */
const accountStatus = (user: IAdminUserListItem): { label: string; tone: TTone } =>
  user.isAccountDisabled
    ? { label: "Suspended", tone: "danger" }
    : user.isRestricted
      ? { label: "Restricted", tone: "warning" }
      : user.isEmailVerified === false && user.role !== EUserRoles.ADMIN
        ? { label: "Unverified", tone: "neutral" }
        : { label: "Active", tone: "success" };

/** The API's account type; the bare role only if it's missing. */
const accountType = (user: IAdminUserListItem): { label: string; tone: TTone } =>
  user.accountType ??
  (user.role === EUserRoles.ADMIN
    ? { label: "Admin", tone: "info" }
    : user.role === EUserRoles.VENDOR
      ? { label: "Organiser", tone: "success" }
      : { label: "Attendee", tone: "neutral" });

const displayName = (user: IAdminUserListItem) =>
  user.name?.trim() || user.username || user.email || "Unnamed";

const UsersList = () => {
  const [type, setType] = useState<TAdminUserType>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openUserId, setOpenUserId] = useState<string | undefined>();

  // Debounced so a query is not fired on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // A narrower filter can leave fewer pages than the one being viewed, which would
  // otherwise strand the admin on an empty page.
  useEffect(() => {
    setPage(1);
  }, [type, search]);

  const { data, error, isLoading, refetch } = useAdminUsers({
    type,
    search,
    page,
  });

  const users = useMemo(() => data?.users ?? [], [data]);
  const pagination = data?.pagination;
  const showSkeleton = isLoading && !data;
  const isEmpty = !!data && users.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={
          TAB_NOTES[type] ??
          "Every account that has verified its email. Open one to see its details."
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ScrollRow>
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            {TABS.map((tab) => (
              <Button
                key={tab.value}
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={type === tab.value}
                onClick={() => setType(tab.value)}
                className={cn(
                  "rounded-md px-4",
                  type === tab.value &&
                    "bg-secondary-800 text-white hover:bg-secondary-800 hover:text-white",
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </ScrollRow>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email or username"
            className="pl-9"
            aria-label="Search users"
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
            "Could not load users",
          )}
          retryFunction={() => void refetch()}
        />
      )}

      {isEmpty && !error && (
        <EmptyContainer
          icon={<Users className="size-6" />}
          title="No users found"
          description={
            search
              ? "No account matches that search."
              : type === "suspended"
                ? "No account is suspended."
                : type === "restricted"
                  ? "No account is restricted."
                : type === "unverified"
                  ? "Everyone who signed up has verified their email."
                  : "There are no accounts in this group yet."
          }
        />
      )}

      {!showSkeleton && !error && users.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table label="Users">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Account type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenUserId(user.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setOpenUserId(user.id);
                    }
                  }}
                  className={cn(
                    "cursor-pointer",
                    user.isAccountDisabled && "bg-danger-soft/40",
                  )}
                >
                  <TableCell className="font-medium">
                    {displayName(user)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={accountType(user).tone}>
                      {accountType(user).label}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={accountStatus(user).tone}>
                      {accountStatus(user).label}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.country ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {user.createdAt
                      ? format(new Date(user.createdAt), "d MMM yyyy")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!!pagination && pagination.totalPage > 1 && (
        <ResultPagination
          totalPages={pagination.totalPage}
          currentPage={pagination.presentPage}
          onPageChange={setPage}
        />
      )}

      <UserDetailsSheet
        userId={openUserId}
        open={!!openUserId}
        onOpenChange={(open) => !open && setOpenUserId(undefined)}
      />
    </div>
  );
};

export default memo(UsersList);
