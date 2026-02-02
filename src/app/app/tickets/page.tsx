import TicketList from "@/components/pages/app/ticket/ticket-list";
import TicketSearch from "@/components/pages/app/ticket/ticket-search";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const TicketPage = () => {
  return (
    <div className="space-y-10">
      <TicketSearch />
      <TicketList />
    </div>
  );
};

export default memo(TicketPage);
