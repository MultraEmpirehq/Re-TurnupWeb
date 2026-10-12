"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { getAllCountryOptions } from "@/lib/vendor-verification-helpers";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import React from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { VendorVerificationStatusBadge } from "../status";
import {
  findPayoutCountry,
  SavedPayoutDigits,
  STEP_LABELS,
  VerificationFormValues,
  VerificationStatus,
  VerificationStepKey,
} from "../types";

const COUNTRY_OPTIONS = getAllCountryOptions();
const countryLabel = (value: string) =>
  COUNTRY_OPTIONS.find((option) => option.value === value)?.label ?? value;

const masked = (typed: string, last4?: string | null) => {
  const clean = typed.replace(/[\s-]/g, "");
  if (clean) return `•••• ${clean.slice(-4)}`;
  return last4 ? `•••• ${last4}` : "";
};

const Row: React.FC<{ label: string; value?: string | null }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
    <dt className="text-xs text-secondary-500 sm:w-44 sm:shrink-0 sm:text-sm">
      {label}
    </dt>
    <dd
      className={cn(
        "text-sm break-words",
        value ? "text-secondary-950" : "text-secondary-400",
      )}
    >
      {value || "Not given"}
    </dd>
  </div>
);

const Group: React.FC<{
  step: VerificationStepKey;
  status?: VerificationStatus;
  onEdit?: (step: VerificationStepKey) => void;
  children: React.ReactNode;
}> = ({ step, status, onEdit, children }) => (
  <section className="rounded-2xl border border-secondary-100 p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-secondary-950">
          {STEP_LABELS[step]}
        </h3>
        {status && !["not_started", "in_progress"].includes(status) && (
          <VendorVerificationStatusBadge status={status} prefix={false} />
        )}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-600 hover:text-secondary-900"
        >
          <Pencil className="size-3.5" />
          Edit
        </button>
      )}
    </div>
    <dl className="space-y-2.5">{children}</dl>
  </section>
);

/**
 * Everything entered, by step, to check before sending: with Edit links and
 * the confirmation while it can still change, read-only once it's with us.
 */
const ReviewSummary: React.FC<{
  saved: SavedPayoutDigits;
  stepStatuses: Partial<Record<VerificationStepKey, VerificationStatus>>;
  onEdit?: (step: VerificationStepKey) => void;
  withConfirmation?: boolean;
}> = ({ saved, stepStatuses, onEdit, withConfirmation }) => {
  const { control } = useFormContext<VerificationFormValues>();
  const values = useWatch({ control }) as VerificationFormValues;
  const isFree = values.plan === "free";
  const isBusiness = !isFree && values.vendorType === "business";
  const country = findPayoutCountry(values.payoutCountry);
  const doc = (value: VerificationFormValues["idDocument"]) =>
    !value
      ? ""
      : typeof File !== "undefined" && value instanceof File
        ? `${value.name} (new)`
        : "Uploaded";

  return (
    <div className="space-y-4">
      <Group step="vendorType" status={stepStatuses.vendorType} onEdit={onEdit}>
        <Row
          label="Hosting"
          value={isFree ? "Free events only" : "Sell tickets"}
        />
        {!isFree && (
          <Row
            label="Account"
            value={isBusiness ? "Registered business" : "Individual"}
          />
        )}
      </Group>

      <Group step="identity" status={stepStatuses.identity} onEdit={onEdit}>
        <Row
          label={isFree ? "Name" : "Legal name"}
          value={[values.legalFirstName, values.legalLastName]
            .filter(Boolean)
            .join(" ")}
        />
        {!isFree && (
          <Row
            label="Date of birth"
            value={
              values.dateOfBirth
                ? format(values.dateOfBirth, "d MMMM yyyy")
                : ""
            }
          />
        )}
        <Row label="Phone" value={values.phoneNumber} />
        <Row
          label="Country of residence"
          value={
            values.countryOfResidence && countryLabel(values.countryOfResidence)
          }
        />
        {!isFree && (
          <>
            <Row label="Address" value={values.address} />
            <Row label="Government ID" value={doc(values.idDocument)} />
          </>
        )}
      </Group>

      {isBusiness && (
        <Group step="business" status={stepStatuses.business} onEdit={onEdit}>
          <Row label="Business name" value={values.businessName} />
          <Row
            label="Registration number"
            value={values.businessRegistrationNumber}
          />
          <Row label="Representative" value={values.authorizedRepresentative} />
          <Row label="Tax ID" value={values.taxId} />
          <Row label="Address" value={values.businessAddress} />
        </Group>
      )}

      {!isFree && (
        <Group step="payout" status={stepStatuses.payout} onEdit={onEdit}>
          <Row
            label="Paid in"
            value={country ? `${country.name} (${country.currency})` : ""}
          />
          <Row label="Account holder" value={values.accountHolderName} />
          {country?.fields.includes("bankName") && (
            <Row label="Bank" value={values.bankName} />
          )}
          {country?.fields.includes("accountNumber") && (
            <Row
              label="Account number"
              value={masked(values.accountNumber, saved.accountNumberLast4)}
            />
          )}
          {country?.fields.includes("routingNumber") && (
            <Row
              label={country.routingNumber?.label ?? "Routing number"}
              value={masked(values.routingNumber, saved.routingNumberLast4)}
            />
          )}
          {country?.fields.includes("sortCode") && (
            <Row
              label="Sort code"
              value={masked(values.sortCode, saved.sortCodeLast4)}
            />
          )}
          {country?.fields.includes("iban") && (
            <Row label="IBAN" value={masked(values.iban, saved.ibanLast4)} />
          )}
          {country?.fields.includes("swiftCode") && (
            <Row label="SWIFT / BIC" value={values.swiftCode} />
          )}
        </Group>
      )}

      {!isFree && (
        <Group
          step="crossBorder"
          status={stepStatuses.crossBorder}
          onEdit={onEdit}
        >
          {values.hostsAbroad ? (
            <>
              <Row
                label="Countries"
                value={(values.crossBorderCountries ?? [])
                  .map(countryLabel)
                  .join(", ")}
              />
              <Row label="Why" value={values.crossBorderReason} />
              <Row
                label="Supporting document"
                value={doc(values.supportingDocument)}
              />
            </>
          ) : (
            <Row label="Hosting abroad" value="No, only in my own country" />
          )}
        </Group>
      )}

      {withConfirmation && (
        <Controller
          control={control}
          name="acceptedTerms"
          render={({ field, fieldState }) => (
            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-secondary-100 bg-secondary-50/60 p-4">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  className="mt-0.5"
                  aria-invalid={!!fieldState.error}
                />
                <span className="text-sm leading-6 text-secondary-700">
                  {isFree
                    ? "I confirm these details are accurate and belong to me. I'll only run free events, and I agree that Turnupz may check my events and remove ones that break the rules."
                    : "I confirm these details are accurate and belong to me or my business. I agree that Turnupz may check my identity, bank account and events before enabling paid tickets and payouts."}
                </span>
              </label>
              {fieldState.error?.message && (
                <p className="mt-2 text-xs text-destructive" role="alert">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      )}
    </div>
  );
};

export default ReviewSummary;
