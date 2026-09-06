"use client";

import { Button } from "@/components/ui/button";
import {
  IEventNotification,
  getEventNotifications,
  subscribeToEventNotifications,
} from "@/lib/event-notifications";
import { useVendorNotifications } from "@/hooks/use-vendor-notifications";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { memo, useEffect, useMemo, useState } from "react";

const NotificationsPage = () => {
  const searchParams = useSearchParams();
  const [eventNotifications, setEventNotifications] = useState<
    IEventNotification[]
  >([]);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q")?.trim() ?? "",
  );
  const { data: vendorNotifications = [] } = useVendorNotifications();

  useEffect(() => {
    const syncNotifications = () => setEventNotifications(getEventNotifications());
    syncNotifications();
    return subscribeToEventNotifications(syncNotifications);
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get("q")?.trim() ?? "");
  }, [searchParams]);

  const items = useMemo(
    () =>
      [
        ...vendorNotifications,
        ...eventNotifications.filter(
          (notification) =>
            !vendorNotifications.some((item) => item.id === notification.id),
        ),
      ].map((notification) => ({
        id: notification.id,
        title: notification.title,
        description: notification.description,
        time: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(new Date(notification.createdAt)),
        href: notification.href,
      })),
    [eventNotifications, vendorNotifications],
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      `${item.title} ${item.description} ${item.time}`
        .toLowerCase()
        .includes(query),
    );
  }, [items, searchQuery]);

  return (
    <section className="space-y-10 pb-24">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-secondary-400">
            Vendor Notifications
          </span>
          <h1 className="max-w-3xl text-[clamp(1.8rem,3.4vw,3rem)] font-bold tracking-tight text-secondary-950">
            Stay on top of activity across your vendor account.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-secondary-500 sm:text-base">
            Review ticket movement, event traction, and payout-related updates in one clean
            Turnupz workspace.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
        >
          <Link href="/app">Back to Dashboard</Link>
        </Button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <div className="space-y-6">
          {filteredItems.map((item) => {
            const content = (
              <>
                <div>
                  <h2 className="text-xl font-semibold text-secondary-950">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-secondary-500">
                    {item.description}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-secondary-400">
                  {item.time}
                </span>
              </>
            );

            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-[1.75rem] border border-secondary-100 bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  {content}
                </div>
              </Link>
            ) : (
              <article
              key={item.id}
              className="rounded-[1.75rem] border border-secondary-100 bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                {content}
              </div>
            </article>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="rounded-[1.75rem] border border-dashed border-secondary-200 bg-white p-8 text-center text-sm text-secondary-500">
              No notifications match your search.
            </div>
          )}
        </div>

        <aside className="rounded-[1.75rem] border border-secondary-100 bg-secondary-50 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-bold text-secondary-950">
            Notification tips
          </h2>
          <p className="mt-4 text-sm leading-6 text-secondary-600">
            You&apos;ll be able to control vendor alerts from Settings, including ticket movement,
            attendee activity, and event performance updates.
          </p>
          <Link
            href="/app/settings"
            className="mt-8 inline-flex w-full items-center justify-center rounded-3xl bg-secondary-400 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-secondary-500"
          >
            Manage notification settings
          </Link>
        </aside>
      </div>
    </section>
  );
};

export default memo(NotificationsPage);
