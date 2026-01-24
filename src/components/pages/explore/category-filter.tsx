"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import React, { memo } from "react";

const categories = [
  { name: "Indoor", value: "indoor" },
  { name: "Outdoor", value: "outdoor" },
  { name: "Sports", value: "sports" },
  { name: "Venue", value: "venue" },
];

const CategoryFilter = () => {
  const searchParam = useSearchParams();
  const selectedCategory = searchParam?.get("category")?.toString();
  return (
    <div className="space-y-4 text-sm">
      <h1 className="font-medium">Category</h1>
      <form className="space-y-2">
        {categories.map((category) => (
          <div
            key={category?.value}
            className="flex flex-row items-center gap-2 opacity-60"
          >
            <Checkbox
              checked={selectedCategory === category?.value}
              value={category?.value}
              id={`${category?.value}-category`}
              name="categoryId"
            />
            <Label htmlFor="categoryId" className="text-sm">
              {category?.name || "Category name"}
            </Label>
          </div>
        ))}
      </form>
    </div>
  );
};

export default memo(CategoryFilter);
