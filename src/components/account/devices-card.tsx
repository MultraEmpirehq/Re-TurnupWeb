"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions, useSignOutDevice } from "@/hooks/use-account";
import { formatDistanceToNow } from "date-fns";
import { Laptop, Smartphone } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "sonner";

/** Where the account is signed in, with a way to sign out any other device. */
const DevicesCard = () => {
  const { data: sessions = [], isLoading, error } = useSessions();
  const signOut = useSignOutDevice();
  const [pendingId, setPendingId] = useState<string | "all" | null>(null);
  const others = sessions.filter((session) => !session.isCurrent);
  // This device first, then the rest as they come (most recently active).
  const ordered = [
    ...sessions.filter((session) => session.isCurrent),
    ...others,
  ];

  const handleSignOut = async (sessionId?: string) => {
    setPendingId(sessionId ?? "all");
    try {
      await signOut.mutateAsync(sessionId);
      toast.success(
        sessionId
          ? "That device is signed out."
          : "Every other device is signed out.",
      );
    } catch (signOutError) {
      toast.error(
        constructErrorMessage(
          signOutError as TApiErrorResponseType,
          "Couldn't sign that device out.",
        ),
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-[1.5rem] border border-secondary-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-secondary-950">
            Signed-in devices
          </h2>
          <p className="text-sm text-secondary-500">
            Don&apos;t recognise one? Sign it out, then change your password.
          </p>
        </div>
        {others.length > 1 && (
          <Button
            variant="outline"
            className="rounded-xl"
            loading={pendingId === "all"}
            disabled={!!pendingId}
            onClick={() => void handleSignOut()}
          >
            Sign out all others
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : error ? (
        <p className="text-sm text-secondary-500">
          We couldn&apos;t load your devices just now.
        </p>
      ) : (
        // About five devices show; more scroll inside the card, so a long list
        // doesn't stretch the page.
        <ul className="max-h-[20.5rem] divide-y divide-secondary-100 overflow-y-auto overscroll-contain rounded-2xl border border-secondary-100">
          {ordered.map((session) => {
            const Icon = session.platform === "app" ? Smartphone : Laptop;
            return (
              <li
                key={session.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Icon
                  className="size-5 shrink-0 text-secondary-400"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-secondary-950">
                    {session.device ||
                      (session.platform === "app"
                        ? "Turnupz app"
                        : "Web browser")}
                    {session.isCurrent && (
                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-secondary-500">
                    {session.ip && `${session.ip} · `}
                    Active{" "}
                    {formatDistanceToNow(new Date(session.lastSeenAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    loading={pendingId === session.id}
                    disabled={!!pendingId}
                    onClick={() => void handleSignOut(session.id)}
                  >
                    Sign out
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!isLoading && !error && sessions.length > 5 && (
        <p className="text-xs text-secondary-500">
          Signed in on {sessions.length} devices. Scroll the list to see them all.
        </p>
      )}
    </section>
  );
};

export default memo(DevicesCard);
