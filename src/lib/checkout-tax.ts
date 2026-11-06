/**
 * Tax shown at checkout, from the rates the api gives for the event. The api
 * works the real amount out again when the order is made; this is the same sum
 * so the buyer sees it first. Amounts are in main units (naira, dollars).
 */
export type TTaxRate = { code: string; label: string; ppm: number };
export type TEventTaxRates = { taxInclusive: boolean; rates: TTaxRate[] };

const PPM = 1_000_000;
const toMinor = (amount: number) => Math.round(amount * 100);
const halfUp = (value: number) => Math.floor(value + 0.5);

export const checkoutTax = (priced: number, tax?: TEventTaxRates | null) => {
  const lines: { code: string; label: string; ppm: number; amount: number }[] = [];
  if (!tax?.rates.length || priced <= 0) {
    return { gross: priced, lines, included: false };
  }
  const minor = toMinor(priced);
  if (!tax.taxInclusive) {
    for (const rate of tax.rates) {
      lines.push({ ...rate, amount: halfUp((minor * rate.ppm) / PPM) / 100 });
    }
    return {
      gross: (minor + lines.reduce((sum, line) => sum + toMinor(line.amount), 0)) / 100,
      lines,
      included: false,
    };
  }
  const totalPpm = tax.rates.reduce((sum, rate) => sum + rate.ppm, 0);
  const net = halfUp((minor * PPM) / (PPM + totalPpm));
  for (const rate of tax.rates) {
    lines.push({ ...rate, amount: halfUp((net * rate.ppm) / PPM) / 100 });
  }
  return { gross: priced, lines, included: true };
};

export const percentOf = (ppm: number) => `${Number((ppm / 10_000).toFixed(3))}%`;
