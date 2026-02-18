import { TicketIcon } from "lucide-react";
import React, { memo } from "react";
import DashboardTicketSalesChart from "./dashboard-ticket-sales-chart";

const TicketSalesCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
}> = memo(({ title, value, icon }) => {
  return (
    <div className="p-4 rounded-lg bg-white shadow border flex flex-col items-start gap-4">
      <div className="size-10 rounded-full bg-secondary-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col items-start gap-2 flex-1">
        <h1 className="font-bold text-[clamp(1.1rem,5vw,1.2rem)]">{value}</h1>
        <p className="text-xs opacity-60">{title}</p>
      </div>
    </div>
  );
});

TicketSalesCard.displayName = "TicketSalesCard";

const DashboardTicketSales = () => {
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="font-bold text-secondary-800">Ticket Sales</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TicketSalesCard
          title="Total Sales"
          value="100"
          icon={<TicketIcon />}
        />
        <TicketSalesCard
          title="Total Tickets Sold"
          value="100"
          icon={<TicketIcon />}
        />
        <TicketSalesCard
          title="Total Tickets Remaining"
          value="100"
          icon={<TicketIcon />}
        />
        <TicketSalesCard
          title="Total Tickets Created"
          value="100"
          icon={<TicketIcon />}
        />
      </div>
      <DashboardTicketSalesChart />
    </div>
  );
};

export default memo(DashboardTicketSales);
