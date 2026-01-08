import { cn } from "@/lib/utils";
import clsx from "clsx";
import React, { forwardRef, memo } from "react";

type TSectionContainerProps = React.HTMLAttributes<HTMLDivElement>;

const SectionContainer = forwardRef<HTMLDivElement, TSectionContainerProps>(
  ({ className, children }, ref) => {
    return (
      <div
        className={cn(clsx("max-w-[1200px] mx-auto px-horizontal", className))}
        ref={ref}
      >
        {children}
      </div>
    );
  }
);

SectionContainer.displayName = "SectionContainer";

export default memo(SectionContainer);
