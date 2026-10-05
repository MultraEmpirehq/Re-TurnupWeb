/**
 * What Turnupz charges. Provisional: modelled on Tix's public rates until our own
 * are confirmed, so change the numbers here and every page that shows them follows.
 */
export const PRICING = {
  currency: "NGN",
  /** Share of each paid ticket's price. */
  percent: 0.08,
  /** Flat amount added per paid ticket, in naira. */
  flatPerTicket: 100,
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

export const FEE_LABEL = `${PRICING.percent * 100}% + ${formatNaira(PRICING.flatPerTicket)}`;
