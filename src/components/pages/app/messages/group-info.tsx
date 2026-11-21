"use client";

import { constructErrorMessage } from "@/api/functions";
import { uploadAttachment } from "@/api/attachments";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { groupInviteUrl, useGroupActions, useGroupInfo, useMuteGroup } from "@/hooks/use-group-chats";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  Bell,
  Camera,
  Copy,
  FileText,
  Flag,
  Link2,
  LogOut,
  MoreHorizontal,
  Pencil,
  UserPlus,
} from "lucide-react";
import React, { memo, useRef, useState } from "react";
import { PeoplePicker, PersonDot, useMutualFollows } from "./new-group-dialog";

const failed = (fallback: string) => (error: unknown) =>
  toast.error(constructErrorMessage(error as TApiErrorResponseType, fallback));

/**
 * A friends' group: its picture and name, media shared in it, mute, the
 * members (admins first, with a badge), the invite link and adding people
 * (admins), and leaving or reporting it.
 */
const GroupInfo: React.FC<{ groupId: string; onLeft?: () => void }> = ({ groupId, onLeft }) => {
  const { data: group, isLoading } = useGroupInfo(groupId);
  const actions = useGroupActions(groupId);
  const mute = useMuteGroup(groupId);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { people, isLoading: loadingPeople } = useMutualFollows(group?.members.map((member) => member.id) ?? []);

  if (isLoading || !group) {
    return <div className="h-64 animate-pulse rounded-2xl bg-secondary-100/60" />;
  }
  const admin = group.me.isAdmin;
  const members = showAll ? group.members : group.members.slice(0, 5);

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(groupInviteUrl(token)).catch(() => undefined);
    toast.success("Invite link copied");
  };

  return (
    <div className="space-y-4">
      {/* Picture and name */}
      <div className="text-center">
        <div className="relative mx-auto size-28">
          {group.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.image} alt="" className="size-28 rounded-3xl object-cover" />
          ) : (
            <span className="flex size-28 items-center justify-center rounded-3xl bg-primary/10 text-3xl font-extrabold text-secondary-700">
              {group.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          {admin && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Change the group picture"
                className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full border-2 border-card bg-secondary-800 text-white"
              >
                <Camera className="size-4" aria-hidden />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const uploaded = await uploadAttachment(file, "CHAT_ASSET");
                    await actions.setPicture(uploaded.url);
                    toast.success("Picture changed");
                  } catch (error) {
                    failed("Couldn't change the picture.")(error);
                  }
                }}
              />
            </>
          )}
        </div>
        {renaming ? (
          <form
            className="mx-auto mt-3 flex max-w-xs gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!name.trim()) return;
              try {
                await actions.rename(name.trim());
                setRenaming(false);
              } catch (error) {
                failed("Couldn't rename it.")(error);
              }
            }}
          >
            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} autoFocus aria-label="Group name" />
            <Button type="submit" size="sm" className="h-9 rounded-lg">
              Save
            </Button>
          </form>
        ) : (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xl font-extrabold text-secondary-950">
            {group.name}
            {admin && (
              <button
                type="button"
                onClick={() => {
                  setName(group.name);
                  setRenaming(true);
                }}
                aria-label="Rename the group"
                className="text-secondary-400 hover:text-secondary-700"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            )}
          </p>
        )}
        <p className="text-xs font-bold tracking-wide text-secondary-500 uppercase">
          Private group · {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
        </p>
      </div>

      {/* Media, links and docs */}
      {group.media.length > 0 && (
        <section className="rounded-2xl border border-secondary-100 bg-card p-3">
          <p className="mb-2 text-sm font-bold text-secondary-950">Media, links and docs</p>
          <div className="flex gap-2 overflow-x-auto">
            {group.media.map((item) =>
              /\.(png|jpe?g|webp|gif)(\?|$)/i.test(item.url) || item.kind === "image" ? (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="size-20 rounded-xl object-cover" />
                </a>
              ) : (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-secondary-50 text-xs text-secondary-600"
                >
                  <FileText className="size-5" aria-hidden />
                  <span className="max-w-16 truncate">{item.name ?? "File"}</span>
                </a>
              ),
            )}
          </div>
        </section>
      )}

      {/* Mute */}
      <section className="rounded-2xl border border-secondary-100 bg-card">
        <label className="flex items-center gap-3 px-4 py-3">
          <Bell className="size-4 text-secondary-500" aria-hidden />
          <span className="flex-1 text-sm font-semibold text-secondary-900">Mute notifications</span>
          <Switch
            checked={group.me.muted}
            disabled={mute.isPending}
            onCheckedChange={(next) =>
              mute.mutateAsync(next).catch(failed("Couldn't change that."))
            }
          />
        </label>
      </section>

      {/* Members */}
      <section className="rounded-2xl border border-secondary-100 bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-base font-bold text-secondary-950">Members ({group.memberCount})</p>
          {admin && (
            <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => setAdding((on) => !on)}>
              <UserPlus className="size-4" aria-hidden /> Add
            </Button>
          )}
        </div>

        {adding && (
          <div className="mb-3 space-y-2 rounded-xl bg-secondary-50/60 p-3">
            <PeoplePicker
              people={people}
              loading={loadingPeople}
              chosen={chosen}
              onToggle={(id) =>
                setChosen((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
              }
            />
            <Button
              size="sm"
              className="h-9 w-full rounded-lg"
              disabled={!chosen.length}
              onClick={async () => {
                try {
                  await actions.addMembers(chosen);
                  setChosen([]);
                  setAdding(false);
                  toast.success("Added");
                } catch (error) {
                  failed("Couldn't add them.")(error);
                }
              }}
            >
              Add {chosen.length || ""} to the group
            </Button>
          </div>
        )}

        <ul className="divide-y divide-secondary-100">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-2.5">
              <PersonDot person={member} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-secondary-950">{member.name}</span>
                {(member.bio || member.username) && (
                  <span className="block truncate text-xs text-secondary-500">
                    {member.bio || `@${member.username}`}
                  </span>
                )}
              </span>
              {member.isAdmin && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-primary uppercase">
                  Admin
                </span>
              )}
              {admin && !member.isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" aria-label={`Options for ${member.name}`} className="text-secondary-400 hover:text-secondary-700">
                      <MoreHorizontal className="size-4" aria-hidden />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() =>
                        actions
                          .setAdmin({ userId: member.id, isAdmin: !member.isAdmin })
                          .catch(failed("Couldn't change that."))
                      }
                    >
                      {member.isAdmin ? "Remove as admin" : "Make admin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => {
                        if (window.confirm(`Remove ${member.name} from the group?`)) {
                          actions.remove(member.id).catch(failed("Couldn't remove them."));
                        }
                      }}
                    >
                      Remove from group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ul>
        {group.members.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAll((on) => !on)}
            className="mt-1 w-full py-2 text-center text-sm font-semibold text-secondary-700 hover:underline"
          >
            {showAll ? "Show fewer" : `View all ${group.memberCount} members`}
          </button>
        )}
      </section>

      {/* Invite link: admins */}
      {admin && (
        <section className="space-y-2 rounded-2xl border border-secondary-100 bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-secondary-950">
            <Link2 className="size-4 text-primary" aria-hidden /> Invite link
          </p>
          {group.inviteToken ? (
            <>
              <p className="truncate rounded-lg bg-secondary-50 px-3 py-2 font-mono text-xs text-secondary-700">
                {groupInviteUrl(group.inviteToken)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="h-8 rounded-lg" onClick={() => copyLink(group.inviteToken!)}>
                  <Copy className="size-3.5" aria-hidden /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg"
                  onClick={() => actions.makeInvite(undefined).catch(failed("Couldn't make a new link."))}
                >
                  New link
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-lg text-danger"
                  onClick={() => actions.revokeInvite(undefined).catch(failed("Couldn't turn it off."))}
                >
                  Turn off
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-secondary-500">Anyone with the link can join. You can turn it off any time.</p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg"
                onClick={async () => {
                  try {
                    const made = (await actions.makeInvite(undefined)) as { inviteToken: string } | undefined;
                    if (made?.inviteToken) await copyLink(made.inviteToken);
                  } catch (error) {
                    failed("Couldn't make a link.")(error);
                  }
                }}
              >
                Make an invite link
              </Button>
            </>
          )}
        </section>
      )}

      {/* Leave and report */}
      <section className="space-y-2">
        <button
          type="button"
          onClick={async () => {
            if (!window.confirm("Exit this group? You'll need to be added again, or use an invite link, to come back.")) return;
            try {
              await actions.leave(undefined);
              toast.success("You left the group");
              onLeft?.();
            } catch (error) {
              failed("Couldn't leave the group.")(error);
            }
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border border-secondary-100 bg-card px-4 py-3 text-sm font-bold text-danger hover:bg-danger-soft",
          )}
        >
          <LogOut className="size-4" aria-hidden /> Exit group
        </button>
        <button
          type="button"
          onClick={async () => {
            const reason = window.prompt("What's wrong with this group? Our team will look into it.");
            if (reason === null) return;
            try {
              await actions.report(reason);
              toast.success("Reported. Thanks for telling us.");
            } catch (error) {
              failed("Couldn't send the report.")(error);
            }
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-secondary-100 bg-card px-4 py-3 text-sm font-bold text-danger hover:bg-danger-soft"
        >
          <Flag className="size-4" aria-hidden /> Report group
        </button>
        <p className="px-2 text-center text-xs text-secondary-500">
          Exiting removes you from this private group. You&apos;ll need to be added again, or use an invite link, to
          rejoin.
        </p>
      </section>
    </div>
  );
};

export default memo(GroupInfo);
