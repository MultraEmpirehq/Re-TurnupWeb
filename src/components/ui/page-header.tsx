import { cn } from "@/lib/utils";
import React from "react";

/**
 * The top of every dashboard page: one title size, a short description that
 * hides on phones (so the content starts higher), and actions on the right.
 */
const PageHeader = ({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) => (
  <header
    className={cn(
      "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
      className,
    )}
  >
    <div className="min-w-0 space-y-1">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="hidden max-w-2xl text-sm text-muted-foreground sm:block">
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
    )}
  </header>
);

export default PageHeader;
