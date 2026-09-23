"use client";

import { constructErrorMessage } from "@/api/functions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminVerification } from "@/hooks/use-admin-verifications";
import {
  IVendorVerification,
  IVerificationDocument,
  TVerificationStepKey,
} from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { memo } from "react";
import StatusPill from "../status-pill";
import VerificationDecisionPanel from "./verification-decision-panel";
import {
  approvalLevelLabel,
  formatDate,
  isImageDocument,
  vendorName,
  vendorTypeLabel,
} from "./verification-utils";

const STEPS: { key: TVerificationStepKey; label: string }[] = [
  { key: "vendorType", label: "Vendor type" },
  { key: "identity", label: "Identity" },
  { key: "business", label: "Business" },
  { key: "payout", label: "Payout" },
  { key: "crossBorder", label: "Cross-border" },
];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="space-y-4 rounded-xl border border-border bg-card p-5">
    <h2 className="font-semibold">{title}</h2>
    {children}
  </section>
);

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ label, children, wide }) => (
  <div className={wide ? "flex flex-col gap-0.5 sm:col-span-2" : "flex flex-col gap-0.5"}>
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm break-words">{children || "—"}</span>
  </div>
);

const FieldGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid gap-4 sm:grid-cols-2">{children}</div>
);

const DocumentCard: React.FC<{
  label: string;
  document?: IVerificationDocument | null;
}> = ({ label, document }) => {
  if (!document?.url) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          Not provided
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <a
        href={document.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted"
      >
        {isImageDocument(document) ? (
          <Image
            src={document.url}
            alt={label}
            fill
            unoptimized
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <FileText className="size-10 text-muted-foreground" />
        )}
        <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm">
          Open <ExternalLink className="size-3" />
        </span>
      </a>
    </div>
  );
};

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-24 w-full rounded-xl" />
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  </div>
);

const Details: React.FC<{ verification: IVendorVerification }> = ({
  verification,
}) => {
  const name = vendorName(verification);
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "V";
  const isBusiness = verification.vendorType === "business";
  const hasSubmitted = !["not_started", "in_progress"].includes(
    verification.status,
  );
  const lastDecisionNote =
    verification.status === "rejected"
      ? verification.rejectionReason
      : verification.status === "needs_more_info"
        ? verification.needsMoreInfoMessage
        : null;
  const level = approvalLevelLabel(verification.approvalLevel);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-secondary-800 font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-secondary-800">
              {name}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {verification.vendor?.email ?? "—"}
              <span className="mx-1.5">·</span>
              <span className="font-mono text-xs">
                {verification.reference ?? "No reference"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {level && (
            <span className="rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs font-medium text-secondary-800">
              {level} level
            </span>
          )}
          <StatusPill status={verification.status} />
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Section title="Applicant">
            <FieldGrid>
              <Field label="Legal name">
                {[verification.legalFirstName, verification.legalLastName]
                  .filter(Boolean)
                  .join(" ")}
              </Field>
              <Field label="Vendor type">
                {vendorTypeLabel(verification.vendorType)}
              </Field>
              <Field label="Date of birth">
                {formatDate(verification.dateOfBirth)}
              </Field>
              <Field label="Country of residence">
                {verification.countryOfResidence}
              </Field>
              <Field label="Phone">{verification.phoneNumber}</Field>
              <Field label="Submitted">
                {formatDate(verification.submittedAt, true)}
              </Field>
              <Field label="Address" wide>
                {verification.address}
              </Field>
            </FieldGrid>
          </Section>

          {isBusiness && (
            <Section title="Business">
              <FieldGrid>
                <Field label="Business name">{verification.businessName}</Field>
                <Field label="Registration number">
                  {verification.businessRegistrationNumber}
                </Field>
                <Field label="Business address" wide>
                  {verification.businessAddress}
                </Field>
              </FieldGrid>
            </Section>
          )}

          <Section title="Documents">
            <div className="grid gap-4 sm:grid-cols-2">
              <DocumentCard
                label="Identity document"
                document={verification.idDocumentDetails}
              />
              <DocumentCard
                label="Supporting document"
                document={verification.supportingDocumentDetails}
              />
            </div>
          </Section>

          <Section title="Payout">
            <FieldGrid>
              <Field label="Account holder">
                {verification.accountHolderName}
              </Field>
              <Field label="Bank">{verification.bankName}</Field>
              <Field label="Account">
                {verification.accountNumberLast4 &&
                  `•••• ${verification.accountNumberLast4}`}
              </Field>
              <Field label="Payout country">{verification.payoutCountry}</Field>
              <Field label="Currency">{verification.payoutCurrency}</Field>
              {!!verification.ibanLast4 && (
                <Field label="IBAN">{`•••• ${verification.ibanLast4}`}</Field>
              )}
              {!!verification.swiftCode && (
                <Field label="SWIFT">{verification.swiftCode}</Field>
              )}
            </FieldGrid>
          </Section>

          {verification.crossBorderCountries?.length > 0 && (
            <Section title="Cross-border">
              <FieldGrid>
                <Field label="Countries" wide>
                  {verification.crossBorderCountries.join(", ")}
                </Field>
                <Field label="Reason" wide>
                  {verification.crossBorderReason}
                </Field>
              </FieldGrid>
            </Section>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-[92px]">
          <Section title="Steps">
            <ul className="space-y-2.5">
              {STEPS.map((step) => (
                <li
                  key={step.key}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{step.label}</span>
                  <StatusPill
                    status={verification.stepStatuses?.[step.key] ?? "not_started"}
                  />
                </li>
              ))}
            </ul>
            {verification.reviewedAt && (
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                Last reviewed {formatDate(verification.reviewedAt, true)}
              </p>
            )}
          </Section>

          {!!lastDecisionNote && (
            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">
                Message sent to the vendor
              </p>
              <p className="text-sm">{lastDecisionNote}</p>
            </div>
          )}

          {hasSubmitted ? (
            <VerificationDecisionPanel verification={verification} />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              This vendor hasn&apos;t submitted their application yet, so
              there&apos;s nothing to decide.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VerificationDetails: React.FC<{ id: string }> = ({ id }) => {
  const { data, error, isLoading, refetch } = useAdminVerification(id);

  return (
    <div className="space-y-4">
      <Link
        href={ROUTES.ADMIN_VERIFICATIONS.href}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All verifications
      </Link>

      {isLoading && <LoadingState />}

      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Could not load this application",
          )}
          retryFunction={() => void refetch()}
        />
      )}

      {!!data && <Details verification={data} />}
    </div>
  );
};

export default memo(VerificationDetails);
