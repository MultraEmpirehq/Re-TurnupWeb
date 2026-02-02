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
        "p-4 rounded-lg bg-white shadow border flex flex-row items-center gap-4",
        className,
      )}
    >
      <div
        className={cn(
          "size-10 rounded-full bg-secondary-100 flex items-center justify-center",
          iconParentClassName,
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col items-start gap-1 flex-1">
        <h1 className="font-bold text-[clamp(1.1rem,5vw,1.2rem)]">{value}</h1>
        <p className="text-xs opacity-60">{title}</p>
      </div>
    </div>
  );
});

OverviewCard.displayName = "OverviewCard";

const DashboardOverview = () => {
  return (
    <div className="space-y-4">
      <h1 className="font-bold text-secondary-800">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewCard title="Total Events" value="72" icon={<CalendarIcon />} />
        <OverviewCard title="Total Events" value="72" icon={<CalendarIcon />} />
        <OverviewCard title="Total Events" value="72" icon={<CalendarIcon />} />
        <OverviewCard title="Total Events" value="72" icon={<CalendarIcon />} />
      </div>
    </div>
  );
};

export default memo(DashboardOverview);
