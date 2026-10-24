import LedgerPage from "@/components/pages/app/ticket/ledger/ledger-page";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function TicketsPage() {
  return (
    <Suspense>
      <LedgerPage />
    </Suspense>
  );
}
