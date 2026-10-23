import { getData, postData } from "@/api";
import { useQuery } from "@tanstack/react-query";

export type TScanStatus = "approved" | "denied" | "already_checked_in";

export type TScanResult = {
  status: TScanStatus;
  message: string;
  ticketId?: string;
  eventId?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  ticketCategory?: string;
  checkedInAt?: string | null;
  scannerEmail?: string | null;
  dayId?: string;
  dayName?: string;
};

export type TScanDaySummary = {
  id: string;
  name: string;
  label: string | null;
  startsAt: string;
  endsAt: string | null;
  expected: number;
  checkedIn: number;
};

export type TScanSummary = {
  eventId: string;
  eventName: string;
  date: string;
  timezone: string;
  total: number;
  checkedIn: number;
  days: TScanDaySummary[];
  todayDayId: string | null;
};

export const scanSummaryKey = (eventId?: string) => ["scan-summary", eventId];

/** How the door is going for one event; refreshed after every scan by the page. */
export const useScanSummary = (eventId?: string) =>
  useQuery({
    queryKey: scanSummaryKey(eventId),
    queryFn: async () => {
      const { data } = await getData<TScanSummary>(
        `/event/${eventId}/scan/summary`,
      );
      return data?.data ?? null;
    },
    enabled: !!eventId,
    refetchInterval: 30_000,
  });

/** Checks a ticket in for an event (an organiser, team member or door scanner). */
export const scanEventTicket = async (
  eventId: string,
  code: string,
  dayId?: string,
) => {
  const { data } = await postData<
    { code: string; dayId?: string },
    TScanResult
  >(`/event/${eventId}/scan`, { code, ...(dayId ? { dayId } : {}) });
  return data?.data as TScanResult;
};

/** An admin's check-in for any event, by code alone. */
export const adminScanTicket = async (code: string, dayId?: string) => {
  const { data } = await postData<
    { code: string; dayId?: string },
    TScanResult
  >("/admin/scan", { code, ...(dayId ? { dayId } : {}) });
  return data?.data as TScanResult;
};
