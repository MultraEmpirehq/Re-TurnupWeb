"use client";
import { useTicketAnalytics } from "@/hooks/use-ticket-analytics";
import { TicketIcon } from "lucide-react";
import React, { memo, useMemo } from "react";
import DashboardTicketSalesChart from "./dashboard-ticket-sales-chart";

const TicketSalesCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
}> = memo(({ title, value, icon }) => {
  return (
    <div className="p-3 sm:p-4 rounded-lg bg-white shadow border flex flex-col items-start gap-3 sm:gap-4 min-w-0">
      <div className="size-9 sm:size-10 shrink-0 rounded-full bg-secondary-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col items-start gap-1 sm:gap-2 flex-1 min-w-0 w-full">
        <h1 className="font-bold text-base sm:text-lg truncate w-full">
          {value}
        </h1>
        <p className="text-xs opacity-60 truncate w-full">{title}</p>
      </div>
    </div>
  );
});

TicketSalesCard.displayName = "TicketSalesCard";

const DashboardTicketSales = () => {
  const { data: analytics, isLoading } = useTicketAnalytics();

  const totalSalesValue = useMemo(() => {
    if (isLoading) return "—";
    return analytics?.data?.totalSales?.formatted?.withCurrency ?? "—";
  }, [analytics, isLoading]);

  const formatCount = (count: number | undefined) => {
    if (isLoading) return "—";
    return (count ?? 0).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="font-bold text-secondary-800">Ticket Sales</h1>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <TicketSalesCard
          title="Total Sales"
          value={totalSalesValue}
          icon={<TicketIcon />}
        />
        <TicketSalesCard
          title="Total Tickets Sold"
          value={formatCount(analytics?.data?.totalTicketsSold)}
          icon={<TicketIcon />}
        />
        <TicketSalesCard
          title="Total Tickets Remaining"
          value={formatCount(analytics?.data?.totalTicketsRemaining)}
          icon={<TicketIcon />}
        />
        <TicketSalesCard
          title="Total Tickets Created"
          value={formatCount(analytics?.data?.totalTicketsCreated)}
          icon={<TicketIcon />}
        />
      </div>
      <DashboardTicketSalesChart
        data={analytics?.data?.monthlyTicketsSold ?? []}
      />
    </div>
  );
};

export default memo(DashboardTicketSales);
