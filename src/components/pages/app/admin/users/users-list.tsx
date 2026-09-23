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
import { useAdminUsers } from "@/hooks/use-admin-users";
import { IAdminUserListItem, TAdminUserType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EUserRoles } from "@/stores/user-store";
import { format } from "date-fns";
import { Search, Users } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import UserDetailsSheet from "./user-details-sheet";

const TABS: { value: TAdminUserType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "vendors", label: "Vendors" },
  { value: "users", label: "Users" },
];

const ROLE_TONE: Record<string, string> = {
  [EUserRoles.ADMIN]: "bg-purple-50 text-purple-700",
  [EUserRoles.VENDOR]: "bg-blue-50 text-blue-700",
  [EUserRoles.USER]: "bg-muted text-muted-foreground",
};

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
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-secondary-800">Users</h1>
        <p className="text-sm text-muted-foreground">
          Every account on the platform. Open one to see its details.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              : "There are no accounts in this group yet."
          }
        />
      )}

      {!showSkeleton && !error && users.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
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
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">
                    {displayName(user)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        ROLE_TONE[user.role ?? ""] ?? ROLE_TONE[EUserRoles.USER],
                      )}
                    >
                      {user.role ?? "—"}
                    </span>
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
