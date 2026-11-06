"use client";

import { getData, postData } from "@/api";
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

/* ------------------------------------------------- emails to the waitlist */

export type TWaitlistAudience = "LAUNCH" | "PROMOTION";

export type TWaitlistEmailFilters = {
  audience: TWaitlistAudience;
  role?: "attendee" | "organiser";
  countryCode?: string;
};

export type TWaitlistEmailContent = {
  subject: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
};

export type TWaitlistCampaign = {
  id: string;
  subject: string;
  audience: TWaitlistAudience;
  role: string | null;
  countryCode: string | null;
  status: "SENDING" | "SENT";
  recipients: number;
  sent: number;
  failed: number;
  createdAt: string;
  finishedAt: string | null;
  createdBy: string;
};

/** How many people an email to this audience would reach, with the list's totals. */
export const useWaitlistAudience = (filters: TWaitlistEmailFilters) =>
  useQuery({
    queryKey: ["admin-waitlist-audience", filters],
    queryFn: async () => {
      const params = new URLSearchParams({ audience: filters.audience });
      if (filters.role) params.set("role", filters.role);
      if (filters.countryCode) params.set("countryCode", filters.countryCode);
      return (
        await getData<{ recipients: number; total: number; confirmed: number; notConfirmed: number }>(
          `/admin/waitlist/emails/audience?${params}`,
        )
      ).data?.data;
    },
  });

/** Emails already sent, newest first. Refreshes while one is still sending. */
export const useWaitlistCampaigns = () =>
  useQuery({
    queryKey: ["admin-waitlist-campaigns"],
    queryFn: async () =>
      (await getData<TWaitlistCampaign[]>("/admin/waitlist/emails")).data?.data ?? [],
    refetchInterval: (query) =>
      query.state.data?.some((campaign) => campaign.status === "SENDING") ? 4000 : false,
  });

export const sendWaitlistTestEmail = (content: TWaitlistEmailContent) =>
  postData<TWaitlistEmailContent, string>("/admin/waitlist/emails/test", content);

export const sendWaitlistEmail = (body: TWaitlistEmailContent & TWaitlistEmailFilters) =>
  postData<typeof body, { id: string; recipients: number }>("/admin/waitlist/emails", body);

export const resumeWaitlistEmail = (id: string) =>
  postData(`/admin/waitlist/emails/${id}/resume`, {});
