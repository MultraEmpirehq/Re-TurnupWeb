import { subYears } from "date-fns";

/** Turnupz accounts are for adults only. */
export const MINIMUM_AGE = 18;

/** The latest birthday that is old enough today. */
export const latestAdultBirthDate = (today = new Date()) => {
  const date = subYears(today, MINIMUM_AGE);
  date.setHours(23, 59, 59, 999);
  return date;
};

/** The earliest birthday the picker offers. */
export const earliestBirthDate = (today = new Date()) =>
  new Date(today.getFullYear() - 120, 0, 1);

export const adultAgeMessage = `You must be at least ${MINIMUM_AGE} to use Turnupz`;
