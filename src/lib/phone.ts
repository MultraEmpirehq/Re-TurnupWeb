import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

export type { CountryCode };

const FALLBACK_COUNTRY: CountryCode = "NG";

/** Shown first: where Turnupz runs. */
const PRIORITY: CountryCode[] = ["CA", "GB", "NG", "US"];

export const PHONE_INVALID_MESSAGE =
  "Check your phone number. It doesn't look right for that country.";

export const dialCode = (country: CountryCode) =>
  `+${getCountryCallingCode(country)}`;

/** A country's flag, made from its two letters. */
export const flagOf = (country: CountryCode) =>
  String.fromCodePoint(
    ...[...country].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65),
  );

const names = new Intl.DisplayNames(["en"], { type: "region" });

/** Where Turnupz runs first, then everyone else by name. */
export const PHONE_COUNTRIES = (() => {
  const all = getCountries().map((code) => ({
    code,
    name: names.of(code) ?? code,
  }));
  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name);
  return [
    ...all.filter((item) => PRIORITY.includes(item.code)).sort(byName),
    ...all.filter((item) => !PRIORITY.includes(item.code)).sort(byName),
  ];
})();

/** A country code we can use, from whatever the profile holds. */
export const phoneCountryFrom = (code?: string | null): CountryCode =>
  code && isSupportedCountry(code) ? code : FALLBACK_COUNTRY;

/** The full number the api stores, from the country picked and what was typed. */
export const fullPhone = (country: CountryCode, typed: string) => {
  if (!typed.trim()) return "";
  return (
    parsePhoneNumberFromString(typed, country)?.number ??
    `${dialCode(country)}${typed.replace(/\D/g, "").replace(/^0+/, "")}`
  );
};

/** A stored number, split back into its country and the rest. */
export const splitPhone = (value: string, fallback: CountryCode) => {
  const parsed = value
    ? parsePhoneNumberFromString(value, fallback)
    : undefined;
  return {
    country: parsed?.country ?? fallback,
    typed: parsed?.nationalNumber ?? value,
  };
};

export const isValidPhone = (value: string) =>
  isValidPhoneNumber(value.trim());
