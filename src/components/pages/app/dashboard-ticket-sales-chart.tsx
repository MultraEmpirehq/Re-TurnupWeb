"use client";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import React, { memo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "January", sales: 186 },
  { month: "February", sales: 305 },
  { month: "March", sales: 237 },
  { month: "April", sales: 73 },
  { month: "May", sales: 209 },
  { month: "June", sales: 214 },
];

const chartConfig = {
  sales: {
    label: "Ticket Sold",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const DashboardTicketChart = () => {
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
