"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import React, { memo } from "react";

const priceTypes = [
  {
    name: "Free",
    value: "free",
  },
  {
    name: "Paid",
    value: "paid",
  },
];

const PriceFilter = () => {
  const searchParam = useSearchParams();
  const selectedPriceType = searchParam?.get("priceType")?.toString();
  return (
    <div className="space-y-4 text-sm pb-10 border-b">
      <h1 className="font-medium">Price</h1>
      <form className="space-y-2">
        {priceTypes.map((priceType) => (
          <div
            key={priceType?.value}
            className="flex flex-row items-center gap-2 opacity-60"
          >
            <Checkbox
              checked={selectedPriceType === priceType?.value}
              id={`${priceType?.value}-price`}
              name="priceType"
              value={priceType?.value}
            />
            <Label htmlFor="priceType" className="text-sm">
              {priceType?.name || "Price type"}
            </Label>
          </div>
        ))}
      </form>
    </div>
  );
};

export default memo(PriceFilter);
