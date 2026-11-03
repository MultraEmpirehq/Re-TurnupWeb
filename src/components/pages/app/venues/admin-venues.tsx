"use client";

import { deleteData, getData, patchData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyContainer from "@/components/ui/empty-container";
import InputField from "@/components/ui/input-field";
import { Skeleton } from "@/components/ui/skeleton";
import TextareaField from "@/components/ui/textarea-field";
import { useVenues } from "@/hooks/use-venue";
import { siteHref } from "@/lib/domains";
import { IVenueDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, ImageOff, MapPin, Plus, Search } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/** Cities Turnupz runs in, before the venues themselves add more. */
const DEFAULT_CITIES = ["Lagos", "Abuja", "Calgary", "Toronto"];

const ADMIN_BASE = ROUTES.ADMIN_OVERVIEW.href;

const place = (venue: IVenueDetailsType) =>
  [
    [venue.city, venue.country].filter(Boolean).join(", "),
    venue.totalAvailableSeat ? `${venue.totalAvailableSeat.toLocaleString()} capacity` : "",
  ]
    .filter(Boolean)
    .join(" · ");

const Count = ({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "warn" }) => (
  <div
    className={cn(
      "rounded-2xl border p-5",
      tone === "warn" ? "border-amber-200 bg-amber-50/60" : "border-secondary-100 bg-white",
    )}
  >
    <p
      className={cn(
        "text-xs font-semibold tracking-wider uppercase",
        tone === "warn" ? "text-amber-700" : "text-muted-foreground",
      )}
    >
      {label}
    </p>
    <p className={cn("mt-2 text-2xl font-bold", tone === "warn" ? "text-amber-800" : "text-secondary-950")}>
      {value}
    </p>
  </div>
);

/** Changing a venue's name, description and capacity. */
const EditVenueDialog = ({ venue, onClose }: { venue: IVenueDetailsType | null; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", description: "", capacity: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (venue) {
      setForm({
        name: venue.name,
        description: venue.description ?? "",
        capacity: venue.totalAvailableSeat ? String(venue.totalAvailableSeat) : "",
      });
    }
  }, [venue]);

  const save = async () => {
    if (!venue) return;
    const capacity = Number(form.capacity);
    if (!form.name.trim() || !Number.isFinite(capacity) || capacity < 1) {
      toast.error("Give the venue a name and a capacity of at least 1.");
      return;
    }
    setSaving(true);
    try {
      await patchData(`/venue/${venue.id}`, {
        name: form.name.trim(),
        description: form.description.trim(),
        totalAvailableSeat: Math.round(capacity),
      });
      await queryClient.invalidateQueries({ queryKey: ["venues"] });
      toast.success("Venue updated");
      onClose();
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't update the venue."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!venue} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="rounded-[1.6rem] p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary-950">Edit venue</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {venue?.address}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <InputField
            label="Name"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <InputField
            label="Capacity"
            required
            inputMode="numeric"
            value={form.capacity}
            onChange={(event) =>
              setForm((current) => ({ ...current, capacity: event.target.value.replace(/[^0-9]/g, "") }))
            }
          />
          <TextareaField
            label="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
        </div>
        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" className="rounded-full" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="rounded-full" loading={saving} onClick={() => void save()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * The venue directory for admins: every venue organisers can pick, with its
 * details, and what's waiting for review. Edit, remove or add venues here.
 */
const AdminVenues = () => {
  const queryClient = useQueryClient();
  const [city, setCity] = useState<string>();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const venuesQuery = useVenues({ q: search || undefined, city });
  const pages = (venuesQuery.data as { pages?: { data?: IVenueDetailsType[]; pagination?: unknown }[] } | undefined)
    ?.pages;
  const venues = useMemo(
    () =>
      (pages ?? [])
        .flatMap((page) => page?.data ?? [])
        .filter((venue) => !venue.id.startsWith("custom-venue-")),
    [pages],
  );
  const total = (pages?.[0]?.pagination as { total?: number } | undefined)?.total ?? venues.length;

  const counts = useQuery({
    queryKey: ["admin-catalogue-counts"],
    queryFn: async () =>
      (await getData<{ venues: number }>("/admin/catalogue-reviews/counts")).data?.data ?? null,
  });
  const waiting = counts.data?.venues ?? 0;

  const cities = useMemo(() => {
    const seen = venues.map((venue) => venue.city).filter((name): name is string => !!name);
    return [...new Set([...DEFAULT_CITIES, ...seen])].slice(0, 10);
  }, [venues]);

  const [editing, setEditing] = useState<IVenueDetailsType | null>(null);
  const [removing, setRemoving] = useState<IVenueDetailsType | null>(null);
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await deleteData(`/venue/${removing.id}`);
      await queryClient.invalidateQueries({ queryKey: ["venues"] });
      toast.success(`${removing.name} removed from the directory`);
      setRemoving(null);
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't remove the venue."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-secondary-800">Venues</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            The directory organisers choose venues from. Venues they type in themselves wait in Submissions until approved.
          </p>
        </div>
        <Button asChild className="rounded-full px-5">
          <Link href={`${ADMIN_BASE}/venues/create`}>
            <Plus className="size-4" aria-hidden />
            Add venue
          </Link>
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Count label="In the directory" value={venuesQuery.isLoading ? "…" : total.toLocaleString()} />
        <Count
          label="Cities"
          value={new Set(venues.map((venue) => venue.city?.toLowerCase()).filter(Boolean)).size}
        />
        <Link href={`${ADMIN_BASE}/events/catalogue`} className="col-span-2 lg:col-span-1">
          <Count
            label="Waiting for review"
            value={
              <span className="flex items-baseline justify-between gap-2">
                {waiting}
                <span className="text-xs font-semibold text-amber-700">Review →</span>
              </span>
            }
            tone={waiting ? "warn" : "default"}
          />
        </Link>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        <label className="relative block sm:w-72">
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

      {venuesQuery.isLoading ? (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-[1.5rem]" />
          ))}
        </section>
      ) : venues.length === 0 ? (
        <EmptyContainer
          icon={<MapPin className="size-6" />}
          title={search || city ? "No venues match" : "No venues yet"}
          description={search || city ? "Try another city or search." : "Add the first venue organisers can pick."}
        />
      ) : (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {venues.map((venue) => (
              <article key={venue.id} className="flex flex-col overflow-hidden rounded-[1.5rem] border border-secondary-100 bg-white">
                <div className="relative h-40 bg-muted">
                  {venue.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={venue.images[0]} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                      <div className="text-center">
                        <ImageOff className="mx-auto size-6" aria-hidden />
                        <p className="mt-1 text-xs font-semibold">No photo yet</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-bold text-secondary-950">{venue.name}</p>
                  <p className="mt-0.5 flex items-start gap-1 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {venue.address}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{place(venue)}</p>
                  {venue.creator && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Added by {[venue.creator.firstName, venue.creator.lastName].filter(Boolean).join(" ") || "an admin"}
                    </p>
                  )}
                  <div className="mt-auto flex gap-2 border-t border-secondary-100 pt-4">
                    <Button variant="outline" className="flex-1 rounded-full border-secondary-100" onClick={() => setEditing(venue)}>
                      Edit
                    </Button>
                    <Button asChild variant="outline" size="icon" className="rounded-full border-secondary-100">
                      <a
                        href={siteHref(`${ROUTES.EXPLORE.href}/venue/${venue.id}`)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View ${venue.name}'s page`}
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      className="rounded-full text-red-600 hover:text-red-700"
                      onClick={() => setRemoving(venue)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </section>
          {venuesQuery.hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="rounded-full"
                loading={venuesQuery.isFetchingNextPage}
                onClick={() => void venuesQuery.fetchNextPage()}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      <EditVenueDialog venue={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.name ?? "this venue"}?`}
        description="It comes out of the directory, so organisers can't pick it. Events already there keep their venue."
        confirmLabel="Remove"
        tone="danger"
        busy={busy}
        onCancel={() => setRemoving(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
};

export default memo(AdminVenues);
