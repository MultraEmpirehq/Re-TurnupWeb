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
import React, { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { constructErrorMessage } from "@/api/functions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import {
  useSetUserRestriction,
  useSetUserSuspension,
} from "@/hooks/use-admin-moderation";
import { NoteDialog } from "../moderation/moderation-ui";
import UserTransfers from "./user-transfers";
import { toast } from "@/lib/toast";
import StatusBadge from "@/components/ui/status-badge";
import Link from "next/link";
import { deleteData } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
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

type TAccountAction =
  | "suspend"
  | "reactivate"
  | "restrict"
  | "unrestrict"
  | "resetTwoFactor";

/** What each account action says before and after. */
const ACCOUNT_ACTIONS: Record<
  TAccountAction,
  {
    title: string;
    description: string;
    placeholder: string;
    confirm: string;
    done: string;
    tone: "danger" | "default";
    required: boolean;
  }
> = {
  suspend: {
    title: "Suspend this account?",
    description:
      "They're signed out on every device and can't sign in until reactivated. Your reason goes in the email they get.",
    placeholder: "For example: repeated chargebacks on ticket purchases.",
    confirm: "Suspend",
    done: "Account suspended and signed out. They've been emailed the reason.",
    tone: "danger",
    required: true,
  },
  reactivate: {
    title: "Reactivate this account?",
    description:
      "They can sign in again straight away, and get an email saying so.",
    placeholder: "For the audit log.",
    confirm: "Reactivate",
    done: "Account reactivated.",
    tone: "default",
    required: false,
  },
  restrict: {
    title: "Restrict this account?",
    description:
      "They can still sign in and use what they have, but can't publish new events, get or send tickets, or message (support chat stays open). An organiser's events on sale keep selling, and their share is held until you lift it. Your reason goes in the email they get and on their account.",
    placeholder: "For example: your ID has expired and needs replacing.",
    confirm: "Restrict",
    done: "Account restricted. They've been emailed the reason.",
    tone: "danger",
    required: true,
  },
  resetTwoFactor: {
    title: "Reset two-factor sign-in?",
    description:
      "Only once you're sure it's really them (for example, on a call from the number on their account). It turns two-factor off and forgets their trusted devices; they're emailed, and it's in the audit log.",
    placeholder: "How you checked it was them, for the audit log.",
    confirm: "Reset two-factor",
    done: "Two-factor sign-in reset. They can turn it back on in Settings.",
    tone: "danger",
    required: false,
  },
  unrestrict: {
    title: "Lift the restriction?",
    description:
      "Everything works again straight away, and they get an email saying so. Payouts resume on new sales; anything held is paid out from Finance.",
    placeholder: "For the audit log.",
    confirm: "Lift restriction",
    done: "Restriction lifted.",
    tone: "default",
    required: false,
  },
};

const UserDetailsSheet: React.FC<{
  userId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ userId, open, onOpenChange }) => {
  const { data, isLoading } = useAdminUser(open ? userId : undefined);
  const { has } = useAdminPermissions();
  const setSuspension = useSetUserSuspension();
  const setRestriction = useSetUserRestriction();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<TAccountAction | null>(null);
  const action = confirming ? ACCOUNT_ACTIONS[confirming] : null;
  // Admins are suspended from the Admins & Permissions page instead.
  const canSuspend =
    has("USERS_MANAGE") && !!data && data.role !== EUserRoles.ADMIN;

  const handleAction = async (reason: string) => {
    if (!data?.id || !confirming || !action) return;
    try {
      if (confirming === "suspend" || confirming === "reactivate") {
        await setSuspension.mutateAsync({
          id: data.id,
          suspended: confirming === "suspend",
          reason: reason || undefined,
        });
      } else if (confirming === "resetTwoFactor") {
        await deleteData(`/admin/users/${data.id}/two-factor`);
        await queryClient.invalidateQueries({ queryKey: ["admin-user", data.id] });
      } else {
        await setRestriction.mutateAsync({
          id: data.id,
          restricted: confirming === "restrict",
          reason: reason || undefined,
        });
      }
      toast.success(action.done);
      setConfirming(null);
    } catch (suspendError) {
      toast.error(
        constructErrorMessage(
          suspendError as TApiErrorResponseType,
          "Couldn't update the account.",
        ),
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {data?.name?.trim() || data?.username || data?.email || "User"}
          </SheetTitle>
          <SheetDescription>
            {data?.email ?? "Account details"}
          </SheetDescription>
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
              {data.accountType && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Account type</p>
                    <StatusBadge tone={data.accountType.tone}>{data.accountType.label}</StatusBadge>
                  </div>
                  {data.accountType.verificationId && has("VENDORS_VERIFY") && (
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href={`/app/admin/verifications/${data.accountType.verificationId}`}>
                        Open application
                      </Link>
                    </Button>
                  )}
                </div>
              )}
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
                  {data.isAccountDisabled
                    ? "Suspended"
                    : data.restriction
                      ? "Restricted"
                      : "Active"}
                </Field>
                <Field label="Joined">{formatDate(data.createdAt)}</Field>
              </div>

              {/* Only a vendor carries a verification record. */}
              {data.role === EUserRoles.VENDOR && !!data.vendorVerification && (
                <VerificationBlock verification={data.vendorVerification} />
              )}

              <UserTransfers userId={data.id} />

              {!!data.restriction && (
                <div className="rounded-lg border border-warning-line bg-warning-soft p-4 text-sm text-warning">
                  <p className="font-semibold">
                    Restricted since {formatDate(data.restriction.since)}
                    {data.restriction.idExpired ? " (ID expired)" : ""}
                  </p>
                  {data.restriction.reason && (
                    <p className="mt-1">{data.restriction.reason}</p>
                  )}
                </div>
              )}

              {canSuspend && !data.isAccountDisabled && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {data.restriction ? "Account restricted" : "Restrict account"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.restriction
                        ? "Lifting it lets them publish, get and send tickets, and message again. Organisers' payouts resume on new sales."
                        : "They can still sign in, but can't publish new events, get or send tickets, or message. Organisers' events on sale keep selling; their payouts are held."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className={
                      data.restriction
                        ? "shrink-0 rounded-xl border-success-line text-success hover:bg-success-soft"
                        : "shrink-0 rounded-xl border-warning-line text-warning hover:bg-warning-soft"
                    }
                    onClick={() =>
                      setConfirming(data.restriction ? "unrestrict" : "restrict")
                    }
                  >
                    {data.restriction ? "Lift restriction" : "Restrict"}
                  </Button>
                </div>
              )}

              {data.twoFactorEnabled &&
                has("USERS_MANAGE") &&
                (data.role !== EUserRoles.ADMIN || has("ADMINS_MANAGE")) && (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Two-factor sign-in is on</p>
                      <p className="text-xs text-muted-foreground">
                        Lost their phone and backup codes? Reset it once you&apos;ve checked it&apos;s them.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 rounded-xl border-danger-line text-danger hover:bg-danger-soft"
                      onClick={() => setConfirming("resetTwoFactor")}
                    >
                      Reset
                    </Button>
                  </div>
                )}

              {canSuspend && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {data.isAccountDisabled
                        ? "Account suspended"
                        : "Suspend account"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.isAccountDisabled
                        ? "They can't sign in. Reactivating lets them back in."
                        : "Signs them out everywhere and blocks sign-in. They're emailed your reason."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className={
                      data.isAccountDisabled
                        ? "shrink-0 rounded-xl border-success-line text-success hover:bg-success-soft"
                        : "shrink-0 rounded-xl border-danger-line text-danger hover:bg-danger-soft"
                    }
                    onClick={() =>
                      setConfirming(
                        data.isAccountDisabled ? "reactivate" : "suspend",
                      )
                    }
                  >
                    {data.isAccountDisabled ? "Reactivate" : "Suspend"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
      <NoteDialog
        open={!!confirming}
        title={action?.title ?? ""}
        description={action?.description ?? ""}
        label={action?.required ? "Reason" : "Note (optional)"}
        placeholder={action?.placeholder ?? ""}
        confirmLabel={action?.confirm ?? ""}
        tone={action?.tone ?? "default"}
        required={!!action?.required}
        busy={setSuspension.isPending || setRestriction.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={(note) => void handleAction(note)}
      />
    </Sheet>
  );
};

export default memo(UserDetailsSheet);
