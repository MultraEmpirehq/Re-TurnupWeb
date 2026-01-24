import React, { memo } from "react";
import PriceFilter from "./price-filter";
import CategoryFilter from "./category-filter";
import DateFilter from "./date-filter";

const Filter = () => {
  return (
    <div className="w-full max-w-[250px] hidden lg:block space-y-6">
      <h1 className="font-bold text-lg">Filters</h1>
      <PriceFilter />
      <DateFilter />
      <CategoryFilter />
    </div>
  );
};

export default memo(Filter);
