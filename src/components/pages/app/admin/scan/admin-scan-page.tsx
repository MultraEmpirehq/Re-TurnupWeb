"use client";

import TicketScanner from "@/components/scanning/ticket-scanner";
import BrandLoader from "@/components/ui/brand-loader";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { adminScanTicket } from "@/hooks/use-ticket-scan";
import React, { memo, useCallback } from "react";

/**
 * Door help for any event: the ticket's code says which event it's for, and a
 * multi-day ticket counts for today. Every check-in made here is audit-logged.
 */
const AdminScanPage = () => {
  const { has, isLoading } = useAdminPermissions();
  const onScan = useCallback((code: string) => adminScanTicket(code), []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <BrandLoader />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Scan tickets</h1>
        <p className="text-sm text-muted-foreground">
          Check a ticket in for any event, for example when an organiser&apos;s
          scanner is down. It counts for today on multi-day events, and each
          check-in is recorded in the audit log under your name.
        </p>
      </div>
      {has("TICKETS_SCAN") ? (
        <TicketScanner onScan={onScan} />
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          You need the Scan tickets permission. Ask an admin who manages access.
        </p>
      )}
    </div>
  );
};

export default memo(AdminScanPage);
