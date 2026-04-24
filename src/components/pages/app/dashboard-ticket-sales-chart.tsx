"use client";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { IMonthlyTicketsSold } from "@/lib/types";
import React, { memo, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  sales: {
    label: "Ticket Sold",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const DashboardTicketChart: React.FC<{ data?: IMonthlyTicketsSold[] }> = ({
  data = [],
}) => {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        month: item.label,
        sales: item.count,
      })),
    [data],
  );

  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <Bar dataKey="sales" fill="#024C6B" radius={4} />
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" />
          <YAxis dataKey="sales" />
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default memo(DashboardTicketChart);
