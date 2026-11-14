/**
 * The one set of periods every report on the site offers: 7, 30 and 90 days,
 * 12 months, and all time. Counted back from now; all time has nothing before
 * it to compare with.
 */
export type TPeriodDays = 7 | 30 | 90 | 365 | 0;

export const PERIODS: { days: TPeriodDays; label: string; previous: string }[] = [
  { days: 7, label: "7 days", previous: "the 7 days before" },
  { days: 30, label: "30 days", previous: "the 30 days before" },
  { days: 90, label: "90 days", previous: "the 90 days before" },
  { days: 365, label: "12 months", previous: "the 12 months before" },
  { days: 0, label: "All time", previous: "" },
];

export const DEFAULT_PERIOD: TPeriodDays = 30;

export const isPeriod = (value: unknown): value is TPeriodDays =>
  PERIODS.some((period) => period.days === value);

/** "the last 30 days", "the last 12 months", "all time". */
export const periodPhrase = (days: TPeriodDays) =>
  days === 0 ? "all time" : `the last ${PERIODS.find((period) => period.days === days)?.label ?? `${days} days`}`;

/** What it's compared with, or null for all time. */
export const previousPhrase = (days: TPeriodDays) =>
  PERIODS.find((period) => period.days === days)?.previous || null;

const DAY = 24 * 60 * 60 * 1000;
/** Before Turnupz took its first booking: "all time" starts here. */
const BEGINNING = new Date("2024-01-01T00:00:00Z");

/** The dates a period covers, ending now. */
export const periodRange = (days: TPeriodDays, now = new Date()) => ({
  from: days === 0 ? BEGINNING : new Date(now.getTime() - days * DAY),
  to: now,
});

/* ------------------------------------------------------- calendar periods */

/**
 * Calendar periods, for money: "this month", "last month", "this year" line
 * up with statements and tax. Finance uses these; any report that needs whole
 * months or years can too.
 */
export type TCalendarPeriod =
  | "this_month"
  | "last_month"
  | "last_30"
  | "last_90"
  | "this_year"
  | "last_12_months";

export const CALENDAR_PERIODS: { value: TCalendarPeriod; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_30", label: "Last 30 days" },
  { value: "last_90", label: "Last 90 days" },
  { value: "this_year", label: "This year" },
  { value: "last_12_months", label: "Last 12 months" },
];

export const DEFAULT_CALENDAR_PERIOD: TCalendarPeriod = "this_month";

/** The dates a calendar period covers, ending now (or at the end of last month). */
export const calendarPeriodRange = (period: TCalendarPeriod, now = new Date()) => {
  const start = (year: number, month: number) => new Date(year, month, 1);
  switch (period) {
    case "last_month":
      return {
        from: start(now.getFullYear(), now.getMonth() - 1),
        to: new Date(start(now.getFullYear(), now.getMonth()).getTime() - 1),
      };
    case "last_30":
      return { from: new Date(now.getTime() - 30 * DAY), to: now };
    case "last_90":
      return { from: new Date(now.getTime() - 90 * DAY), to: now };
    case "this_year":
      return { from: start(now.getFullYear(), 0), to: now };
    case "last_12_months":
      return { from: start(now.getFullYear(), now.getMonth() - 11), to: now };
    default:
      return { from: start(now.getFullYear(), now.getMonth()), to: now };
  }
};
