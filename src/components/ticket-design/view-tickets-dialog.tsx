"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IEventDetailsType, IUserTicketType } from "@/lib/types";
import React, { memo } from "react";
import TicketCard from "./ticket-card";

interface ViewTicketsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userTickets: IUserTicketType[];
  event?: IEventDetailsType;
}

const ViewTicketsDialog: React.FC<ViewTicketsDialogProps> = ({
  open,
  onOpenChange,
  userTickets,
  event,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Tickets</DialogTitle>
          <DialogDescription>
            {userTickets.length} ticket{userTickets.length !== 1 && "s"} for{" "}
            {event?.name ?? "this event"}. Download each ticket individually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {userTickets.map((ut, i) => (
            <TicketCard
              key={ut.id ?? i}
              userTicket={ut}
              event={event}
              index={i}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ViewTicketsDialog);
