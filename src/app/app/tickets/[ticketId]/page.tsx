import { redirect } from "next/navigation";

/** Old ticket links open the ticket in the ledger's side panel. */
export default async function TicketDetailRoute({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  redirect(`/app/tickets?ticket=${encodeURIComponent(ticketId)}`);
}
