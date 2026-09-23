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
import { useAdminVerifications } from "@/hooks/use-admin-verifications";
import { IVendorVerification, TVerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BadgeCheck, Search } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import StatusPill from "../status-pill";
import VerificationReviewSheet from "./verification-review-sheet";

type TFilter = TVerificationStatus | "all";

const FILTERS: { value: TFilter; label: string }[] = [
  { value: "submitted", label: "Awaiting review" },
  { value: "needs_more_info", label: "Needs more info" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const vendorName = (verification: IVendorVerification) => {
  const vendor = verification.vendor;
  const legal = [verification.legalFirstName, verification.legalLastName]
    .filter(Boolean)
    .join(" ");
  return vendor?.name?.trim() || legal || vendor?.username || "Unnamed vendor";
};

const VerificationsList = () => {
  // Defaults to the queue actually awaiting a decision, which is why an admin opens
  // this page at all.
  const [status, setStatus] = useState<TFilter>("submitted");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  const { data, error, isLoading, refetch } = useAdminVerifications({
    status,
    search,
    page,
  });

  const verifications = useMemo(() => data?.verifications ?? [], [data]);
  const pagination = data?.pagination;
  const showSkeleton = isLoading && !data;
  const isEmpty = !!data && verifications.length === 0;
  const openVerification = verifications.find((item) => item.id === openId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-secondary-800">
          Vendor verifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Applications vendors have sent in. Open one to approve it or send it back.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={status === filter.value}
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-md px-3",
                status === filter.value &&
                  "bg-secondary-800 text-white hover:bg-secondary-800 hover:text-white",
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search reference, name or email"
            className="pl-9"
            aria-label="Search verifications"
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
            "Could not load verifications",
          )}
          retryFunction={() => void refetch()}
        />
      )}

      {isEmpty && !error && (
        <EmptyContainer
          icon={<BadgeCheck className="size-6" />}
          title="Nothing to review"
          description={
            search
              ? "No application matches that search."
              : "There are no applications with this status."
          }
        />
      )}

      {!showSkeleton && !error && verifications.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications.map((verification) => (
                <TableRow
                  key={verification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenId(verification.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setOpenId(verification.id);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono text-xs">
                    {verification.reference ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {vendorName(verification)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {verification.vendor?.email ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {verification.vendorType === "business"
                      ? "Business"
                      : verification.vendorType === "individual"
                        ? "Individual"
                        : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {verification.countryOfResidence ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {verification.submittedAt
                      ? format(new Date(verification.submittedAt), "d MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={verification.status} />
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

      <VerificationReviewSheet
        verification={openVerification}
        open={!!openVerification}
        onOpenChange={(open) => !open && setOpenId(undefined)}
      />
    </div>
  );
};

export default memo(VerificationsList);
