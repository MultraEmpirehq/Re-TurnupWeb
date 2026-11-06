"use client";

import { getData, postData, putData } from "@/api";
import { TEventTaxRates } from "@/lib/checkout-tax";
import { useQuery } from "@tanstack/react-query";

/** The taxes on an event's tickets; none unless a decision is approved. */
export const useEventTaxRates = (eventId?: string, currency?: string) =>
  useQuery({
    queryKey: ["event-tax-rates", eventId, currency],
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () =>
      (
        await getData<TEventTaxRates>(
          `/event/${eventId}/tax-rates${currency ? `?currency=${currency}` : ""}`,
        )
      ).data?.data ?? null,
  });

/* ------------------------------------------------------------ organisers */

export type TTaxKind = "NG_VAT" | "CA_GST_HST" | "CA_QST" | "CA_SK_PST";
export type TTaxRegistrationStatus = "REGISTERED" | "NOT_REGISTERED" | "SMALL_SUPPLIER";
export type TTaxReview = "PENDING" | "CONFIRMED" | "REJECTED";
export type TExemptionReason = "CHARITY" | "NON_PROFIT" | "EDUCATIONAL" | "CULTURAL" | "OTHER";

export type TVendorTaxOverview = {
  countries: {
    countryCode: "NG" | "CA";
    taxInclusiveByDefault: boolean;
    kinds: { kind: TTaxKind; label: string; example?: string }[];
  }[];
  registrations: {
    kind: TTaxKind;
    status: TTaxRegistrationStatus;
    number: string | null;
    reviewStatus: TTaxReview;
    reviewNote: string | null;
  }[];
  exemptions: {
    id: string;
    countryCode: string;
    reason: TExemptionReason;
    details: string;
    status: TTaxReview;
    reviewNote: string | null;
    createdAt: string;
    event: { id: string; name: string } | null;
  }[];
};

export const useVendorTax = () =>
  useQuery({
    queryKey: ["vendor-tax"],
    queryFn: async () => (await getData<TVendorTaxOverview>("/vendor/tax")).data?.data,
  });

export const saveTaxRegistration = (kind: TTaxKind, body: { status: TTaxRegistrationStatus; number?: string }) =>
  putData<typeof body, unknown>(`/vendor/tax/registrations/${kind}`, body);

export const requestTaxExemption = (body: {
  countryCode: string;
  reason: TExemptionReason;
  details: string;
  evidenceId: string;
  eventId?: string;
}) => postData<typeof body, unknown>("/vendor/tax/exemptions", body);

/* ---------------------------------------------------------------- admins */

export type TTaxDecision = {
  id: string;
  countryCode: string;
  regionCode: string | null;
  purpose: "ADMISSION" | "COMMISSION";
  currency: string;
  status: "DRAFT" | "APPROVED" | "RETIRED";
  lines: { code: string; label: string; ppm: number; remitter: string }[];
  reason: string;
  evidenceRef: string | null;
  effectiveFrom: string;
  effectiveUntil: string | null;
  approvedAt: string | null;
};

export type TTaxOptions = {
  rates: Record<string, Record<string, { code: string; label: string; ppm: number }[]>>;
  unresolved: { id: string; question: string; blocks: string }[];
};

export type TAdminTaxRegistration = {
  id: string;
  organiser: string;
  label: string;
  number: string | null;
  reviewStatus: TTaxReview;
  reviewNote: string | null;
  updatedAt: string;
};

export type TAdminTaxExemption = {
  id: string;
  organiser: string;
  countryCode: string;
  reason: TExemptionReason;
  details: string;
  status: TTaxReview;
  reviewNote: string | null;
  createdAt: string;
  event: { id: string; name: string } | null;
  evidence: { url: string; mimeType: string } | null;
};

export const useTaxOptions = () =>
  useQuery({
    queryKey: ["admin-tax-options"],
    queryFn: async () => (await getData<TTaxOptions>("/admin/tax/options")).data?.data,
  });
export const useTaxDecisions = () =>
  useQuery({
    queryKey: ["admin-tax-decisions"],
    queryFn: async () => (await getData<TTaxDecision[]>("/admin/tax/decisions")).data?.data ?? [],
  });
export const useTaxRegistrations = (status?: TTaxReview) =>
  useQuery({
    queryKey: ["admin-tax-registrations", status],
    queryFn: async () =>
      (await getData<TAdminTaxRegistration[]>(`/admin/tax/registrations${status ? `?status=${status}` : ""}`)).data
        ?.data ?? [],
  });
export const useTaxExemptions = (status?: TTaxReview) =>
  useQuery({
    queryKey: ["admin-tax-exemptions", status],
    queryFn: async () =>
      (await getData<TAdminTaxExemption[]>(`/admin/tax/exemptions${status ? `?status=${status}` : ""}`)).data?.data ??
      [],
  });

export const createTaxDecision = (body: {
  countryCode: string;
  regionCode?: string;
  purpose: "ADMISSION" | "COMMISSION";
  currency: string;
  lines: { code: string; ppm: number }[];
  reason: string;
  evidenceRef?: string;
  effectiveFrom: string;
}) => postData<typeof body, TTaxDecision>("/admin/tax/decisions", body);
export const approveTaxDecision = (id: string, evidenceRef?: string) =>
  postData(`/admin/tax/decisions/${id}/approve`, { evidenceRef });
export const retireTaxDecision = (id: string) => postData(`/admin/tax/decisions/${id}/retire`, {});
export const reviewTaxRegistration = (id: string, status: TTaxReview, note?: string) =>
  postData(`/admin/tax/registrations/${id}/review`, { status, note });
export const reviewTaxExemption = (id: string, status: TTaxReview, note?: string) =>
  postData(`/admin/tax/exemptions/${id}/review`, { status, note });

export const recordOrganiserPayout = (
  vendorId: string,
  body: { currency: string; amount: number; reference: string; note?: string },
) => postData<typeof body, { id: string }>(`/admin/finance/organisers/${vendorId}/payouts`, body);
