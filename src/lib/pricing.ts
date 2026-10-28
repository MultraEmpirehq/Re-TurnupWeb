/**
 * What Turnupz charges: the standard 4% of each paid ticket (after any promo
 * code), with no flat fee. It must match the server's PLATFORM_FEE_PERCENT and
 * PLATFORM_FEE_FLAT; change both together and every page that shows it follows.
 */
export const PRICING = {
  currency: "NGN",
  /** Share of each paid ticket's price. */
  percent: 0.04,
  /** Flat amount added per paid ticket, in naira (none unless approved). */
  flatPerTicket: 0,
} as const;

/** The fee on one paid ticket at `price` naira. Free tickets cost nothing. */
export const ticketFee = (price: number) =>
  price > 0 ? Math.round(price * PRICING.percent + PRICING.flatPerTicket) : 0;

export const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: PRICING.currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const FEE_LABEL = PRICING.flatPerTicket
  ? `${PRICING.percent * 100}% + ${formatNaira(PRICING.flatPerTicket)}`
  : `${PRICING.percent * 100}%`;
