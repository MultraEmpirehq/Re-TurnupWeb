import { getData } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { Country } from "country-state-city";
import { useMemo } from "react";

/**
 * A country Turnupz is open in. The backend decides which ones (its MARKETS
 * setting), so opening a country there opens it in every picker here.
 */
export type TMarket = {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  currency: string;
  locale: string;
  /** Who pays organisers there. */
  payouts: "FLUTTERWAVE" | "STRIPE" | "PAYSTACK";
};

/** Used until the list loads, and if it can't: what's open today. */
const FALLBACK_MARKETS: TMarket[] = [
  { code: "NG", name: "Nigeria", currency: "NGN", locale: "en-NG", payouts: "FLUTTERWAVE" },
  { code: "CA", name: "Canada", currency: "CAD", locale: "en-CA", payouts: "STRIPE" },
];

export const useMarkets = () => {
  const query = useQuery({
    queryKey: ["markets"],
    queryFn: async () => (await getData<TMarket[]>("/markets")).data?.data ?? null,
    staleTime: 60 * 60 * 1000,
  });
  return query.data?.length ? query.data : FALLBACK_MARKETS;
};

/** The open market a country (code or name) is in, if it's one. */
export const findMarket = (markets: TMarket[], country?: string | null) => {
  const value = country?.trim().toLowerCase();
  if (!value) return undefined;
  return markets.find(
    (market) => market.code.toLowerCase() === value || market.name.toLowerCase() === value,
  );
};

/** "Nigeria and Canada", for copy. */
export const marketNames = (markets: TMarket[]) => {
  const names = markets.map((market) => market.name);
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
    : (names[0] ?? "");
};

/**
 * Picker options for the open countries, with their flags. `value` is the code
 * or the name, matching what the form stores.
 */
export const useMarketOptions = (value: "code" | "name" = "code") => {
  const markets = useMarkets();
  return useMemo(
    () =>
      markets.map((market) => {
        const flag = Country.getCountryByCode(market.code)?.flag;
        return {
          value: value === "code" ? market.code : market.name,
          label: flag ? `${flag} ${market.name}` : market.name,
        };
      }),
    [markets, value],
  );
};
