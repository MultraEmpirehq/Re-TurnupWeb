"use client";

import { getData } from "@/api";
import { Input } from "@/components/ui/input";
import ChoiceCard from "@/components/ui/choice-card";
import StatusBadge from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, Loader2, Search, UserRound } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

export type TEventHost = {
  id: string;
  name: string;
  email: string;
  canSell: boolean;
  payoutsReady: boolean;
  restricted: boolean;
};

type THostList = {
  turnupz: { id: "turnupz"; name: string } | null;
  organisers: TEventHost[];
};

/** What the create form keeps about the host, so a refresh shows the same pick. */
export interface IHostFormValues {
  /** 'turnupz', or the organiser's user id. Admins only. */
  hostId?: string;
  hostName?: string;
  hostSells?: boolean;
}

const useEventHosts = (search: string) =>
  useQuery({
    queryKey: ["admin-event-hosts", search],
    queryFn: async () => {
      const { data } = await getData<THostList>(
        `/admin/event-hosts${search ? `?q=${encodeURIComponent(search)}` : ""}`,
      );
      return data?.data ?? { turnupz: null, organisers: [] };
    },
    staleTime: 30_000,
  });

const HostBadges = ({ host }: { host: TEventHost }) => (
  <span className="flex flex-wrap gap-1">
    <StatusBadge tone={host.canSell ? "success" : "neutral"}>
      {host.canSell ? "Sells tickets" : "Free events only"}
    </StatusBadge>
    {host.canSell && (
      <StatusBadge tone={host.payoutsReady ? "success" : "warning"}>
        {host.payoutsReady ? "Payouts ready" : "Payouts not set up"}
      </StatusBadge>
    )}
    {host.restricted && <StatusBadge tone="danger">Restricted</StatusBadge>}
  </span>
);

/**
 * "Who's hosting?" for an admin creating an event: Turnupz itself (live when
 * published, sales paid to Turnupz) or an organiser (a draft in their events
 * for them to check and publish). Fixed once the draft is first saved.
 */
const HostPicker = ({ locked }: { locked: boolean }) => {
  const { watch, setValue, getValues } = useFormContext<IHostFormValues & { organizerName: string }>();
  const hostId = watch("hostId");
  const hostName = watch("hostName");
  const [mode, setMode] = useState<"turnupz" | "organiser">(
    hostId && hostId !== "turnupz" ? "organiser" : "turnupz",
  );
  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(typed.trim()), 300);
    return () => clearTimeout(timer);
  }, [typed]);
  const { data, isFetching } = useEventHosts(search);

  const pick = (id: string, name: string, sells: boolean) => {
    const previous = getValues("hostName");
    setValue("hostId", id, { shouldDirty: true });
    setValue("hostName", name);
    setValue("hostSells", sells);
    // The organiser name follows the host, unless someone typed their own.
    const current = getValues("organizerName");
    if (!current || current === previous) {
      setValue("organizerName", name, { shouldValidate: true });
    }
  };

  // Turnupz is the default pick for a new event.
  useEffect(() => {
    if (!locked && !getValues("hostId") && data?.turnupz) {
      pick("turnupz", data.turnupz.name, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.turnupz, locked]);

  if (locked) {
    return (
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3 text-sm">
        {hostId === "turnupz" ? (
          <Building2 className="size-4 text-primary" aria-hidden />
        ) : (
          <UserRound className="size-4 text-primary" aria-hidden />
        )}
        <p className="text-foreground">
          Hosted by <span className="font-semibold">{hostName || "the organiser"}</span>
        </p>
        <p className="text-muted-foreground">
          {hostId === "turnupz"
            ? "Goes live when you publish."
            : "Saved as a draft for them to publish."}
        </p>
      </section>
    );
  }

  const organiserPicked = mode === "organiser" && hostId && hostId !== "turnupz";

  return (
    <section aria-labelledby="host-title" className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div>
        <h2 id="host-title" className="text-sm font-semibold text-foreground">
          Who&apos;s hosting?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The host owns the event, its group chat and its sales. This can&apos;t change once the draft is saved.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="host-title">
        {[
          {
            key: "turnupz" as const,
            icon: Building2,
            title: data?.turnupz?.name ?? "Turnupz",
            body: "Live when you publish. Sales are paid to the Turnupz account.",
          },
          {
            key: "organiser" as const,
            icon: UserRound,
            title: "An organiser",
            body: "Saved as a draft in their events. They check it and publish.",
          },
        ].map((option) => (
          <ChoiceCard
            key={option.key}
            selected={mode === option.key}
            icon={option.icon}
            title={option.title}
            description={option.body}
            disabled={option.key === "turnupz" && !data?.turnupz && !isFetching}
            onSelect={() => {
              setMode(option.key);
              if (option.key === "turnupz" && data?.turnupz) {
                pick("turnupz", data.turnupz.name, true);
              } else if (option.key === "organiser" && hostId === "turnupz") {
                setValue("hostId", "");
              }
            }}
          />
        ))}
      </div>

      {mode === "organiser" && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder="Search organisers by name or email"
              aria-label="Search organisers"
              className="h-11 rounded-xl pl-9"
            />
            {isFetching && (
              <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
            )}
          </div>
          <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-xl border border-border" data-lenis-prevent>
            {(data?.organisers ?? []).map((host) => {
              const active = hostId === host.id;
              return (
                <li key={host.id}>
                  <button
                    type="button"
                    onClick={() => pick(host.id, host.name, host.canSell)}
                    disabled={host.restricted}
                    className={cn(
                      "flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      active ? "bg-info-soft" : "hover:bg-muted",
                    )}
                  >
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{host.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{host.email}</span>
                      <HostBadges host={host} />
                    </span>
                    {active && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                  </button>
                </li>
              );
            })}
            {!isFetching && !data?.organisers?.length && (
              <li className="px-3.5 py-6 text-center text-sm text-muted-foreground">
                {search ? `No organisers match "${search}".` : "No organisers yet."}
              </li>
            )}
          </ul>
          {organiserPicked && (
            <p className="text-sm text-muted-foreground">
              {getValues("hostSells")
                ? `Saved as a draft for ${hostName}. They're told, check it and publish; you'll hear if they remove it.`
                : `${hostName} hosts free events only, so paid tickets won't go on sale until they finish verification.`}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default memo(HostPicker);
