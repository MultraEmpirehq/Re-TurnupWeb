import { cn } from "@/lib/utils";
import React, { memo } from "react";

const STEP_CONFIG = [
  { step: 1, title: "Event Details" },
  { step: 2, title: "Tickets" },
  { step: 3, title: "Media & Sponsors" },
  { step: 4, title: "Preview & Publish" },
] as const;

type StepStatus = "completed" | "current" | "upcoming";

const StepDetails: React.FC<{
  step: number;
  title: string;
  status: StepStatus;
  isFirst?: boolean;
  isLast?: boolean;
  isLeftConnectorComplete?: boolean;
  isRightConnectorComplete?: boolean;
  /** When set, the step can be jumped to (editing: everything's filled in). */
  onClick?: () => void;
}> = memo(
  ({
    step,
    title,
    status,
    isFirst,
    isLast,
    isLeftConnectorComplete,
    isRightConnectorComplete,
    onClick,
  }) => {
    const Circle = onClick ? "button" : "div";
    return (
      <li
        className="flex flex-col items-center shrink-0 flex-1 min-w-0 list-none"
        aria-current={status === "current" ? "step" : undefined}
      >
        <div className="flex items-center w-full gap-1">
          <div
            className={cn(
              "flex-1 h-0.5 min-w-[6px] sm:min-w-[12px] transition-colors self-center shrink-0",
              isFirst && "invisible",
              !isFirst && isLeftConnectorComplete && "bg-primary",
              !isFirst && !isLeftConnectorComplete && "bg-secondary-200",
            )}
            aria-hidden
          />
          <Circle
            {...(onClick
              ? { type: "button" as const, onClick, "aria-label": `Go to ${title}` }
              : {})}
            className={cn(
              onClick && "cursor-pointer hover:opacity-90",
              "relative z-10 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition-colors size-8 ring-2 ring-offset-2 ring-offset-background",
              status === "completed" &&
                "bg-primary text-primary-foreground ring-primary",
              status === "current" &&
                "bg-primary text-primary-foreground ring-primary",
              status === "upcoming" &&
                "bg-secondary-200 text-secondary-600 ring-transparent",
            )}
          >
            {status === "completed" ? (
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <span>{step}</span>
            )}
          </Circle>
          <div
            className={cn(
              "flex-1 h-0.5 min-w-[6px] sm:min-w-[12px] transition-colors self-center shrink-0",
              isLast && "invisible",
              !isLast && isRightConnectorComplete && "bg-primary",
              !isLast && !isRightConnectorComplete && "bg-secondary-200",
            )}
            aria-hidden
          />
        </div>
        <p
          className={cn(
            "mt-2 text-xs font-medium text-center max-w-18 sm:max-w-none",
            status === "current" && "text-primary",
            status === "completed" && "text-secondary-600",
            status === "upcoming" && "text-secondary-400",
          )}
        >
          {title}
        </p>
      </li>
    );
  },
);

StepDetails.displayName = "StepDetails";

const Steps: React.FC<{
  currentStep?: number;
  /** Other names for the steps, in order (editing ends in "Review & Save"). */
  titles?: readonly string[];
  label?: string;
  onStepClick?: (step: number) => void;
}> = memo(
  ({ currentStep = 1, titles, label = "Create event progress", onStepClick }) => {
    const active = Math.max(1, Math.min(currentStep, STEP_CONFIG.length));

    return (
      <nav className="w-full" aria-label={label}>
        <ol
          role="list"
          className="flex items-start justify-between w-full list-none p-0 m-0"
        >
          {STEP_CONFIG.map(({ step, title }, index) => {
            const status: StepStatus =
              step < active
                ? "completed"
                : step === active
                  ? "current"
                  : "upcoming";
            const isLeftConnectorComplete = active >= step;
            const isRightConnectorComplete = active > step;
            return (
              <StepDetails
                key={step}
                step={step}
                title={titles?.[index] ?? title}
                status={status}
                onClick={onStepClick ? () => onStepClick(step) : undefined}
                isFirst={index === 0}
                isLast={index === STEP_CONFIG.length - 1}
                isLeftConnectorComplete={isLeftConnectorComplete}
                isRightConnectorComplete={isRightConnectorComplete}
              />
            );
          })}
        </ol>
      </nav>
    );
  },
);

Steps.displayName = "Steps";

export default Steps;
