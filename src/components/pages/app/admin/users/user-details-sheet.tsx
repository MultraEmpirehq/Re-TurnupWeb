"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUser } from "@/hooks/use-admin-users";
import { IVendorVerificationSummary } from "@/lib/types";
import { EUserRoles } from "@/stores/user-store";
import { format } from "date-fns";
import React, { memo } from "react";
import StatusPill from "../status-pill";

const APPROVAL_LABEL: Record<string, string> = {
  basic_verified: "Basic verified",
  paid_verified: "Paid verified",
  cross_border_verified: "Cross-border verified",
  high_risk_review: "High risk review",
};

const formatDate = (value?: string | null) =>
  value ? format(new Date(value), "d MMM yyyy, HH:mm") : "—";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm break-words">{children}</span>
  </div>
);

const VerificationBlock: React.FC<{
  verification: IVendorVerificationSummary;
}> = ({ verification }) => {
  const decisionNote =
    verification.rejectionReason ?? verification.needsMoreInfoMessage;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Vendor verification</h3>
        <StatusPill status={verification.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Reference">
          {verification.reference ?? "No application yet"}
        </Field>
        <Field label="Approval level">
          {verification.approvalLevel
            ? (APPROVAL_LABEL[verification.approvalLevel] ??
              verification.approvalLevel)
            : "—"}
        </Field>
        <Field label="Vendor type">
          {verification.vendorType
            ? verification.vendorType === "business"
              ? "Business"
              : "Individual"
            : "—"}
        </Field>
        <Field label="Submitted">{formatDate(verification.submittedAt)}</Field>
        <Field label="Reviewed">{formatDate(verification.reviewedAt)}</Field>
      </div>

      {!!decisionNote && (
        <div className="rounded-md bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            {verification.rejectionReason
              ? "Reason for rejection"
              : "Information requested"}
          </p>
          <p className="text-sm">{decisionNote}</p>
        </div>
      )}
    </div>
  );
};

const UserDetailsSheet: React.FC<{
  userId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ userId, open, onOpenChange }) => {
  const { data, isLoading } = useAdminUser(open ? userId : undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {data?.name?.trim() || data?.username || data?.email || "User"}
          </SheetTitle>
          <SheetDescription>{data?.email ?? "Account details"}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-8">
          {isLoading && !data && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-md" />
              ))}
            </div>
          )}

          {!!data && (
            <>
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4">
                <Field label="Role">{data.role ?? "—"}</Field>
                <Field label="Username">{data.username ?? "—"}</Field>
                <Field label="Country">{data.country ?? "—"}</Field>
                <Field label="Currency">{data.platformCurrency ?? "—"}</Field>
                <Field label="Email verified">
                  {data.isEmailVerified ? "Yes" : "No"}
                </Field>
                <Field label="Profile complete">
                  {data.isAccountCreationCompleted ? "Yes" : "No"}
                </Field>
                <Field label="Account status">
                  {data.isAccountDisabled ? "Disabled" : "Active"}
                </Field>
                <Field label="Joined">{formatDate(data.createdAt)}</Field>
              </div>

              {/* Only a vendor carries a verification record. */}
              {data.role === EUserRoles.VENDOR && !!data.vendorVerification && (
                <VerificationBlock verification={data.vendorVerification} />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default memo(UserDetailsSheet);
