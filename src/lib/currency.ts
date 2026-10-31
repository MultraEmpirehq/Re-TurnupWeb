export interface AppCurrency {
  code: string;
  symbol: string;
  locale: string;
}

export const DEFAULT_APP_CURRENCY: AppCurrency = {
  code: "USD",
  symbol: "$",
  locale: "en-US",
};

const countryCurrencyMap: Record<string, AppCurrency> = {
  NG: { code: "NGN", symbol: "NGN", locale: "en-NG" },
  NGN: { code: "NGN", symbol: "NGN", locale: "en-NG" },
  NIGERIA: { code: "NGN", symbol: "NGN", locale: "en-NG" },
  CA: { code: "CAD", symbol: "CA$", locale: "en-CA" },
  CAD: { code: "CAD", symbol: "CA$", locale: "en-CA" },
  CANADA: { code: "CAD", symbol: "CA$", locale: "en-CA" },
  US: { code: "USD", symbol: "US$", locale: "en-US" },
  USD: { code: "USD", symbol: "US$", locale: "en-US" },
  USA: { code: "USD", symbol: "US$", locale: "en-US" },
  "UNITED STATES": { code: "USD", symbol: "US$", locale: "en-US" },
  GB: { code: "GBP", symbol: "GBP", locale: "en-GB" },
  GBP: { code: "GBP", symbol: "GBP", locale: "en-GB" },
  UK: { code: "GBP", symbol: "GBP", locale: "en-GB" },
  "UNITED KINGDOM": { code: "GBP", symbol: "GBP", locale: "en-GB" },
  AE: { code: "AED", symbol: "AED", locale: "en-AE" },
  AED: { code: "AED", symbol: "AED", locale: "en-AE" },
  UAE: { code: "AED", symbol: "AED", locale: "en-AE" },
  "UNITED ARAB EMIRATES": { code: "AED", symbol: "AED", locale: "en-AE" },
  ZA: { code: "ZAR", symbol: "R", locale: "en-ZA" },
  ZAR: { code: "ZAR", symbol: "R", locale: "en-ZA" },
  "SOUTH AFRICA": { code: "ZAR", symbol: "R", locale: "en-ZA" },
};

/**
 * Dollars share "$" (Canadian, US…), so they're written the international way,
 * CA$50 or US$50, wherever a price shows. Others keep their own locale (₦, £).
 */
const DOLLAR_CURRENCIES = new Set(["CAD", "USD", "AUD", "NZD", "SGD", "HKD"]);

export const moneyLocale = (code?: string | null, locale?: string) =>
  code && DOLLAR_CURRENCIES.has(code.toUpperCase()) ? "en-GB" : locale;

export const getCurrencyForCountry = (country?: string | null): AppCurrency => {
  if (!country) return DEFAULT_APP_CURRENCY;
  return (
    countryCurrencyMap[country.trim().toUpperCase()] ?? DEFAULT_APP_CURRENCY
  );
};

export const formatAppMoney = (
  amount: number,
  currency: AppCurrency = DEFAULT_APP_CURRENCY,
) =>
  new Intl.NumberFormat(moneyLocale(currency.code, currency.locale), {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(amount);
