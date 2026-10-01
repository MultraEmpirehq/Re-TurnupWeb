import { Country } from "country-state-city";
import { TComboboxItem } from "@/components/ui/combobox-select";

export interface CurrencyItem {
  code: string;
  name: string;
  label: string;
}

/**
 * Standard E.164 phone number validation.
 * Complies with ITU-T E.164 international numbering recommendation:
 * - Allows optional leading '+'
 * - Non-zero leading country code digit
 * - Total digits between 7 and 15
 * - Strips common display formatting (spaces, dashes, parentheses, dots)
 */
export const isValidPhoneNumberStandard = (phone: string): boolean => {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s\-().]/g, "");
  const e164Regex = /^\+?[1-9]\d{6,14}$/;
  return e164Regex.test(cleaned);
};

/**
 * Validates that the provided date of birth indicates an age of at least 18 years.
 */
export const isValidAdultDOB = (dobString: string): boolean => {
  if (!dobString) return false;
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return false;

  const today = new Date();
  const minAdultDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  return dob <= minAdultDate;
};

/**
 * Generates the full country list from the installed `country-state-city` library.
 * Formats each country with its flag emoji and country name.
 */
export const getAllCountryOptions = (): TComboboxItem[] => {
  return Country.getAllCountries().map((country) => ({
    value: country.name,
    label: `${country.flag} ${country.name}`,
  }));
};

/**
 * Retrieves all unique ISO currencies using `country-state-city` and standard `Intl`.
 * Alphabetically sorted by currency code.
 */
export const getAllCurrencies = (): TComboboxItem[] => {
  const currencyMap = new Map<string, CurrencyItem>();

  // 1. Gather all currencies provided by country-state-city
  Country.getAllCountries().forEach((country) => {
    if (country.currency && !currencyMap.has(country.currency)) {
      currencyMap.set(country.currency, {
        code: country.currency,
        name: country.name,
        label: `${country.currency} (${country.name})`,
      });
    }
  });

  // 2. Supplement and standardize using modern browser/Node Intl API
  if (
    typeof Intl !== "undefined" &&
    typeof Intl.supportedValuesOf === "function"
  ) {
    try {
      const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });
      Intl.supportedValuesOf("currency").forEach((code) => {
        const name = displayNames.of(code) || code;
        currencyMap.set(code, {
          code,
          name,
          label: `${code} - ${name}`,
        });
      });
    } catch {
      // Fallback gracefully if displayNames/supportedValuesOf fails
    }
  }

  return Array.from(currencyMap.values())
    .map((item) => ({
      value: item.code,
      label: item.label,
    }))
    .toSorted((a, b) => a.value.localeCompare(b.value));
};
