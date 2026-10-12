import { IVerificationDocument } from "@/lib/types";
import { format } from "date-fns";

export type VerificationStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_more_info";

export type VendorType = "individual" | "business";

/**
 * free: free events only, no ID or bank details, approved straight away.
 * paid: the full verification, to sell tickets.
 */
export type VendorPlan = "free" | "paid";

export type VerificationStepKey =
  "vendorType" | "identity" | "business" | "payout" | "crossBorder" | "review";

export type PayoutField =
  | "bankName"
  | "accountNumber"
  | "routingNumber"
  | "sortCode"
  | "iban"
  | "swiftCode";

export interface PayoutCountry {
  code: string;
  name: string;
  currency: string;
  fields: PayoutField[];
  /**
   * Paid by the payment provider straight to the organiser's bank, so the bank
   * is picked from the provider's list (which gives its code).
   */
  directPayout?: boolean;
  /** What the account number looks like there, to check it before saving. */
  accountNumber?: { pattern: RegExp; hint: string };
  routingNumber?: { pattern: RegExp; hint: string; label: string };
}

export const PAYOUT_COUNTRIES: PayoutCountry[] = [
  {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    fields: ["bankName", "accountNumber"],
    directPayout: true,
    accountNumber: { pattern: /^\d{10}$/, hint: "Your 10-digit NUBAN." },
  },
  {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    fields: ["bankName", "routingNumber", "accountNumber"],
    directPayout: true,
    accountNumber: { pattern: /^\d{6,16}$/, hint: "6 to 16 digits." },
    routingNumber: {
      pattern: /^\d{6}$/,
      hint: "Your bank's 6-digit branch code.",
      label: "Branch code",
    },
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    fields: ["bankName", "sortCode", "accountNumber"],
    accountNumber: { pattern: /^\d{8}$/, hint: "8 digits." },
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    fields: ["bankName", "routingNumber", "accountNumber"],
    accountNumber: { pattern: /^\d{4,17}$/, hint: "4 to 17 digits." },
    routingNumber: {
      pattern: /^\d{9}$/,
      hint: "The 9-digit ACH routing number.",
      label: "Routing number",
    },
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    fields: ["bankName", "routingNumber", "accountNumber"],
    accountNumber: { pattern: /^\d{5,12}$/, hint: "5 to 12 digits." },
    routingNumber: {
      pattern: /^\d{8,9}$/,
      hint: "Transit and institution number, 8 or 9 digits.",
      label: "Transit / institution number",
    },
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    fields: ["bankName", "iban", "swiftCode"],
  },
];

export const findPayoutCountry = (value?: string | null) =>
  PAYOUT_COUNTRIES.find(
    (country) =>
      country.name.toLowerCase() === value?.trim().toLowerCase() ||
      country.code.toLowerCase() === value?.trim().toLowerCase(),
  );

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  needs_more_info: "Needs more info",
};

export const STEP_LABELS: Record<VerificationStepKey, string> = {
  vendorType: "Hosting",
  identity: "Identity",
  business: "Business",
  payout: "Payout",
  crossBorder: "Hosting abroad",
  review: "Review",
};

/** The last four of what was saved: full numbers never come back from the API. */
export interface SavedPayoutDigits {
  accountNumberLast4?: string | null;
  routingNumberLast4?: string | null;
  sortCodeLast4?: string | null;
  ibanLast4?: string | null;
}

export type VendorVerificationApiResponse = SavedPayoutDigits & {
  status?: VerificationStatus;
  plan?: VendorPlan | null;
  /** Approved at any level: the verified tick. */
  isVerified?: boolean;
  /** Approved to sell tickets (paid or cross-border level). */
  canSellTickets?: boolean;
  signUpCap?: number | null;
  approvalLevel?: string | null;
  vendorType?: VendorType | null;
  legalFirstName?: string | null;
  legalLastName?: string | null;
  dateOfBirth?: string | null;
  countryOfResidence?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  businessName?: string | null;
  businessRegistrationNumber?: string | null;
  businessAddress?: string | null;
  taxId?: string | null;
  authorizedRepresentative?: string | null;
  payoutCountry?: string | null;
  payoutCurrency?: string | null;
  accountHolderName?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  swiftCode?: string | null;
  crossBorderCountries?: string[] | string | null;
  crossBorderReason?: string | null;
  acceptedTerms?: boolean;
  stepStatuses?: Partial<Record<VerificationStepKey, VerificationStatus>>;
  needsMoreInfoMessage?: string | null;
  rejectionReason?: string | null;
  idDocumentDetails?: IVerificationDocument | null;
  supportingDocumentDetails?: IVerificationDocument | null;
};

/** The form, one object across every step. */
export interface VerificationFormValues {
  /** Blank until they choose. */
  plan: VendorPlan | "";
  vendorType: VendorType;
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth?: Date;
  countryOfResidence: string;
  address: string;
  phoneNumber: string;
  /** A new file picked, or the one already on the application. */
  idDocument?: File | IVerificationDocument | null;
  businessName: string;
  businessRegistrationNumber: string;
  businessAddress: string;
  taxId: string;
  authorizedRepresentative: string;
  payoutCountry: string;
  accountHolderName: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  routingNumber: string;
  sortCode: string;
  iban: string;
  swiftCode: string;
  /** Not sent: whether they'll host paid events abroad, which opens that step. */
  hostsAbroad: boolean;
  crossBorderCountries: string[];
  crossBorderReason: string;
  supportingDocument?: File | IVerificationDocument | null;
  acceptedTerms: boolean;
}

export const DEFAULT_VALUES: VerificationFormValues = {
  plan: "",
  vendorType: "individual",
  legalFirstName: "",
  legalLastName: "",
  dateOfBirth: undefined,
  countryOfResidence: "",
  address: "",
  phoneNumber: "",
  idDocument: null,
  businessName: "",
  businessRegistrationNumber: "",
  businessAddress: "",
  taxId: "",
  authorizedRepresentative: "",
  payoutCountry: "",
  accountHolderName: "",
  bankName: "",
  bankCode: "",
  accountNumber: "",
  routingNumber: "",
  sortCode: "",
  iban: "",
  swiftCode: "",
  hostsAbroad: false,
  crossBorderCountries: [],
  crossBorderReason: "",
  supportingDocument: null,
  acceptedTerms: false,
};

const asList = (
  value: VendorVerificationApiResponse["crossBorderCountries"],
) =>
  Array.isArray(value)
    ? value
    : (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

/** The saved application as form values. Full bank numbers start blank. */
export const formFromApi = (
  data?: VendorVerificationApiResponse | null,
): VerificationFormValues => {
  if (!data) return DEFAULT_VALUES;
  const countries = asList(data.crossBorderCountries);
  const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
  return {
    ...DEFAULT_VALUES,
    plan: data.plan ?? "",
    vendorType: data.vendorType ?? "individual",
    legalFirstName: data.legalFirstName ?? "",
    legalLastName: data.legalLastName ?? "",
    dateOfBirth:
      dateOfBirth && !Number.isNaN(dateOfBirth.getTime())
        ? dateOfBirth
        : undefined,
    countryOfResidence: data.countryOfResidence ?? "",
    address: data.address ?? "",
    phoneNumber: data.phoneNumber ?? "",
    idDocument: data.idDocumentDetails ?? null,
    businessName: data.businessName ?? "",
    businessRegistrationNumber: data.businessRegistrationNumber ?? "",
    businessAddress: data.businessAddress ?? "",
    taxId: data.taxId ?? "",
    authorizedRepresentative: data.authorizedRepresentative ?? "",
    payoutCountry: findPayoutCountry(data.payoutCountry)?.name ?? "",
    accountHolderName: data.accountHolderName ?? "",
    bankName: data.bankName ?? "",
    bankCode: data.bankCode ?? "",
    swiftCode: data.swiftCode ?? "",
    hostsAbroad: countries.length > 0 || !!data.crossBorderReason,
    crossBorderCountries: countries,
    crossBorderReason: data.crossBorderReason ?? "",
    supportingDocument: data.supportingDocumentDetails ?? null,
    acceptedTerms: !!data.acceptedTerms,
  };
};

/** Which fields each step sends, as the API names them. */
export const STEP_FIELDS: Record<VerificationStepKey, (keyof ApiPayload)[]> = {
  vendorType: ["plan", "vendorType"],
  identity: [
    "legalFirstName",
    "legalLastName",
    "dateOfBirth",
    "countryOfResidence",
    "address",
    "phoneNumber",
    "idDocumentId",
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
    "accountHolderName",
    "bankName",
    "bankCode",
    "accountNumber",
    "payoutAccount",
    "routingNumber",
    "sortCode",
    "iban",
    "swiftCode",
  ],
  crossBorder: [
    "crossBorderCountries",
    "crossBorderReason",
    "supportingDocumentId",
  ],
  review: ["acceptedTerms"],
};

export interface ApiPayload {
  plan?: VendorPlan;
  vendorType?: VendorType;
  legalFirstName?: string;
  legalLastName?: string;
  dateOfBirth?: string;
  countryOfResidence?: string;
  address?: string;
  phoneNumber?: string;
  idDocumentId?: string;
  businessName?: string;
  businessRegistrationNumber?: string;
  businessAddress?: string;
  taxId?: string;
  authorizedRepresentative?: string;
  payoutCountry?: string;
  payoutCurrency?: string;
  accountHolderName?: string;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  payoutAccount?: string;
  routingNumber?: string;
  sortCode?: string;
  iban?: string;
  swiftCode?: string;
  crossBorderCountries?: string[];
  crossBorderReason?: string;
  supportingDocumentId?: string;
  acceptedTerms?: boolean;
}

const clean = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * The form as the API takes it. Blank bank numbers are left out, so saving
 * again keeps the ones already on file; documents go as attachment ids.
 */
export const toApiPayload = (
  values: VerificationFormValues,
  documentIds: { idDocument?: string; supportingDocument?: string },
): ApiPayload => {
  const country = findPayoutCountry(values.payoutCountry);
  const digits = (value: string) => clean(value.replace(/[\s-]/g, ""));
  const accountNumber = digits(values.accountNumber);
  const iban = clean(values.iban.replace(/\s/g, "").toUpperCase());
  const payload: ApiPayload = {
    plan: values.plan || undefined,
    vendorType: values.vendorType,
    legalFirstName: clean(values.legalFirstName),
    legalLastName: clean(values.legalLastName),
    dateOfBirth: values.dateOfBirth
      ? format(values.dateOfBirth, "yyyy-MM-dd")
      : undefined,
    countryOfResidence: clean(values.countryOfResidence),
    address: clean(values.address),
    phoneNumber: clean(values.phoneNumber),
    idDocumentId: documentIds.idDocument,
    businessName: clean(values.businessName),
    businessRegistrationNumber: clean(values.businessRegistrationNumber),
    businessAddress: clean(values.businessAddress),
    taxId: clean(values.taxId),
    authorizedRepresentative: clean(values.authorizedRepresentative),
    payoutCountry: country?.name ?? clean(values.payoutCountry),
    payoutCurrency: country?.currency,
    accountHolderName: clean(values.accountHolderName),
    bankName: clean(values.bankName),
    bankCode: clean(values.bankCode),
    accountNumber,
    payoutAccount: accountNumber ?? iban,
    routingNumber: digits(values.routingNumber),
    sortCode: digits(values.sortCode),
    iban,
    swiftCode: clean(values.swiftCode.toUpperCase()),
    crossBorderCountries: values.hostsAbroad ? values.crossBorderCountries : [],
    crossBorderReason: values.hostsAbroad
      ? clean(values.crossBorderReason)
      : undefined,
    supportingDocumentId: documentIds.supportingDocument,
    acceptedTerms: values.acceptedTerms,
  };
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as ApiPayload;
};

export const STORAGE_KEY = "turnupz-vendor-verification";
