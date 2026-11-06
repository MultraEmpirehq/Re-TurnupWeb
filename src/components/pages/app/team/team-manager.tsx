"use client";

import { constructErrorMessage } from "@/api/functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  permissionLabel,
  TTeamMember,
  useRemoveTeamMember,
  useSaveTeamMember,
  useVendorTeam,
  VENDOR_PERMISSIONS,
} from "@/hooks/use-vendor-team";
import { useActiveWorkspace, TVendorPermission } from "@/stores/workspace-store";
import { Loader2, Pencil, Trash2, UserPlus, UsersRound } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";

type TDraft = { id?: string; email: string; permissions: TVendorPermission[] };

const EMPTY_DRAFT: TDraft = { email: "", permissions: ["TICKETS_SCAN"] };

/** Add or edit one person: their email (new people only) and what they may do. */
const MemberDialog: React.FC<{
  draft: TDraft | null;
  onClose: () => void;
}> = ({ draft, onClose }) => {
  const [value, setValue] = useState<TDraft>(draft ?? EMPTY_DRAFT);
  const save = useSaveTeamMember();
  const isEdit = Boolean(draft?.id);

  const toggle = (permission: TVendorPermission, on: boolean) =>
    setValue((current) => ({
      ...current,
      permissions: on
        ? [...current.permissions, permission]
        : current.permissions.filter((item) => item !== permission),
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await save.mutateAsync(value);
      toast.success(
        isEdit ? "Access updated" : `${value.email} added to your team`,
      );
      onClose();
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't save that. Try again.",
        ),
      );
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Change access" : "Add a team member"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? value.email
                : "They sign in with this email and pick your account from the workspace menu. No account yet? They can sign up with it."}
            </DialogDescription>
          </DialogHeader>

          {!isEdit && (
            <div className="space-y-1.5">
              <label htmlFor="team-email" className="text-sm font-semibold">
                Email address
              </label>
              <Input
                id="team-email"
                type="email"
                required
                autoFocus
                value={value.email}
                onChange={(event) =>
                  setValue((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="name@example.com"
              />
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">What can they do?</legend>
            {VENDOR_PERMISSIONS.map((permission) => {
              const checked = value.permissions.includes(permission.value);
              return (
                <label
                  key={permission.value}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors has-[[data-state=checked]]:border-secondary-300 has-[[data-state=checked]]:bg-secondary-50/60"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(on) => toggle(permission.value, on === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{permission.label}</span>
                    <span className="block text-xs leading-5 text-muted-foreground">
                      {permission.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          <p className="text-xs text-muted-foreground">
            Only you can manage your team, payout details and verification.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={save.isPending || !value.permissions.length}
            >
              {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {isEdit ? "Save access" : "Add to team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const initialsOf = (member: TTeamMember) =>
  (member.name || member.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** The organiser's team: who helps run their events, and what each person may do. */
const TeamManager = () => {
  const workspace = useActiveWorkspace();
  const { data: members = [], isPending } = useVendorTeam();
  const remove = useRemoveTeamMember();
  const [draft, setDraft] = useState<TDraft | null>(null);
  const [removing, setRemoving] = useState<TTeamMember | null>(null);

  // The team belongs to the owner; members never manage it, even their own access.
  if (workspace) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        Only {workspace.name} can manage their team.
      </p>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold tracking-[0.2em] text-secondary-400 uppercase">
            Team
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-secondary-950">
            Who helps run your events
          </h1>
          <p className="max-w-2xl text-secondary-500">
            Add people by email and choose exactly what each one can do, from
            scanning tickets at the door to seeing your sales.
          </p>
        </div>
        <Button onClick={() => setDraft(EMPTY_DRAFT)} className="shrink-0">
          <UserPlus className="size-4" aria-hidden />
          Add member
        </Button>
      </div>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary-50 text-secondary-700">
            <UsersRound className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-semibold">No one on your team yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add door staff to scan tickets, or a co-organiser to manage events.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={member.image ?? undefined} />
                  <AvatarFallback className="bg-secondary-800 text-xs font-semibold text-white">
                    {initialsOf(member)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {member.name || member.email}
                    {!member.hasAccount && (
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        Not signed up yet
                      </span>
                    )}
                  </p>
                  {member.name && (
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {member.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full bg-secondary-50 px-2 py-0.5 text-[11px] font-semibold text-secondary-700"
                      >
                        {permissionLabel(permission)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      id: member.id,
                      email: member.email,
                      permissions: member.permissions,
                    })
                  }
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit access
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemoving(member)}
                  aria-label={`Remove ${member.email}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <MemberDialog
          key={draft.id ?? "new"}
          draft={draft}
          onClose={() => setDraft(null)}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        title="Remove from your team?"
        description={`${removing?.email ?? ""} will lose access to your events straight away.`}
        confirmLabel="Remove"
        tone="danger"
        busy={remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await remove.mutateAsync(removing.id);
            toast.success(`${removing.email} removed`);
            setRemoving(null);
          } catch (error) {
            toast.error(
              constructErrorMessage(error as TApiErrorResponseType, "Couldn't remove them."),
            );
          }
        }}
      />
    </div>
  );
};

export default memo(TeamManager);
