"use client";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/variables";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

export default function TransferTicketPage() {
  const params = useParams();
  const ticketId = params?.id?.toString() ?? "";

  return (
    <div className="space-y-6">
      <Link
        href={ROUTES.PROFILE_TICKETS.href}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to My Tickets
      </Link>
      <div>
        <h2 className="text-lg font-semibold">Transfer Ticket</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Transfer flow for ticket{" "}
          <span className="font-mono text-foreground">{ticketId}</span>. You can
          add a form here to send this ticket to another person by email.
        </p>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        <p className="text-sm">
          Transfer form and API integration can be added here.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={ROUTES.PROFILE_TICKETS.href}>Back to tickets</Link>
        </Button>
      </div>
    </div>
  );
}
