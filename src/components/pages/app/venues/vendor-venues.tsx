"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  mapsLink,
  useVendorVenues,
  useWithdrawVenueSuggestion,
  VendorVenue,
  VenueSuggestion,
} from "@/hooks/use-vendor-venues";
import { useVenues } from "@/hooks/use-venue";
import { IVenueDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { format } from "date-fns";
import { ImageOff, MapPin, MoreHorizontal, Plus, Search } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import VenueSuggestionDialog from "./venue-suggestion-dialog";

/** Cities organisers hold events in, before their own venues add more. */
const DEFAULT_CITIES = ["Lagos", "Abuja", "Calgary", "Toronto"];

/** "Lagos, Nigeria · 5,000 capacity", leaving out whatever isn't known. */
const place = (city?: string | null, country?: string | null, capacity?: number | null) =>
  [
    [city, country].filter(Boolean).join(", "),
    capacity ? `${capacity.toLocaleString()} capacity` : "",
  ]
    .filter(Boolean)
    .join(" · ");

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const Count = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warn" | "bad";
}) => (
  <div
    className={cn(
      "rounded-2xl border p-5",
      tone === "default" && "border-secondary-100 bg-white",
      tone === "warn" && "border-amber-200 bg-amber-50/60",
      tone === "bad" && "border-red-200 bg-red-50/60",
    )}
  >
    <p
      className={cn(
        "text-xs font-semibold tracking-wider uppercase",
        tone === "default" && "text-muted-foreground",
        tone === "warn" && "text-amber-700",
        tone === "bad" && "text-red-700",
      )}
    >
      {label}
    </p>
    <p
      className={cn(
        "mt-2 text-2xl font-bold",
        tone === "default" && "text-secondary-950",
        tone === "warn" && "text-amber-800",
        tone === "bad" && "text-red-800",
      )}
    >
      {value}
    </p>
  </div>
);

const Pill = ({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "grey" | "amber" }) => (
  <span
    className={cn(
      "rounded-full px-2.5 py-1 text-xs font-semibold",
      tone === "blue" && "bg-secondary-50 text-secondary-700",
      tone === "grey" && "bg-muted text-muted-foreground",
      tone === "amber" && "bg-amber-50 text-amber-800",
    )}
  >
    {children}
  </span>
);

const STATUS = {
  live: { label: "In the directory", className: "text-emerald-700", dot: true },
  pending: { label: "In review", className: "text-amber-700", dot: false },
  rejected: { label: "Needs changes", className: "text-red-700", dot: false },
};

/** The photo on top, or a plain placeholder when there isn't one. */
const Photo = ({ image, status }: { image: string | null; status: keyof typeof STATUS }) => {
  const badge = STATUS[status];
  return (
    <div className="relative h-40 bg-muted">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-muted-foreground">
          <div className="text-center">
            <ImageOff className="mx-auto size-6" aria-hidden />
            <p className="mt-1 text-xs font-semibold">No photo yet</p>
          </div>
        </div>
      )}
      <span
        className={cn(
          "absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold",
          badge.className,
        )}
      >
        {badge.dot && <span className="size-1.5 rounded-full bg-emerald-500" />}
        {badge.label}
      </span>
    </div>
  );
};

const Card = ({
  border = "border-secondary-100",
  children,
}: {
  border?: string;
  children: React.ReactNode;
}) => (
  <div className={cn("flex flex-col overflow-hidden rounded-[1.5rem] border bg-white", border)}>
    {children}
  </div>
);

const createEventWith = (venueId: string) => `${ROUTES.CREATE_EVENT.href}?venueId=${venueId}`;

const VenueCard = ({ venue }: { venue: VendorVenue }) => (
  <Card>
    <Photo image={venue.image} status="live" />
    <div className="flex flex-1 flex-col p-5">
      <p className="font-bold text-secondary-950">{venue.name}</p>
      <p className="mt-0.5 flex items-start gap-1 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {venue.address}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {place(venue.city, venue.country, venue.capacity)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {venue.upcomingEvents ? (
          <Pill>{plural(venue.upcomingEvents, "upcoming event")}</Pill>
        ) : (
          <Pill tone="grey">No upcoming events</Pill>
        )}
        {venue.pastEvents > 0 && <Pill tone="grey">{venue.pastEvents} past</Pill>}
      </div>
      <div className="mt-auto flex gap-2 border-t border-secondary-100 pt-4">
        <Button asChild className="flex-1 rounded-full">
          <Link href={createEventWith(venue.id)}>Use for an event</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full border-secondary-100">
          <a href={mapsLink(venue)} target="_blank" rel="noreferrer">
            Map
          </a>
        </Button>
      </div>
    </div>
  </Card>
);

const SuggestionCard = ({
  suggestion,
  onFix,
  onWithdraw,
}: {
  suggestion: VenueSuggestion;
  onFix: () => void;
  onWithdraw: () => void;
}) => {
  const rejected = suggestion.status === "rejected";
  return (
    <Card border={rejected ? "border-red-200" : "border-amber-200"}>
      <Photo image={null} status={suggestion.status} />
      <div className="flex flex-1 flex-col p-5">
        <p className="font-bold text-secondary-950">{suggestion.name}</p>
        {suggestion.address && (
          <p className="mt-0.5 flex items-start gap-1 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {suggestion.address}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {[suggestion.city, suggestion.country].filter(Boolean).join(", ")}
          {` · Added by you on ${format(new Date(suggestion.createdAt), "d MMM")}`}
        </p>
        {rejected ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
            <b>Admin note:</b> {suggestion.reviewNote || "Please check the details and send it again."}
          </p>
        ) : (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            {suggestion.event
              ? "Your event shows this venue already. It joins the directory once approved."
              : "It joins the directory once approved."}
          </p>
        )}
        {suggestion.event && (
          <div className="mt-3">
            <Pill tone="amber">Used on {suggestion.event.name}</Pill>
          </div>
        )}
        <div className="mt-auto flex gap-2 border-t border-secondary-100 pt-4">
          <Button
            variant={rejected ? "default" : "outline"}
            className={cn("flex-1 rounded-full", !rejected && "border-secondary-100")}
            onClick={onFix}
          >
            {rejected ? "Fix and resend" : "Edit details"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-secondary-100"
                aria-label={`More for ${suggestion.name}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={mapsLink(suggestion)} target="_blank" rel="noreferrer">
                  Open in Maps
                </a>
              </DropdownMenuItem>
              {!suggestion.event && (
                <DropdownMenuItem className="text-red-600" onSelect={onWithdraw}>
                  Withdraw suggestion
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

/** A directory venue, when browsing them all. */
const DirectoryCard = ({ venue }: { venue: IVenueDetailsType }) => (
  <Card>
    <Photo image={venue.images?.[0] ?? null} status="live" />
    <div className="flex flex-1 flex-col p-5">
      <p className="font-bold text-secondary-950">{venue.name}</p>
      <p className="mt-0.5 flex items-start gap-1 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {venue.address}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {place(venue.city, venue.country, venue.totalAvailableSeat)}
      </p>
      <div className="mt-auto flex gap-2 pt-4">
        <Button asChild className="flex-1 rounded-full">
          <Link href={createEventWith(venue.id)}>Use for an event</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full border-secondary-100">
          <a href={mapsLink(venue)} target="_blank" rel="noreferrer">
            Map
          </a>
        </Button>
      </div>
    </div>
  </Card>
);

const matches = (text: string, values: (string | null | undefined)[]) =>
  !text || values.some((value) => value?.toLowerCase().includes(text.toLowerCase()));

/**
 * An organiser's venues: the directory venues their events use, the ones they
 * suggested, and the whole directory to pick from.
 */
const VendorVenues = () => {
  const { data, isLoading, error, refetch } = useVendorVenues();
  const [tab, setTab] = useState<"mine" | "directory">("mine");
  const [city, setCity] = useState<string>();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [suggesting, setSuggesting] = useState(false);
  const [fixing, setFixing] = useState<VenueSuggestion | null>(null);
  const [withdrawing, setWithdrawing] = useState<VenueSuggestion | null>(null);
  const withdraw = useWithdrawVenueSuggestion();

  const directory = useVenues({ q: search || undefined, city }, tab === "directory");
  const directoryVenues = useMemo(
    () =>
      ((directory.data as { pages?: { data?: IVenueDetailsType[] }[] } | undefined)?.pages ?? [])
        .flatMap((page) => page?.data ?? [])
        // Venues typed on this device but not saved aren't in the directory.
        .filter((venue) => !venue.id.startsWith("custom-venue-")),
    [directory.data],
  );

  const cities = useMemo(() => {
    const own = (data?.venues ?? []).map((venue) => venue.city).filter(Boolean);
    return [...new Set([...DEFAULT_CITIES, ...own])];
  }, [data]);

  const inCity = (value?: string | null) => !city || value?.toLowerCase() === city.toLowerCase();
  const myVenues = (data?.venues ?? []).filter(
    (venue) => inCity(venue.city) && matches(search, [venue.name, venue.address, venue.city]),
  );
  const mySuggestions = (data?.suggestions ?? []).filter(
    (s) => inCity(s.city) && matches(search, [s.name, s.address, s.city]),
  );
  const counts = data?.counts;
  const yours = (counts?.venuesUsed ?? 0) + (data?.suggestions.length ?? 0);

  const handleWithdraw = async () => {
    if (!withdrawing) return;
    try {
      await withdraw.mutateAsync(withdrawing.id);
      toast.success(`${withdrawing.name} withdrawn.`);
      setWithdrawing(null);
    } catch (withdrawError) {
      toast.error(
        constructErrorMessage(withdrawError as TApiErrorResponseType, "Couldn't withdraw it."),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-secondary-950">Venues</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            The places you hold events. Pick one from the directory, or suggest a new one and use it
            straight away.
          </p>
        </div>
        <Button className="rounded-full px-5" onClick={() => setSuggesting(true)}>
          <Plus className="size-4" aria-hidden />
          Suggest a venue
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "Couldn't load your venues.")}
          retryFunction={refetch}
        />
      ) : (
        counts && (
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Count label="Venues you've used" value={counts.venuesUsed} />
            <Count label="Upcoming events at them" value={counts.upcomingEvents} />
            <Count label="Waiting for review" value={counts.waitingForReview} tone="warn" />
            <Count label="Need changes" value={counts.needChanges} tone="bad" />
          </section>
        )
      )}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div
          role="tablist"
          aria-label="Venues"
          className="flex w-fit rounded-full border border-secondary-100 bg-white p-1 text-sm font-semibold"
        >
          {(
            [
              ["mine", `Your venues · ${yours}`],
              ["directory", "Browse the directory"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "rounded-full px-4 py-1.5 transition-colors",
                tab === id ? "bg-secondary-950 text-white" : "text-muted-foreground hover:text-secondary-800",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            {[undefined, ...cities].map((name) => (
              <button
                key={name ?? "all"}
                type="button"
                aria-pressed={city === name}
                onClick={() => setCity(name)}
                className={cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  city === name
                    ? "bg-secondary-50 text-secondary-700"
                    : "border border-secondary-100 bg-white text-muted-foreground hover:text-secondary-800",
                )}
              >
                {name ?? "All cities"}
              </button>
            ))}
          </div>
          <label className="relative block sm:w-64">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search venues"
              aria-label="Search venues"
              className="h-10 w-full rounded-full border border-secondary-100 bg-white pr-4 pl-10 text-sm outline-none focus:border-secondary-300"
            />
          </label>
        </div>
      </div>

      {tab === "mine" ? (
        !isLoading &&
        !error &&
        (myVenues.length + mySuggestions.length === 0 ? (
          <EmptyContainer
            icon={<MapPin className="size-6" />}
            title={search || city ? "No venues match" : "No venues yet"}
            description={
              search || city
                ? "Try another city or search."
                : "Venues show here once your events use them. Browse the directory, or suggest one."
            }
          />
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {myVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
            {mySuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onFix={() => setFixing(suggestion)}
                onWithdraw={() => setWithdrawing(suggestion)}
              />
            ))}
          </section>
        ))
      ) : directory.isLoading ? (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-[1.5rem]" />
          ))}
        </section>
      ) : directoryVenues.length === 0 ? (
        <EmptyContainer
          icon={<MapPin className="size-6" />}
          title="No venues found"
          description="Can't find it? Suggest it and use it on your event straight away."
        />
      ) : (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {directoryVenues.map((venue) => (
              <DirectoryCard key={venue.id} venue={venue} />
            ))}
          </section>
          {directory.hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="rounded-full"
                loading={directory.isFetchingNextPage}
                onClick={() => void directory.fetchNextPage()}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      <VenueSuggestionDialog
        open={suggesting || !!fixing}
        suggestion={fixing}
        onClose={() => {
          setSuggesting(false);
          setFixing(null);
        }}
      />
      <ConfirmDialog
        open={!!withdrawing}
        title={`Withdraw ${withdrawing?.name ?? "this venue"}?`}
        description="It won't be reviewed or added to the directory."
        confirmLabel="Withdraw"
        tone="danger"
        busy={withdraw.isPending}
        onCancel={() => setWithdrawing(null)}
        onConfirm={() => void handleWithdraw()}
      />
    </div>
  );
};

export default memo(VendorVenues);
