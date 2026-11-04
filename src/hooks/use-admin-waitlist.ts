"use client";

import { getData } from "@/api";
import { useQuery } from "@tanstack/react-query";

export type TWaitlistRole = "attendee" | "organiser" | "both";

export type TWaitlistSignup = {
  id: string;
  email: string;
  name: string | null;
  interest: TWaitlistRole | null;
  role: TWaitlistRole | null;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  source: string | null;
  /** Set once they opened the link in the confirmation email. */
  emailConfirmedAt: string | null;
  termsAcceptedAt: string | null;
  privacyNoticeVersion: string | null;
  launchEmails: boolean;
  marketingConsent: boolean;
  newsletterConsent: boolean;
  researchConsent: boolean;
  personalizationConsent: boolean;
  createdAt: string;
};

export type TWaitlistPage = {
  items: TWaitlistSignup[];
  matching: number;
  page: number;
  limit: number;
  totals: { total: number; lastWeek: number; organisers: number; confirmed?: number };
};

export const WAITLIST_PAGE_SIZE = 50;

export const useWaitlist = (q: string, page: number) =>
  useQuery({
    queryKey: ["admin-waitlist", q, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(WAITLIST_PAGE_SIZE) });
      if (q.trim()) params.set("q", q.trim());
      return (await getData<TWaitlistPage>(`/admin/waitlist?${params}`)).data?.data;
    },
  });

/** Everyone on the list (up to 5,000), for the CSV download. */
export const fetchWholeWaitlist = async () =>
  (await getData<TWaitlistPage>("/admin/waitlist?limit=5000")).data?.data?.items ?? [];
