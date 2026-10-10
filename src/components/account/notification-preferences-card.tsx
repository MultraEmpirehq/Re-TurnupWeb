"use client";

import { constructErrorMessage } from "@/api/functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  TNotificationPreferences,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-account";
import { Bell } from "lucide-react";
import React, { memo } from "react";
import { toast } from "sonner";

const CHANNELS: {
  key: keyof TNotificationPreferences;
  title: string;
  description: string;
}[] = [
  {
    key: "push",
    title: "Push notifications",
    description: "On your phone, from the Turnupz app.",
  },
  {
    key: "email",
    title: "Email",
    description: "To the address on your account.",
  },
];

const TOPICS: {
  key: keyof TNotificationPreferences;
  title: string;
  description: string;
}[] = [
  {
    key: "eventUpdates",
    title: "Event updates",
    description:
      "Changes, announcements and new posts for events you're going to or follow.",
  },
  {
    key: "orderUpdates",
    title: "Orders and payments",
    description: "Receipts, refunds and anything that needs a look.",
  },
  {
    key: "ticketTransfers",
    title: "Ticket transfers",
    description: "When someone sends you a ticket, or accepts one you sent.",
  },
];

/**
 * Notification settings, saved as you flip them. In-app notifications always
 * stay on; these decide what also reaches your phone and inbox.
 */
const NotificationPreferencesCard = () => {
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  const toggle = async (
    key: keyof TNotificationPreferences,
    value: boolean,
  ) => {
    try {
      await update.mutateAsync({ [key]: value });
    } catch (saveError) {
      toast.error(
        constructErrorMessage(
          saveError as TApiErrorResponseType,
          "Couldn't save that setting.",
        ),
      );
    }
  };

  const row = (item: (typeof CHANNELS)[number]) => (
    <label
      key={item.key}
      className="flex items-center justify-between gap-4 rounded-2xl border border-secondary-100 bg-secondary-50/60 px-4 py-3"
    >
      <span>
        <span className="block font-semibold text-secondary-950">
          {item.title}
        </span>
        <span className="block text-sm text-secondary-500">
          {item.description}
        </span>
      </span>
      <Switch
        checked={preferences?.[item.key] ?? true}
        onCheckedChange={(value) => void toggle(item.key, value)}
        aria-label={item.title}
      />
    </label>
  );

  return (
    <section className="space-y-4 rounded-[1.5rem] border border-secondary-100 bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-secondary-50 p-2.5 text-secondary">
          <Bell className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-secondary-950">
            Notifications
          </h2>
          <p className="text-sm text-secondary-500">
            You&apos;ll always see notifications in the app. Choose what else
            reaches you.
          </p>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-secondary-500">
          We couldn&apos;t load your notification settings just now.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-secondary-400 uppercase">
              How
            </p>
            {CHANNELS.map(row)}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-secondary-400 uppercase">
              About
            </p>
            {TOPICS.map(row)}
          </div>
        </div>
      )}
    </section>
  );
};

export default memo(NotificationPreferencesCard);
