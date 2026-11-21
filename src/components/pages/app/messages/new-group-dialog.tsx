"use client";

import { constructErrorMessage } from "@/api/functions";
import { uploadAttachment } from "@/api/attachments";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateGroup } from "@/hooks/use-group-chats";
import { IPersonCard, usePeopleConnections } from "@/hooks/use-profile";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import { Camera, Check, Search } from "lucide-react";
import React, { memo, useMemo, useRef, useState } from "react";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

export const PersonDot: React.FC<{ person: Pick<IPersonCard, "name" | "image">; size?: string }> = ({
  person,
  size = "size-10",
}) =>
  person.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.image} alt="" className={cn(size, "shrink-0 rounded-full object-cover")} />
  ) : (
    <span
      className={cn(
        size,
        "flex shrink-0 items-center justify-center rounded-full bg-secondary-100 text-xs font-bold text-secondary-700",
      )}
    >
      {initialsOf(person.name)}
    </span>
  );

/**
 * People you follow who follow you back: the ones a group can add straight
 * away. Everyone else joins with the invite link.
 */
export const useMutualFollows = (exclude: string[] = []) => {
  const username = useUserStore((state) => state.userDetails?.username);
  const { data = [], isLoading } = usePeopleConnections(username, "following");
  const people = useMemo(
    () => data.filter((person) => person.followsYou && !exclude.includes(person.id)),
    [data, exclude],
  );
  return { people, isLoading, hasUsername: !!username };
};

export const PeoplePicker: React.FC<{
  people: IPersonCard[];
  loading: boolean;
  chosen: string[];
  onToggle: (id: string) => void;
}> = ({ people, loading, chosen, onToggle }) => {
  const [query, setQuery] = useState("");
  const shown = people.filter((person) =>
    `${person.name} ${person.username ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people you follow each other with"
          aria-label="Search people"
          className="pl-9"
        />
      </div>
      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {loading && <li className="px-1 py-2 text-sm text-muted-foreground">Loading…</li>}
        {!loading && shown.length === 0 && (
          <li className="px-1 py-2 text-sm text-muted-foreground">
            {query ? "Nobody matches that." : "No one yet. You can add people who follow you back, or share the invite link."}
          </li>
        )}
        {shown.map((person) => {
          const on = chosen.includes(person.id);
          return (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => onToggle(person.id)}
                aria-pressed={on}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-muted",
                  on && "bg-primary/5",
                )}
              >
                <PersonDot person={person} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{person.name}</span>
                  {person.username && (
                    <span className="block truncate text-xs text-muted-foreground">@{person.username}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border",
                    on ? "border-primary bg-primary text-white" : "border-border",
                  )}
                >
                  {on && <Check className="size-3.5" aria-hidden />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/** Make a group with friends: a name, an optional picture, and who's in it. */
const NewGroupDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (groupId: string) => void;
}> = ({ open, onOpenChange, onCreated }) => {
  const create = useCreateGroup();
  const { people, isLoading } = useMutualFollows();
  const [name, setName] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [picture, setPicture] = useState<{ file: File; preview: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setChosen([]);
    setPicture(null);
  };

  const submit = async () => {
    if (!name.trim()) return;
    try {
      const imageUrl = picture ? (await uploadAttachment(picture.file, "CHAT_ASSET")).url : undefined;
      const result = await create.mutateAsync({ name: name.trim(), memberIds: chosen, imageUrl });
      if (!result) return;
      toast.success(
        result.skipped
          ? `Group made. ${result.skipped} couldn't be added; share the invite link with them.`
          : "Group made",
      );
      reset();
      onOpenChange(false);
      onCreated(result.id);
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't make the group."));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New group</DialogTitle>
          <DialogDescription>Plan something with friends: a hike, a trip, a night out.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Add a group picture"
            className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary-100 text-secondary-600"
          >
            {picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={picture.preview} alt="" className="size-full object-cover" />
            ) : (
              <Camera className="size-5" aria-hidden />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setPicture({ file, preview: URL.createObjectURL(file) });
            }}
          />
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Group name, e.g. Hiking crew"
            maxLength={60}
            aria-label="Group name"
            className="h-11"
          />
        </div>
        <PeoplePicker
          people={people}
          loading={isLoading}
          chosen={chosen}
          onToggle={(id) =>
            setChosen((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
          }
        />
        <p className="text-xs text-muted-foreground">
          Only people who follow you back can be added here. Anyone else can join with the invite link, from Group
          info.
        </p>
        <Button className="h-11 rounded-xl" disabled={!name.trim()} onClick={submit}>
          {chosen.length ? `Make group with ${chosen.length} ${chosen.length === 1 ? "person" : "people"}` : "Make group"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default memo(NewGroupDialog);
