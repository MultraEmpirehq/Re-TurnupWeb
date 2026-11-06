"use client";

import { Switch } from "@/components/ui/switch";
import { useVendorTax } from "@/hooks/use-tax";
import React, { memo } from "react";

/**
 * Whether an event's prices include tax. Only an organiser registered for tax in
 * the event's country has anything to choose, so nobody else sees it.
 */
const EventTaxOptions: React.FC<{
  countryCode?: string;
  stateCode?: string;
  taxInclusive?: boolean | null;
  qualifying?: boolean;
  onTaxInclusive: (value: boolean) => void;
  onQualifying: (value: boolean) => void;
}> = ({ countryCode, stateCode, taxInclusive, qualifying, onTaxInclusive, onQualifying }) => {
  const { data } = useVendorTax();
  const registeredFor = (kind: string) =>
    data?.registrations.some(
      (row) => row.kind === kind && row.status === "REGISTERED" && row.reviewStatus !== "REJECTED",
    );
  const country = countryCode?.toUpperCase();
  const chargesTax =
    country === "NG" ? registeredFor("NG_VAT") : country === "CA" && registeredFor("CA_GST_HST");
  if (!chargesTax) return null;
  const pricesIncludeTax = taxInclusive ?? country !== "CA";

  return (
    <div className="w-full space-y-3 rounded-2xl border border-secondary-100 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-secondary-900">Ticket prices include tax</p>
          <p className="text-sm text-secondary-500">
            {pricesIncludeTax
              ? "Buyers pay the price you set, and the tax is part of it."
              : "Tax is added on top of your price at checkout."}
          </p>
        </div>
        <Switch checked={pricesIncludeTax} onCheckedChange={onTaxInclusive} aria-label="Ticket prices include tax" />
      </div>
      {country === "CA" && stateCode?.toUpperCase() === "SK" && registeredFor("CA_SK_PST") && (
        <div className="flex items-center justify-between gap-4 border-t border-secondary-100 pt-3">
          <p className="text-sm text-secondary-700">Saskatchewan PST applies to this admission</p>
          <Switch
            checked={!!qualifying}
            onCheckedChange={onQualifying}
            aria-label="Saskatchewan PST applies to this admission"
          />
        </div>
      )}
    </div>
  );
};

export default memo(EventTaxOptions);
