"use client";

import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BadgeCheck,
  Copy,
  Mail,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";
import React, { memo } from "react";
import { toast } from "sonner";

interface IEventOrganiser {
  eventId: string;
  eventName: string;
  organiser: {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    phoneNumber: string | null;
    businessName: string | null;
    displayName: string | null;
    verificationStatus: string | null;
    approvalLevel: string | null;
    eventsCreated: number;
    memberSince: string;
    isAccountDisabled: boolean;
  };
}

export type TOrganiserContactTarget = {
  id: string;
  name: string;
  /** Why it was suspended, if it was, so the email can open with it. */
  suspensionReason?: string | null;
};

const VERIFICATION_LABELS: Record<string, string> = {
  approved: "Verified vendor",
  submitted: "Verification under review",
  needs_more_info: "Verification needs more info",
  rejected: "Verification rejected",
  draft: "Verification not submitted",
};

const copy = async (value: string, what: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${what} copied`);
  } catch {
    toast.error(`Couldn't copy the ${what.toLowerCase()}`);
  }
};

/**
 * Who created an event and every way to reach them, for an admin following up on
 * a suspension or a report. Email opens with the event and any suspension reason
 * filled in; the phone number comes from their vendor verification.
 */
const OrganiserContactDialog: React.FC<{
  target: TOrganiserContactTarget | null;
  onClose: () => void;
}> = ({ target, onClose }) => {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["event-organiser", target?.id],
    queryFn: async () => {
      const { data } = await getData<IEventOrganiser>(
        `/event/${target?.id}/organiser`,
      );
      return data?.data;
    },
    enabled: !!target,
    retry: 0,
  });

  const organiser = data?.organiser;
  const name =
    organiser?.name ||
    organiser?.displayName ||
    organiser?.username ||
    "Organiser";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const mailto = (() => {
    if (!organiser || !target) return "#";
    const subject = `About your event "${target.name}" on Turnupz`;
    const body = [
      `Hi ${organiser.name?.split(" ")[0] || "there"},`,
      "",
      target.suspensionReason
        ? `We've suspended "${target.name}" on Turnupz. The reason: ${target.suspensionReason}`
        : `I'm getting in touch about "${target.name}" on Turnupz.`,
      "",
      "",
      "The Turnupz team",
    ].join("\n");
    return `mailto:${organiser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  })();

  const phoneDigits = organiser?.phoneNumber?.replace(/[^\d]/g, "") ?? "";
  const verification = organiser?.verificationStatus
    ? (VERIFICATION_LABELS[organiser.verificationStatus] ??
      organiser.verificationStatus)
    : "No vendor verification";

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-[1.6rem] border-secondary-100 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary-950">
            Contact the organiser
          </DialogTitle>
          <DialogDescription className="text-sm text-secondary-500">
            {target
              ? `Who created "${target.name}" and how to reach them.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        )}

        {!!error && !isLoading && (
          <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <p>
              {constructErrorMessage(
                error as TApiErrorResponseType,
                "Couldn't load the organiser's details.",
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              Try again
            </Button>
          </div>
        )}

        {organiser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[#f7f9fc] p-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-secondary to-primary text-sm font-bold text-white">
                {initials || <UserRound className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-secondary-950">
                  {name}
                </p>
                {organiser.businessName && (
                  <p className="truncate text-sm text-secondary-950/60">
                    {organiser.businessName}
                  </p>
                )}
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-secondary-950/50">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      organiser.verificationStatus === "approved" &&
                        "text-emerald-700",
                    )}
                  >
                    {organiser.verificationStatus === "approved" && (
                      <BadgeCheck className="size-3.5" aria-hidden />
                    )}
                    {verification}
                  </span>
                  <span aria-hidden>·</span>
                  <span>
                    {organiser.eventsCreated} event
                    {organiser.eventsCreated === 1 ? "" : "s"}
                  </span>
                  <span aria-hidden>·</span>
                  <span>
                    Since {format(new Date(organiser.memberSince), "MMM yyyy")}
                  </span>
                </p>
              </div>
            </div>

            {organiser.isAccountDisabled && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This account is disabled, so they can&apos;t sign in to see
                notifications. Email is the way to reach them.
              </p>
            )}

            <div className="flex items-center gap-2 rounded-xl border border-secondary-100 p-2 pl-3">
              <Mail
                className="size-4 shrink-0 text-secondary-400"
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm text-secondary-950">
                {organiser.email}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label="Copy email"
                onClick={() => void copy(organiser.email, "Email")}
              >
                <Copy className="size-4" />
              </Button>
            </div>

            {organiser.phoneNumber ? (
              <div className="flex items-center gap-2 rounded-xl border border-secondary-100 p-2 pl-3">
                <Phone
                  className="size-4 shrink-0 text-secondary-400"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-sm text-secondary-950">
                  {organiser.phoneNumber}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="Copy phone number"
                  onClick={() =>
                    void copy(organiser.phoneNumber!, "Phone number")
                  }
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-secondary-950/50">
                No phone number on file: they haven&apos;t added one through
                vendor verification yet.
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                asChild
                className="h-11 rounded-xl bg-secondary-950 text-white hover:bg-secondary-900 sm:col-span-3"
              >
                <a href={mailto}>
                  <Mail className="size-4" />
                  Email about this event
                </a>
              </Button>
              {organiser.phoneNumber && (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-secondary-200 sm:col-span-1"
                  >
                    <a href={`tel:${organiser.phoneNumber}`}>
                      <Phone className="size-4" />
                      Call
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 sm:col-span-2"
                  >
                    <a
                      href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(
                        `Hi, it's the Turnupz team, about your event "${target?.name}".`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-4" />
                      WhatsApp
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default memo(OrganiserContactDialog);
