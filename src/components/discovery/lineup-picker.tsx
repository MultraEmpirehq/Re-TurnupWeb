"use client";

import { toast } from "sonner";
import { performerNameKey } from "@/lib/performer-name";
import VerifiedTick from "@/components/discovery/verified-tick";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PERFORMER_TYPE_LABELS, usePerformers } from "@/hooks/use-discovery";
import { IPerformerSummary } from "@/lib/types";
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import PerformerAvatar from "./performer-avatar";
import PerformerFormDialog from "./performer-form-dialog";

/**
 * An event's line-up: search the performers already on Turnupz, add a new one
 * on the spot, and order the bill (the first is the headliner). Saved as the
 * event's performerIds, in this order.
 */
const LineupPicker: React.FC<{
  value: IPerformerSummary[];
  onChange: (lineup: IPerformerSummary[]) => void;
}> = ({ value, onChange }) => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isFetching } = usePerformers(
    { q: search, forLineup: true },
    search.length > 0,
  );
  const chosen = useMemo(() => new Set(value.map((item) => item.id)), [value]);
  // The same performer can't be billed twice, under any spelling.
  const chosenKeys = useMemo(
    () => new Set(value.map((item) => performerNameKey(item.name))),
    [value],
  );
  const searchKey = performerNameKey(search);
  const alreadyBilled = value.find(
    (item) => searchKey && performerNameKey(item.name) === searchKey,
  );
  const results = useMemo(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.performers)
        .filter(
          (performer) =>
            !chosen.has(performer.id) &&
            !chosenKeys.has(performerNameKey(performer.name)),
        )
        .slice(0, 6),
    [chosen, chosenKeys, data],
  );
  // Only offer a new performer when nobody by that name exists yet.
  const nameTaken =
    !!alreadyBilled ||
    results.some((performer) => performerNameKey(performer.name) === searchKey);

  const add = (performer: IPerformerSummary) => {
    if (
      chosen.has(performer.id) ||
      chosenKeys.has(performerNameKey(performer.name))
    ) {
      toast.info(`${performer.name} is already on the line-up.`);
      setSearchInput("");
      setSearch("");
      return;
    }
    onChange([
      ...value,
      {
        id: performer.id,
        name: performer.name,
        type: performer.type,
        image: performer.image,
      },
    ]);
    setSearchInput("");
    setSearch("");
  };

  const move = (index: number, by: -1 | 1) => {
    const next = [...value];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-secondary-950">
          Line-up{" "}
          <span className="font-normal text-secondary-500">(optional)</span>
        </p>
        <p className="text-xs text-secondary-500">
          Who&apos;s performing, speaking or hosting. The first is billed as the
          headliner, and each gets a link to their page.
        </p>
      </div>

      {value.length > 0 && (
        <ol className="space-y-2">
          {value.map((performer, index) => (
            <li
              key={performer.id}
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-black/5"
            >
              <span className="w-5 text-center text-sm font-bold text-secondary-400 tabular-nums">
                {index + 1}
              </span>
              <PerformerAvatar
                name={performer.name}
                image={performer.image}
                className="size-9 text-xs"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-semibold text-secondary-950">
                  <span className="truncate">{performer.name}</span>
                  {performer.isVerified && (
                    <VerifiedTick className="size-3.5" />
                  )}
                </span>
                <span className="block text-xs text-secondary-500">
                  {index === 0 ? "Headliner · " : ""}
                  {PERFORMER_TYPE_LABELS[performer.type] ?? "Performer"}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move ${performer.name} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move ${performer.name} down`}
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${performer.name}`}
                onClick={() =>
                  onChange(value.filter((item) => item.id !== performer.id))
                }
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ol>
      )}

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-secondary-400" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search performers to add"
          aria-label="Search performers to add"
          className="h-11 rounded-xl pl-9"
        />
      </div>

      {search && (
        <div className="overflow-hidden rounded-xl border border-secondary-100 bg-white">
          {results.map((performer) => (
            <button
              key={performer.id}
              type="button"
              onClick={() => add(performer)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-secondary-50"
            >
              <PerformerAvatar
                name={performer.name}
                image={performer.image}
                className="size-8 text-xs"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-secondary-950">
                  {performer.name}
                </span>
                <span className="block text-xs text-secondary-500">
                  {PERFORMER_TYPE_LABELS[performer.type] ?? "Performer"}
                  {performer.country && ` · ${performer.country}`}
                </span>
              </span>
              <Plus className="size-4 text-secondary" aria-hidden />
            </button>
          ))}
          {alreadyBilled ? (
            <p className="px-3 py-2 text-sm text-secondary-500">
              {alreadyBilled.name} is already on the line-up.
            </p>
          ) : (
            !isFetching &&
            results.length === 0 && (
              <p className="px-3 py-2 text-sm text-secondary-500">
                No performer called “{search}” yet.
              </p>
            )
          )}
          {!nameTaken && !isFetching && searchKey && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center gap-2 border-t border-secondary-100 px-3 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary-50"
            >
              <Plus className="size-4" aria-hidden />
              Add “{search}” as a new performer
            </button>
          )}
        </div>
      )}

      <PerformerFormDialog
        open={adding}
        initialName={search}
        onClose={() => setAdding(false)}
        onSaved={(performer) => add(performer)}
      />
    </div>
  );
};

export default memo(LineupPicker);
