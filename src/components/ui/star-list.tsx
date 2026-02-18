"use client";

import React, { memo, useMemo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type StarFill = "full" | "half" | "empty";

interface StarListProps {
  totalStars?: number;
  rating?: number;
  className?: string;
  starClassName?: string;
  size?: number;
}

const StarList: React.FC<StarListProps> = ({
  totalStars = 5,
  rating = 0,
  className,
  starClassName,
  size = 18,
}) => {
  const fills = useMemo((): StarFill[] => {
    const list: StarFill[] = [];
    const clamped = Math.max(0, Math.min(rating, totalStars));
    for (let i = 1; i <= totalStars; i++) {
      if (clamped >= i) list.push("full");
      else if (clamped >= i - 0.5) list.push("half");
      else list.push("empty");
    }
    return list;
  }, [rating, totalStars]);

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Rating: ${rating} out of ${totalStars} stars`}
    >
      {fills.map((fill, index) => (
        <span
          key={index}
          className={cn("inline-flex shrink-0", starClassName)}
          style={{ width: size, height: size }}
        >
          {fill === "full" && (
            <Star
              size={size}
              className="text-amber-500 fill-amber-500"
              aria-hidden
            />
          )}
          {fill === "half" && (
            <span className="relative inline-block size-full">
              <Star
                size={size}
                className="text-muted-foreground/30"
                aria-hidden
              />
              <span className="absolute inset-0 w-1/2 overflow-hidden">
                <Star
                  size={size}
                  className="text-amber-500 fill-amber-500"
                  aria-hidden
                />
              </span>
            </span>
          )}
          {fill === "empty" && (
            <Star
              size={size}
              className="text-muted-foreground/30"
              aria-hidden
            />
          )}
        </span>
      ))}
    </div>
  );
};

export default memo(StarList);
