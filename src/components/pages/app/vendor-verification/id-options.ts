/**
 * The kinds of ID and business documents a vendor can upload, mirroring the
 * API (vendor-identity.ts). Which IDs always expire decides whether an expiry
 * date is asked for.
 */
export type TIdType = "passport" | "drivers_licence" | "national_id" | "voters_card" | "residence_permit" | "other";
export type TRepresentativeRole = "director" | "owner" | "partner" | "manager" | "other";
export type TBusinessDocumentType =
  | "registration_certificate"
  | "status_report"
  | "memorandum_and_articles"
  | "trade_licence"
  | "other";

export const ID_TYPES: { value: TIdType; label: string }[] = [
  { value: "passport", label: "International passport" },
  { value: "drivers_licence", label: "Driver's licence" },
  { value: "national_id", label: "National ID (e.g. NIN slip, Ghana Card)" },
  { value: "voters_card", label: "Voter's card" },
  { value: "residence_permit", label: "Residence permit" },
  { value: "other", label: "Other government ID" },
];

export const REPRESENTATIVE_ROLES: { value: TRepresentativeRole; label: string }[] = [
  { value: "director", label: "Director" },
  { value: "owner", label: "Owner" },
  { value: "partner", label: "Partner" },
  { value: "manager", label: "Manager" },
  { value: "other", label: "Other" },
];

export const BUSINESS_DOCUMENT_TYPES: { value: TBusinessDocumentType; label: string }[] = [
  { value: "registration_certificate", label: "Certificate of registration (e.g. CAC certificate)" },
  { value: "status_report", label: "Status report / registry extract" },
  { value: "memorandum_and_articles", label: "Memorandum and articles" },
  { value: "trade_licence", label: "Trade or business licence" },
  { value: "other", label: "Other official document" },
];

/** Passports, licences and permits always expire; a voter's card never does. */
export const idNeedsExpiry = (type?: string | null) =>
  type === "passport" || type === "drivers_licence" || type === "residence_permit";
export const idHasNoExpiry = (type?: string | null) => type === "voters_card";

export const labelOf = <T extends string>(options: { value: T; label: string }[], value?: string | null) =>
  options.find((option) => option.value === value)?.label ?? null;
