"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { getAllCountryOptions } from "@/lib/vendor-verification-helpers";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Eye, EyeOff, Loader2, Pencil } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InputField from "@/components/ui/input-field";
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

type TBankField = "accountNumber" | "routingNumber" | "sortCode" | "iban";

/** The number in full when shown, else its last four. */
const bankNumber = (
  typed: string,
  last4: string | null | undefined,
  full: string | null | undefined,
  shown: boolean,
) => {
  const clean = typed.replace(/[\s-]/g, "");
  if (shown) return clean || full || (last4 ? `•••• ${last4}` : "");
  if (clean) return `•••• ${clean.slice(-4)}`;
  return last4 ? `•••• ${last4}` : "";
};

const Row: React.FC<{
  label: string;
  value?: string | null;
  action?: React.ReactNode;
}> = ({ label, value, action }) => (
  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
    <dt className="text-xs text-secondary-500 sm:w-44 sm:shrink-0 sm:text-sm">
      {label}
    </dt>
    <dd
      className={cn(
        "flex items-center gap-2 text-sm break-words",
        value ? "text-secondary-950" : "text-secondary-400",
      )}
    >
      <span className={cn(value && action && "tabular-nums tracking-wide")}>
        {value || "Not given"}
      </span>
      {value && action}
    </dd>
  </div>
);

/**
 * Show or hide the bank numbers. Ones typed in this visit are in the form;
 * saved ones need your password first (yours only, and each look is logged).
 */
const useBankNumbers = (needsSaved: boolean) => {
  const [shown, setShown] = useState(false);
  const [saved, setSaved] = useState<Partial<Record<TBankField, string | null>>>();
  const [asking, setAsking] = useState(false);
  const [loading, setLoading] = useState(false);
  const toggle = () => {
    if (shown) return setShown(false);
    if (needsSaved && !saved) return setAsking(true);
    setShown(true);
  };
  /** Fetches the saved numbers with their password; false if it was refused. */
  const unlock = async (password: string) => {
    setLoading(true);
    try {
      const { data } = await postData<
        { password: string },
        Record<TBankField, string | null>
      >("/vendor/verification/payout-account/reveal", { password });
      setSaved(data?.data ?? {});
      setAsking(false);
      setShown(true);
      return null;
    } catch (error) {
      return constructErrorMessage(
        error as TApiErrorResponseType,
        "Couldn't show your saved bank details.",
      );
    } finally {
      setLoading(false);
    }
  };
  return { shown, saved, loading, asking, setAsking, toggle, unlock };
};

/** Asks for their password before showing saved bank numbers. */
const PasswordPrompt: React.FC<{
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<string | null>;
}> = ({ open, loading, onClose, onSubmit }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPassword("");
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="rounded-[1.6rem] p-6 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Show your bank details</DialogTitle>
          <DialogDescription>
            Enter your Turnupz password to see your saved account number in full.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const problem = await onSubmit(password);
            setError(problem);
            if (!problem) setPassword("");
          }}
        >
          <InputField
            label="Your Turnupz password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            error={error ?? undefined}
            helperText="Signed up with Google or Apple? Set a password with Forgot password on the sign-in page first."
          />
          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={!password}
            loading={loading}
          >
            Show
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EyeToggle: React.FC<{
  shown: boolean;
  loading: boolean;
  onToggle: () => void;
}> = ({ shown, loading, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={loading}
    aria-label={shown ? "Hide bank details" : "Show bank details"}
    aria-pressed={shown}
    className="inline-flex size-7 items-center justify-center rounded-full text-secondary-500 hover:bg-secondary-100 hover:text-secondary-900 disabled:opacity-50"
  >
    {loading ? (
      <Loader2 className="size-4 animate-spin" />
    ) : shown ? (
      <EyeOff className="size-4" />
    ) : (
      <Eye className="size-4" />
    )}
  </button>
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
  // A saved number not typed again this visit has to be fetched to show it.
  const needsSaved = (
    [
      ["accountNumber", saved.accountNumberLast4],
      ["routingNumber", saved.routingNumberLast4],
      ["sortCode", saved.sortCodeLast4],
      ["iban", saved.ibanLast4],
    ] as const
  ).some(
    ([field, last4]) =>
      country?.fields.includes(field) && !!last4 && !values[field]?.trim(),
  );
  const bank = useBankNumbers(needsSaved);
  const eye = (
    <EyeToggle shown={bank.shown} loading={bank.loading} onToggle={bank.toggle} />
  );
  const number = (field: TBankField, last4?: string | null) =>
    bankNumber(values[field] ?? "", last4, bank.saved?.[field], bank.shown);
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
          {country?.stripePayout && (
            <Row label="Bank" value="Added with Stripe in your Wallet, once approved" />
          )}
          {country?.fields.includes("bankName") && (
            <Row label="Bank" value={values.bankName} />
          )}
          {country?.fields.includes("accountNumber") && (
            <Row
              label="Account number"
              value={number("accountNumber", saved.accountNumberLast4)}
              action={eye}
            />
          )}
          {country?.fields.includes("routingNumber") && (
            <Row
              label={country.routingNumber?.label ?? "Routing number"}
              value={number("routingNumber", saved.routingNumberLast4)}
              action={eye}
            />
          )}
          {country?.fields.includes("sortCode") && (
            <Row
              label="Sort code"
              value={number("sortCode", saved.sortCodeLast4)}
              action={eye}
            />
          )}
          {country?.fields.includes("iban") && (
            <Row label="IBAN" value={number("iban", saved.ibanLast4)} action={eye} />
          )}
          {country?.fields.includes("swiftCode") && (
            <Row label="SWIFT / BIC" value={values.swiftCode} />
          )}
          <PasswordPrompt
            open={bank.asking}
            loading={bank.loading}
            onClose={() => bank.setAsking(false)}
            onSubmit={bank.unlock}
          />
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
