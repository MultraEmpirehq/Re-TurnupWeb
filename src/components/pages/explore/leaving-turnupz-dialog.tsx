"use client";

import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const POINTS = [
  "You'll pay on their website, not on Turnupz.",
  "Turnupz Credit and your saved cards can't be used there.",
  "For refunds or problems with your ticket, contact the seller.",
];

/**
 * Shown before an event's outside ticket link opens, so people know they're
 * leaving Turnupz and who they're buying from. Matches the app's sheet.
 */
export default function LeavingTurnupzDialog({
  open,
  host,
  eventName,
  onContinue,
  onClose,
}: {
  open: boolean;
  /** e.g. "tix.example.com"; null when the link isn't a proper web address. */
  host: string | null;
  eventName?: string;
  onContinue: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#E5F7FF]">
          <ExternalLink className="size-5 text-[#0577FA]" />
        </div>
        <DialogTitle className="mt-1 text-xl font-extrabold">
          You&apos;re leaving Turnupz
        </DialogTitle>
        <DialogDescription className="text-sm text-zinc-600">
          {eventName
            ? `Tickets for ${eventName} are sold on `
            : "These tickets are sold on "}
          <span className="font-bold text-zinc-950">
            {host ?? "another website"}
          </span>
          .
        </DialogDescription>
        <ul className="mt-1 space-y-2 rounded-2xl bg-[#F7F8FB] p-4 text-[13px] text-zinc-700">
          {POINTS.map((point) => (
            <li key={point} className="flex gap-2.5">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#0577FA]" />
              {point}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onContinue}
          disabled={!host}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-[#0B1D2A] text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:bg-secondary-300"
        >
          {host ? `Continue to ${host}` : "This link doesn't work"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-10 w-full text-sm font-bold text-[#0577FA]"
        >
          Stay on Turnupz
        </button>
      </DialogContent>
    </Dialog>
  );
}
