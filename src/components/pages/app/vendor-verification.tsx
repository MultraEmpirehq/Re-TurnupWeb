"use client";

import { getData, patchData, postData, putData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SelectField from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export type VerificationStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_more_info";

type VendorType = "individual" | "business";
type PayoutRequirementField =
  | "bankName"
  | "accountNumber"
  | "routingNumber"
  | "sortCode"
  | "iban"
  | "swiftCode";
type VerificationStepKey =
  | "vendorType"
  | "identity"
  | "business"
  | "payout"
  | "crossBorder"
  | "review";

interface VerificationFormState {
  vendorType: VendorType;
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: string;
  countryOfResidence: string;
  address: string;
  phoneNumber: string;
  idDocumentName: string;
  businessName: string;
  businessRegistrationNumber: string;
  businessAddress: string;
  taxId: string;
  authorizedRepresentative: string;
  payoutCountry: string;
  payoutCurrency: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  sortCode: string;
  iban: string;
  swiftCode: string;
  accountHolderName: string;
  payoutAccount: string;
  crossBorderCountries: string;
  crossBorderReason: string;
  supportingDocumentName: string;
  acceptedTerms: boolean;
}

type VendorVerificationApiResponse = Partial<VerificationFormState> & {
  status?: VerificationStatus;
  approvalLevel?: string;
  payoutCountry?: string;
  payoutCurrency?: string;
  accountNumberLast4?: string | null;
  routingNumberLast4?: string | null;
  sortCodeLast4?: string | null;
  ibanLast4?: string | null;
  payoutAccountLast4?: string | null;
  payoutAccountRef?: string | null;
  stepStatuses?: Partial<Record<VerificationStepKey, VerificationStatus>>;
  needsMoreInfoMessage?: string | null;
  rejectionReason?: string | null;
};

const storageKey = "turnupz-vendor-verification";

const defaultFormState: VerificationFormState = {
  vendorType: "individual",
  legalFirstName: "",
  legalLastName: "",
  dateOfBirth: "",
  countryOfResidence: "",
  address: "",
  phoneNumber: "",
  idDocumentName: "",
  businessName: "",
  businessRegistrationNumber: "",
  businessAddress: "",
  taxId: "",
  authorizedRepresentative: "",
  payoutCountry: "",
  payoutCurrency: "",
  bankName: "",
  accountNumber: "",
  routingNumber: "",
  sortCode: "",
  iban: "",
  swiftCode: "",
  accountHolderName: "",
  payoutAccount: "",
  crossBorderCountries: "",
  crossBorderReason: "",
  supportingDocumentName: "",
  acceptedTerms: false,
};

const statusLabels: Record<VerificationStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  needs_more_info: "Needs More Info",
};

const approvalLevels = [
  {
    title: "Basic Verified",
    description: "Can publish free/register events.",
  },
  {
    title: "Paid Verified",
    description: "Can sell paid tickets.",
  },
  {
    title: "Cross-Border Verified",
    description: "Can sell paid tickets outside the account country.",
  },
  {
    title: "High-Risk Review",
    description: "Manual approval is required before the event goes live.",
  },
];

const payoutCountries: Array<{
  code: string;
  name: string;
  currency: string;
  requirements: string[];
  fields: PayoutRequirementField[];
}> = [
  {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    requirements: [
      "Bank name",
      "10-digit NUBAN account number",
      "Account holder name must match vendor or business name",
    ],
    fields: ["bankName", "accountNumber"],
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    requirements: [
      "Bank name",
      "Institution/transit/routing number",
      "Account number",
      "Account holder name must match verification details",
    ],
    fields: ["bankName", "routingNumber", "accountNumber"],
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    requirements: ["Bank name", "ACH routing number", "Account number"],
    fields: ["bankName", "routingNumber", "accountNumber"],
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    requirements: ["Bank name", "Sort code", "Account number"],
    fields: ["bankName", "sortCode", "accountNumber"],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    requirements: ["Bank name", "IBAN", "SWIFT/BIC code"],
    fields: ["bankName", "iban", "swiftCode"],
  },
  {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    requirements: ["Bank name", "Account number", "Branch/routing code"],
    fields: ["bankName", "routingNumber", "accountNumber"],
  },
];

const countryOptions = payoutCountries.map((country) => ({
  label: `${country.name} (${country.currency})`,
  value: country.name,
}));

const stepLabels: Record<VerificationStepKey, string> = {
  vendorType: "Vendor Type",
  identity: "Identity",
  business: "Business Details",
  payout: "Payout Setup",
  crossBorder: "Cross-Border Hosting",
  review: "Review",
};

const getSavedVerification = () => {
  if (typeof window === "undefined") {
    return { status: "not_started" as VerificationStatus, form: defaultFormState };
  }

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      return {
        status: "not_started" as VerificationStatus,
        form: defaultFormState,
      };
    }

    const parsed = JSON.parse(saved) as {
      status?: VerificationStatus;
      form?: Partial<VerificationFormState>;
      stepStatuses?: Partial<Record<VerificationStepKey, VerificationStatus>>;
    };

    return {
      status: parsed.status ?? ("not_started" as VerificationStatus),
      form: { ...defaultFormState, ...parsed.form },
      stepStatuses: parsed.stepStatuses ?? {},
    };
  } catch {
    return {
      status: "not_started" as VerificationStatus,
      form: defaultFormState,
      stepStatuses: {},
    };
  }
};

const findPayoutCountry = (value?: string) =>
  payoutCountries.find(
    (country) => country.name === value || country.code === value,
  );

const buildFormFromApi = (
  data?: VendorVerificationApiResponse,
): VerificationFormState => {
  if (!data) return defaultFormState;

  const payoutCountry = findPayoutCountry(data.payoutCountry)?.name ?? "";

  return {
    ...defaultFormState,
    vendorType: data.vendorType ?? defaultFormState.vendorType,
    legalFirstName: data.legalFirstName ?? "",
    legalLastName: data.legalLastName ?? "",
    dateOfBirth: data.dateOfBirth ?? "",
    countryOfResidence: data.countryOfResidence ?? "",
    address: data.address ?? "",
    phoneNumber: data.phoneNumber ?? "",
    idDocumentName: data.idDocumentName ?? "",
    businessName: data.businessName ?? "",
    businessRegistrationNumber: data.businessRegistrationNumber ?? "",
    businessAddress: data.businessAddress ?? "",
    taxId: data.taxId ?? "",
    authorizedRepresentative: data.authorizedRepresentative ?? "",
    payoutCountry,
    payoutCurrency:
      data.payoutCurrency ?? findPayoutCountry(data.payoutCountry)?.currency ?? "",
    bankName: data.bankName ?? "",
    accountNumber: "",
    routingNumber: "",
    sortCode: "",
    iban: "",
    swiftCode: data.swiftCode ?? "",
    accountHolderName: data.accountHolderName ?? "",
    payoutAccount: "",
    crossBorderCountries: Array.isArray(data.crossBorderCountries)
      ? data.crossBorderCountries.join(", ")
      : (data.crossBorderCountries ?? ""),
    crossBorderReason: data.crossBorderReason ?? "",
    supportingDocumentName: data.supportingDocumentName ?? "",
    acceptedTerms: !!data.acceptedTerms,
  };
};

export const useVendorVerificationSnapshot = () => {
  const [verification, setVerification] = useState(getSavedVerification);

  useEffect(() => {
    setVerification(getSavedVerification());
  }, []);

  return verification;
};

export const VendorVerificationStatusBadge: React.FC<{
  status?: VerificationStatus;
}> = ({ status = "not_started" }) => {
  const tone =
    status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : status === "submitted"
        ? "bg-cyan-50 text-cyan-700"
        : status === "rejected"
          ? "bg-red-50 text-red-600"
          : status === "needs_more_info"
            ? "bg-amber-50 text-amber-700"
            : "bg-secondary-50 text-secondary-600";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${tone}`}
    >
      Verification: {statusLabels[status]}
    </span>
  );
};

export const VendorVerificationNotice: React.FC<{
  context?: "dashboard" | "create" | "wallet";
}> = ({ context = "dashboard" }) => {
  const [{ status }, setVerification] = useState(getSavedVerification);

  useEffect(() => {
    setVerification(getSavedVerification());
    getData<VendorVerificationApiResponse>("/vendor/verification")
      .then(({ data }) => {
        if (!data.data?.status) return;
        const nextVerification = {
          status: data.data.status,
          form: buildFormFromApi(data.data),
          stepStatuses: data.data.stepStatuses ?? {},
        };
        window.localStorage.setItem(storageKey, JSON.stringify(nextVerification));
        setVerification(nextVerification);
      })
      .catch(() => undefined);
  }, []);

  if (status === "approved") {
    return null;
  }

  const copy =
    context === "wallet"
      ? "Verify your vendor account to receive payouts and unlock cross-border payout review."
      : context === "create"
        ? "You can keep creating this draft, but paid publishing is locked until verification is approved."
        : "Complete vendor verification to publish paid events and receive payouts.";

  return (
    <section className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-white p-3 text-cyan-700">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <VendorVerificationStatusBadge status={status} />
            <h2 className="mt-3 text-lg font-bold text-secondary-950">
              Vendor verification required
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-secondary-600">
              {copy}
            </p>
          </div>
        </div>
        <Button
          asChild
          className="h-11 rounded-2xl bg-secondary-400 px-5 text-sm font-semibold text-white hover:bg-secondary-500"
        >
          <Link href="/app/settings/vendor-verification">
            {status === "not_started" ? "Start Verification" : "Continue Verification"}
          </Link>
        </Button>
      </div>
    </section>
  );
};

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <label className="space-y-2">
    <span className="text-sm font-semibold text-secondary-950">{label}</span>
    {children}
  </label>
);

const StepStatusPill: React.FC<{ status?: VerificationStatus }> = ({
  status = "not_started",
}) => (
  <span className="inline-flex w-fit rounded-full bg-secondary-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-secondary-500">
    {statusLabels[status]}
  </span>
);

const SectionHeader: React.FC<{
  stepKey?: VerificationStepKey;
  status?: VerificationStatus;
  eyebrow: string;
  title: string;
  description: string;
}> = ({ eyebrow, title, description, status }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-400">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-xl font-bold text-secondary-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-secondary-500">{description}</p>
    </div>
    <StepStatusPill status={status} />
  </div>
);

const StepRequirements: React.FC<{ items: string[] }> = ({ items }) => (
  <div className="rounded-2xl border border-secondary-100 bg-secondary-50 px-4 py-3 text-sm text-secondary-600">
    <p className="font-semibold text-secondary-950">Requirements for this step</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

export const VendorVerificationForm = memo(function VendorVerificationForm() {
  const [status, setStatus] = useState<VerificationStatus>("not_started");
  const [form, setForm] = useState<VerificationFormState>(defaultFormState);
  const [isLoadingVerification, setIsLoadingVerification] = useState(true);
  const [savingAction, setSavingAction] = useState<string>("");
  const [maskedPayoutDetails, setMaskedPayoutDetails] = useState({
    accountNumberLast4: "",
    routingNumberLast4: "",
    sortCodeLast4: "",
    ibanLast4: "",
    payoutAccountLast4: "",
    payoutAccountRef: "",
  });
  const [stepStatuses, setStepStatuses] = useState<
    Record<VerificationStepKey, VerificationStatus>
  >({
    vendorType: "not_started",
    identity: "not_started",
    business: "not_started",
    payout: "not_started",
    crossBorder: "not_started",
    review: "not_started",
  });

  useEffect(() => {
    const saved = getSavedVerification();
    setStatus(saved.status);
    setForm(saved.form);
    setStepStatuses((current) => ({
      ...current,
      ...saved.stepStatuses,
    }));
    getData<VendorVerificationApiResponse>("/vendor/verification")
      .then(({ data }) => {
        const verification = data.data;
        if (!verification) return;
        const nextForm = buildFormFromApi(verification);
        const nextStatus = verification.status ?? "not_started";
        const nextStepStatuses = {
          vendorType: "not_started",
          identity: "not_started",
          business: "not_started",
          payout: "not_started",
          crossBorder: "not_started",
          review: "not_started",
          ...verification.stepStatuses,
        } satisfies Record<VerificationStepKey, VerificationStatus>;

        setStatus(nextStatus);
        setForm(nextForm);
        setStepStatuses(nextStepStatuses);
        setMaskedPayoutDetails({
          accountNumberLast4: verification.accountNumberLast4 ?? "",
          routingNumberLast4: verification.routingNumberLast4 ?? "",
          sortCodeLast4: verification.sortCodeLast4 ?? "",
          ibanLast4: verification.ibanLast4 ?? "",
          payoutAccountLast4: verification.payoutAccountLast4 ?? "",
          payoutAccountRef: verification.payoutAccountRef ?? "",
        });
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            status: nextStatus,
            form: nextForm,
            stepStatuses: nextStepStatuses,
          }),
        );
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingVerification(false));
  }, []);

  const isBusiness = form.vendorType === "business";
  const selectedPayoutCountry = useMemo(
    () => findPayoutCountry(form.payoutCountry),
    [form.payoutCountry],
  );

  const completionCount = useMemo(() => {
    const requiredFields = [
      form.legalFirstName,
      form.legalLastName,
      form.dateOfBirth,
      form.countryOfResidence,
      form.address,
      form.phoneNumber,
      form.idDocumentName,
      form.payoutCountry,
      form.payoutCurrency,
      form.accountHolderName,
      form.payoutAccount || maskedPayoutDetails.payoutAccountLast4,
      form.acceptedTerms ? "accepted" : "",
    ];

    if (isBusiness) {
      requiredFields.push(
        form.businessName,
        form.businessRegistrationNumber,
        form.businessAddress,
        form.authorizedRepresentative,
      );
    }

    return requiredFields.filter(Boolean).length;
  }, [form, isBusiness, maskedPayoutDetails.payoutAccountLast4]);

  const updateField = <T extends keyof VerificationFormState>(
    key: T,
    value: VerificationFormState[T],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (status === "not_started") {
      setStatus("in_progress");
    }
  };

  const updatePayoutCountry = (countryValue: string) => {
    const country = findPayoutCountry(countryValue);
    setForm((current) => ({
      ...current,
      payoutCountry: country?.name ?? countryValue,
      payoutCurrency: country?.currency ?? "",
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      sortCode: "",
      iban: "",
      swiftCode: "",
      payoutAccount: "",
    }));
    if (status === "not_started") {
      setStatus("in_progress");
    }
  };

  const persistVerification = (
    nextStatus: VerificationStatus,
    nextStepStatuses = stepStatuses,
  ) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        status: nextStatus,
        form,
        stepStatuses: nextStepStatuses,
      }),
    );
  };

  const buildVerificationPayload = () => {
    const payload: Partial<VerificationFormState> & {
      stepStatuses?: Record<VerificationStepKey, VerificationStatus>;
    } = {
      ...form,
      payoutCountry: selectedPayoutCountry?.name ?? form.payoutCountry,
      payoutCurrency: selectedPayoutCountry?.currency ?? form.payoutCurrency,
      stepStatuses,
    };

    if (!payload.accountNumber) delete payload.accountNumber;
    if (!payload.routingNumber) delete payload.routingNumber;
    if (!payload.sortCode) delete payload.sortCode;
    if (!payload.iban) delete payload.iban;
    if (!payload.payoutAccount) delete payload.payoutAccount;

    return payload;
  };

  const buildStepFields = (stepKey: VerificationStepKey) => {
    const payload = buildVerificationPayload();
    const stepFieldMap: Record<
      VerificationStepKey,
      Array<keyof VerificationFormState>
    > = {
      vendorType: ["vendorType"],
      identity: [
        "legalFirstName",
        "legalLastName",
        "dateOfBirth",
        "countryOfResidence",
        "address",
        "phoneNumber",
        "idDocumentName",
      ],
      business: [
        "businessName",
        "businessRegistrationNumber",
        "businessAddress",
        "taxId",
        "authorizedRepresentative",
      ],
      payout: [
        "payoutCountry",
        "payoutCurrency",
        "bankName",
        "accountNumber",
        "routingNumber",
        "sortCode",
        "iban",
        "swiftCode",
        "accountHolderName",
        "payoutAccount",
      ],
      crossBorder: [
        "crossBorderCountries",
        "crossBorderReason",
        "supportingDocumentName",
      ],
      review: ["acceptedTerms"],
    };

    return stepFieldMap[stepKey].reduce<Partial<VerificationFormState>>(
      (fields, key) => {
        const value = payload[key];
        if (value !== "" && value !== undefined) {
          return { ...fields, [key]: value };
        }
        return fields;
      },
      {},
    );
  };

  const submitStep = async (stepKey: VerificationStepKey) => {
    const nextStatus = status === "not_started" ? "in_progress" : status;
    const nextStepStatuses: Record<VerificationStepKey, VerificationStatus> = {
      ...stepStatuses,
      [stepKey]: "submitted" as VerificationStatus,
    };

    setSavingAction(stepKey);
    try {
      await patchData<
        {
          fields: Partial<VerificationFormState>;
          status: VerificationStatus;
        },
        VendorVerificationApiResponse
      >(`/vendor/verification/steps/${stepKey}/submit`, {
        fields: buildStepFields(stepKey),
        status: "submitted",
      });
      setStatus(nextStatus);
      setStepStatuses(nextStepStatuses);
      persistVerification(nextStatus, nextStepStatuses);
      toast.success(`${stepLabels[stepKey]} submitted for review.`);
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          `Unable to submit ${stepLabels[stepKey]}.`,
        ),
      );
    } finally {
      setSavingAction("");
    }
  };

  const saveDraft = async () => {
    const nextStatus = status === "not_started" ? "in_progress" : status;
    setSavingAction("draft");
    try {
      await putData<Partial<VerificationFormState>, VendorVerificationApiResponse>(
        "/vendor/verification",
        buildVerificationPayload(),
      );
      persistVerification(nextStatus);
      setStatus(nextStatus);
      toast.success("Verification draft saved.");
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Unable to save verification draft.",
        ),
      );
    } finally {
      setSavingAction("");
    }
  };

  const submitVerification = async () => {
    if (!form.acceptedTerms) {
      toast.error("Confirm the verification terms before submitting.");
      return;
    }

    const nextStepStatuses: Record<VerificationStepKey, VerificationStatus> = {
      vendorType: "submitted",
      identity: "submitted",
      business: isBusiness ? "submitted" : "not_started",
      payout: "submitted",
      crossBorder: form.crossBorderCountries ? "submitted" : "not_started",
      review: "submitted",
    };

    setSavingAction("submit");
    try {
      await postData<
        Partial<VerificationFormState> & {
          stepStatuses: Record<VerificationStepKey, VerificationStatus>;
        },
        VendorVerificationApiResponse
      >("/vendor/verification/submit", {
        ...buildVerificationPayload(),
        stepStatuses: nextStepStatuses,
      });
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          status: "submitted",
          form,
          stepStatuses: nextStepStatuses,
        }),
      );
      setStatus("submitted");
      setStepStatuses(nextStepStatuses);
      toast.success("Verification submitted for admin review.");
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Unable to submit verification.",
        ),
      );
    } finally {
      setSavingAction("");
    }
  };

  return (
    <section
      id="vendor-verification"
      className="space-y-6 rounded-[1.75rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <VendorVerificationStatusBadge status={status} />
          <h2 className="mt-4 text-2xl font-bold text-secondary-950">
            Vendor Verification
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary-500">
            Admin verifies that the vendor is real, the event is real, and
            Turnupz can safely collect and pay out money.
          </p>
        </div>
        <div className="rounded-2xl bg-secondary-50 px-4 py-3 text-sm text-secondary-600">
          <span className="font-semibold text-secondary-950">{completionCount}</span>{" "}
          required fields started
        </div>
      </div>

      {isLoadingVerification && (
        <div className="rounded-2xl bg-secondary-50 px-4 py-3 text-sm text-secondary-500">
          Loading saved verification details...
        </div>
      )}

      {status === "submitted" && (
        <div className="rounded-[1.4rem] border border-cyan-100 bg-cyan-50 p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-white p-3 text-cyan-700">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-secondary-950">
                Submitted for admin review
              </p>
              <p className="mt-2 text-sm leading-6 text-secondary-600">
                Your details are saved and waiting for review. You can still
                create event drafts, but paid publishing, cross-border paid
                events, and payout requests stay locked until approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === "needs_more_info" && (
        <div className="rounded-[1.4rem] border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
          Admin needs more information. Update the requested details and submit
          the verification again.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        {approvalLevels.map((level) => (
          <div key={level.title} className="rounded-2xl bg-secondary-50 p-4">
            <p className="text-sm font-semibold text-secondary-950">
              {level.title}
            </p>
            <p className="mt-2 text-xs leading-5 text-secondary-500">
              {level.description}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <SectionHeader
            status={stepStatuses.vendorType}
            eyebrow="Step 1"
            title="Vendor Type"
            description="Tell us if this account represents you or a registered business."
          />
          <StepRequirements
            items={[
              "Choose Individual if payouts go to a personal account.",
              "Choose Registered Business if payouts go to a company account.",
              "This determines whether business registration details are required.",
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["individual", "Individual"],
              ["business", "Registered Business"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => updateField("vendorType", value as VendorType)}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold ${
                  form.vendorType === value
                    ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                    : "border-secondary-100 bg-secondary-50 text-secondary-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => submitStep("vendorType")}
            disabled={savingAction === "vendorType"}
            className="h-10 rounded-2xl"
          >
            {savingAction === "vendorType" ? "Submitting..." : "Submit Vendor Type"}
          </Button>
        </div>

        <div className="space-y-4">
          <SectionHeader
            status={stepStatuses.identity}
            eyebrow="Step 2"
            title="Identity"
            description="These details are reviewed before paid events and payouts are enabled."
          />
          <StepRequirements
            items={[
              "Legal name must match the government ID.",
              "Country of residence should match where the vendor account is operated.",
              "Government ID must be a clear image or PDF.",
              "Phone number should be reachable for verification checks.",
            ]}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Legal first name">
              <Input
                value={form.legalFirstName}
                onChange={(event) => updateField("legalFirstName", event.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Legal last name">
              <Input
                value={form.legalLastName}
                onChange={(event) => updateField("legalLastName", event.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Date of birth">
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => updateField("dateOfBirth", event.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Country of residence">
              <Input
                value={form.countryOfResidence}
                onChange={(event) =>
                  updateField("countryOfResidence", event.target.value)
                }
                placeholder="Canada, Nigeria, United States..."
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Phone number">
              <Input
                value={form.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Government ID upload">
              <Input
                type="file"
                onChange={(event) =>
                  updateField(
                    "idDocumentName",
                    event.target.files?.[0]?.name ?? "",
                  )
                }
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Address">
              <Textarea
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="min-h-24 rounded-xl"
              />
            </Field>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => submitStep("identity")}
            disabled={savingAction === "identity"}
            className="h-10 rounded-2xl"
          >
            {savingAction === "identity" ? "Submitting..." : "Submit Identity"}
          </Button>
        </div>

        {isBusiness && (
          <div className="space-y-4">
            <SectionHeader
              status={stepStatuses.business}
              eyebrow="Step 3"
              title="Business Details"
              description="Required when the vendor account belongs to a company."
            />
            <StepRequirements
              items={[
                "Business name should match registration records.",
                "Registration number or tax ID may be required by country.",
                "Authorized representative must be allowed to act for the business.",
                "Business address should match registration or tax records.",
              ]}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business name">
                <Input
                  value={form.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                  className="h-11 rounded-xl"
                />
              </Field>
              <Field label="Registration number">
                <Input
                  value={form.businessRegistrationNumber}
                  onChange={(event) =>
                    updateField("businessRegistrationNumber", event.target.value)
                  }
                  className="h-11 rounded-xl"
                />
              </Field>
              <Field label="Tax ID, if needed">
                <Input
                  value={form.taxId}
                  onChange={(event) => updateField("taxId", event.target.value)}
                  className="h-11 rounded-xl"
                />
              </Field>
              <Field label="Authorized representative">
                <Input
                  value={form.authorizedRepresentative}
                  onChange={(event) =>
                    updateField("authorizedRepresentative", event.target.value)
                  }
                  className="h-11 rounded-xl"
                />
              </Field>
              <Field label="Business address">
                <Textarea
                  value={form.businessAddress}
                  onChange={(event) =>
                    updateField("businessAddress", event.target.value)
                  }
                  className="min-h-24 rounded-xl"
                />
              </Field>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => submitStep("business")}
              disabled={savingAction === "business"}
              className="h-10 rounded-2xl"
            >
              {savingAction === "business"
                ? "Submitting..."
                : "Submit Business Details"}
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <SectionHeader
            status={stepStatuses.payout}
            eyebrow="Step 4"
            title="Payout Setup"
            description="Admin verifies that payout details belong to the vendor or business."
          />
          <StepRequirements
            items={[
              "Choose payout country to set the correct currency automatically.",
              "Bank requirements change by country.",
              "Account holder name must match the verified vendor or business.",
              "Turnupz stores only protected/tokenized payout references.",
            ]}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Payout country">
              <SelectField
                value={form.payoutCountry}
                setValue={updatePayoutCountry}
                options={countryOptions}
                placeholder="Select payout country"
                inputClassName="h-11 rounded-xl"
              />
            </Field>
            <Field label="Payout currency">
              <Input
                value={form.payoutCurrency}
                readOnly
                placeholder="NGN, CAD, USD..."
                className="h-11 rounded-xl bg-secondary-50"
              />
            </Field>
            {selectedPayoutCountry && (
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 md:col-span-2">
                <p className="font-semibold">
                  {selectedPayoutCountry.name} payout requirements
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {selectedPayoutCountry.requirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </div>
            )}
            <Field label="Account holder name">
              <Input
                value={form.accountHolderName}
                onChange={(event) =>
                  updateField("accountHolderName", event.target.value)
                }
                className="h-11 rounded-xl"
              />
            </Field>
            {selectedPayoutCountry?.fields.includes("bankName") && (
              <Field label="Bank name">
                <Input
                  value={form.bankName}
                  onChange={(event) => updateField("bankName", event.target.value)}
                  className="h-11 rounded-xl"
                />
              </Field>
            )}
            {selectedPayoutCountry?.fields.includes("accountNumber") && (
              <Field label="Account number">
                <Input
                  value={form.accountNumber}
                  placeholder={
                    maskedPayoutDetails.accountNumberLast4
                      ? `Saved ending ${maskedPayoutDetails.accountNumberLast4}`
                      : ""
                  }
                  onChange={(event) => {
                    updateField("accountNumber", event.target.value);
                    updateField("payoutAccount", event.target.value);
                  }}
                  className="h-11 rounded-xl"
                />
              </Field>
            )}
            {selectedPayoutCountry?.fields.includes("routingNumber") && (
              <Field label="Routing / branch code">
                <Input
                  value={form.routingNumber}
                  placeholder={
                    maskedPayoutDetails.routingNumberLast4
                      ? `Saved ending ${maskedPayoutDetails.routingNumberLast4}`
                      : ""
                  }
                  onChange={(event) =>
                    updateField("routingNumber", event.target.value)
                  }
                  className="h-11 rounded-xl"
                />
              </Field>
            )}
            {selectedPayoutCountry?.fields.includes("sortCode") && (
              <Field label="Sort code">
                <Input
                  value={form.sortCode}
                  placeholder={
                    maskedPayoutDetails.sortCodeLast4
                      ? `Saved ending ${maskedPayoutDetails.sortCodeLast4}`
                      : ""
                  }
                  onChange={(event) => updateField("sortCode", event.target.value)}
                  className="h-11 rounded-xl"
                />
              </Field>
            )}
            {selectedPayoutCountry?.fields.includes("iban") && (
              <Field label="IBAN">
                <Input
                  value={form.iban}
                  placeholder={
                    maskedPayoutDetails.ibanLast4
                      ? `Saved ending ${maskedPayoutDetails.ibanLast4}`
                      : ""
                  }
                  onChange={(event) => {
                    updateField("iban", event.target.value);
                    updateField("payoutAccount", event.target.value);
                  }}
                  className="h-11 rounded-xl"
                />
              </Field>
            )}
            {selectedPayoutCountry?.fields.includes("swiftCode") && (
              <Field label="SWIFT/BIC code">
                <Input
                  value={form.swiftCode}
                  onChange={(event) => updateField("swiftCode", event.target.value)}
                  className="h-11 rounded-xl"
                />
              </Field>
            )}
            {(maskedPayoutDetails.payoutAccountLast4 ||
              maskedPayoutDetails.payoutAccountRef) && (
              <div className="rounded-2xl border border-secondary-100 bg-secondary-50 px-4 py-3 text-sm text-secondary-600 md:col-span-2">
                Saved payout details are protected.{" "}
                {maskedPayoutDetails.payoutAccountLast4
                  ? `Account ending ${maskedPayoutDetails.payoutAccountLast4}.`
                  : ""}
                {maskedPayoutDetails.payoutAccountRef
                  ? ` Reference: ${maskedPayoutDetails.payoutAccountRef}.`
                  : ""}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => submitStep("payout")}
            disabled={savingAction === "payout"}
            className="h-10 rounded-2xl"
          >
            {savingAction === "payout" ? "Submitting..." : "Submit Payout Setup"}
          </Button>
        </div>

        <div className="space-y-4">
          <SectionHeader
            status={stepStatuses.crossBorder}
            eyebrow="Step 5"
            title="Cross-Border Hosting"
            description="Complete this if you plan to host paid events outside your account country."
          />
          <StepRequirements
            items={[
              "List each country where you plan to host paid events.",
              "Explain why you are hosting outside your residence or payout country.",
              "Upload supporting documents if venue, partnership, or business proof is needed.",
            ]}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Countries you plan to host in">
              <Input
                value={form.crossBorderCountries}
                onChange={(event) =>
                  updateField("crossBorderCountries", event.target.value)
                }
                placeholder="Nigeria, Canada..."
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Supporting document, optional">
              <Input
                type="file"
                onChange={(event) =>
                  updateField(
                    "supportingDocumentName",
                    event.target.files?.[0]?.name ?? "",
                  )
                }
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Reason for hosting outside your country">
              <Textarea
                value={form.crossBorderReason}
                onChange={(event) =>
                  updateField("crossBorderReason", event.target.value)
                }
                className="min-h-24 rounded-xl"
              />
            </Field>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => submitStep("crossBorder")}
            disabled={savingAction === "crossBorder"}
            className="h-10 rounded-2xl"
          >
            {savingAction === "crossBorder"
              ? "Submitting..."
              : "Submit Cross-Border Details"}
          </Button>
        </div>

        <div className="space-y-4">
          <SectionHeader
            status={stepStatuses.review}
            eyebrow="Step 6"
            title="Review and Submit"
            description="You can create drafts now. Paid publishing and payouts unlock after approval."
          />
          <StepRequirements
            items={[
              "Review all submitted steps before final submission.",
              "Paid publishing and payouts stay locked until admin approval.",
              "Admin may approve one step and request more information for another.",
            ]}
          />
          <label className="flex items-start gap-3 rounded-2xl border border-secondary-100 bg-secondary-50 p-4 text-sm text-secondary-600">
            <input
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(event) =>
                updateField("acceptedTerms", event.target.checked)
              }
              className="mt-1"
            />
            <span>
              I confirm the submitted details are accurate and agree that admin
              may review identity, event legitimacy, payout safety, and
              cross-border risk before paid features are enabled.
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={saveDraft}
          disabled={savingAction === "draft" || savingAction === "submit"}
          className="h-11 rounded-2xl"
        >
          <Clock3 className="size-4" />
          {savingAction === "draft" ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          type="button"
          onClick={submitVerification}
          disabled={savingAction === "submit" || savingAction === "draft"}
          className="h-11 rounded-2xl bg-secondary-400 text-white hover:bg-secondary-500"
        >
          <CheckCircle2 className="size-4" />
          {savingAction === "submit" ? "Submitting..." : "Submit for Review"}
        </Button>
      </div>
    </section>
  );
});
