import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import React, { memo } from "react";

const OverviewCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  iconParentClassName?: string;
  className?: string;
}> = memo(({ title, value, icon, iconParentClassName, className }) => {
  return (
    <div
      className={cn(
        "p-3 sm:p-4 rounded-lg bg-white shadow border flex flex-row items-center gap-3 sm:gap-4 min-w-0",
        className,
      )}
    >
      <div
        className={cn(
          "size-9 sm:size-10 shrink-0 rounded-full bg-secondary-100 flex items-center justify-center",
          iconParentClassName,
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
        <h1 className="font-bold text-base sm:text-lg truncate w-full">
          {value}
        </h1>
        <p className="text-xs opacity-60 truncate w-full">{title}</p>
      </div>
    </div>
  );
});

OverviewCard.displayName = "OverviewCard";

const DashboardOverview = () => {
  return (
    <div className="space-y-4">
      <h1 className="font-bold text-secondary-800">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <OverviewCard title="Total Events" value="72" icon={<CalendarIcon />} />
        <OverviewCard title="Total Events" value="72" icon={<CalendarIcon />} />
        <OverviewCard title="Total Events" value="72" icon={<CalendarIcon />} />
        <OverviewCard title="Total Events" value="72" icon={<CalendarIcon />} />
      </div>
    </div>
  );
};

export default memo(DashboardOverview);
