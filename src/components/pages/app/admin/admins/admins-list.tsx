"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ErrorContainer from "@/components/ui/error-container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_LABELS,
  IAdminSummary,
  TAdminPermission,
  useAddAdmin,
  useAdminPermissions,
  useAdmins,
  useRemoveAdmin,
  useResendTemporaryPassword,
  useSetAdminSuspension,
  useUpdateAdminPermissions,
} from "@/hooks/use-admin-permissions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MoreHorizontal, ShieldCheck, UserPlus } from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import { toast } from "sonner";

const ALL_PERMISSIONS = ADMIN_PERMISSIONS.map(({ value }) => value);

const errorText = (error: unknown, fallback: string) =>
  constructErrorMessage(error as TApiErrorResponseType, fallback);

type TEditor =
  { mode: "add" } | { mode: "edit"; admin: IAdminSummary } | undefined;

type TConfirm =
  | {
      kind: "suspend" | "reactivate" | "remove" | "password";
      admin: IAdminSummary;
    }
  | undefined;

/**
 * Picks permissions. Ones the signed-in admin doesn't hold stay visible but locked,
 * since the api would refuse to grant or remove them.
 */
const PermissionPicker: React.FC<{
  value: TAdminPermission[];
  onChange: (value: TAdminPermission[]) => void;
  grantable: Set<TAdminPermission>;
  disabled?: boolean;
}> = ({ value, onChange, grantable, disabled }) => {
  const selected = new Set(value);
  const grantableList = ALL_PERMISSIONS.filter((p) => grantable.has(p));
  const allGrantableSelected = grantableList.every((p) => selected.has(p));

  const toggle = (permission: TAdminPermission, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(permission);
    else next.delete(permission);
    onChange(ALL_PERMISSIONS.filter((p) => next.has(p)));
  };

  const toggleAll = () => {
    const next = new Set(selected);
    grantableList.forEach((p) =>
      allGrantableSelected ? next.delete(p) : next.add(p),
    );
    onChange(ALL_PERMISSIONS.filter((p) => next.has(p)));
  };

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <div className="flex items-center justify-between">
        <legend className="text-sm font-medium text-foreground">
          Permissions
        </legend>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-secondary-800"
          onClick={toggleAll}
        >
          {allGrantableSelected
            ? "Clear all"
            : grantableList.length === ALL_PERMISSIONS.length
              ? "Full access"
              : "Everything I can grant"}
        </Button>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border">
        {ADMIN_PERMISSIONS.map(({ value: permission, label, description }) => {
          const isLocked = !grantable.has(permission);
          const id = `permission-${permission}`;
          return (
            <div
              key={permission}
              className={cn(
                "flex items-start gap-3 px-3.5 py-3",
                isLocked && "opacity-60",
              )}
            >
              <Checkbox
                id={id}
                checked={selected.has(permission)}
                disabled={isLocked || disabled}
                onCheckedChange={(checked) =>
                  toggle(permission, checked === true)
                }
                className="mt-0.5"
              />
              <Label htmlFor={id} className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {isLocked
                    ? "You don't hold this one, so you can't grant or remove it."
                    : description}
                </span>
              </Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};

const PermissionChips: React.FC<{ permissions: TAdminPermission[] }> = ({
  permissions,
}) => {
  if (permissions.length === ALL_PERMISSIONS.length) {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs font-semibold text-secondary-800">
        <ShieldCheck className="size-3.5" aria-hidden />
        Full access
      </span>
    );
  }
  if (!permissions.length) {
    return (
      <span className="text-xs text-muted-foreground">No permissions</span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {ADMIN_PERMISSIONS.filter(({ value }) => permissions.includes(value)).map(
        ({ value, label }) => (
          <span
            key={value}
            className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {label}
          </span>
        ),
      )}
    </div>
  );
};

const AdminsList = () => {
  const { permissions: myPermissions } = useAdminPermissions();
  const mine = useMemo(() => new Set(myPermissions), [myPermissions]);
  const { data: admins, error, isLoading, refetch } = useAdmins();

  const [editor, setEditor] = useState<TEditor>();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [picked, setPicked] = useState<TAdminPermission[]>([]);
  const [confirm, setConfirm] = useState<TConfirm>();

  const addAdmin = useAddAdmin();
  const updatePermissions = useUpdateAdminPermissions();
  const setSuspension = useSetAdminSuspension();
  const removeAdmin = useRemoveAdmin();
  const resendPassword = useResendTemporaryPassword();

  const isSaving = addAdmin.isPending || updatePermissions.isPending;
  const isConfirming =
    setSuspension.isPending || removeAdmin.isPending || resendPassword.isPending;

  // Mirrors the api's rules so nobody is offered an action it will refuse.
  const lockReason = (admin: IAdminSummary) => {
    if (admin.isYou) return "You can't change your own access.";
    const outside = admin.permissions.filter((p) => !mine.has(p));
    if (outside.length) {
      return `They hold ${outside.map((p) => ADMIN_PERMISSION_LABELS[p]).join(", ")}, which you don't.`;
    }
    return undefined;
  };

  const openAdd = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setPicked([]);
    setEditor({ mode: "add" });
  };

  const openEdit = (admin: IAdminSummary) => {
    setPicked(admin.permissions);
    setEditor({ mode: "edit", admin });
  };

  const closeEditor = () => {
    if (!isSaving) setEditor(undefined);
  };

  const handleSave = async () => {
    if (!editor) return;
    try {
      if (editor.mode === "add") {
        await addAdmin.mutateAsync({ email, firstName, lastName, permissions: picked });
        toast.success(
          `Admin added. Their temporary password is on its way to ${email.trim()}.`,
        );
      } else {
        await updatePermissions.mutateAsync({
          id: editor.admin.id,
          permissions: picked,
        });
        toast.success(`Permissions updated for ${editor.admin.email}.`);
      }
      setEditor(undefined);
    } catch (saveError) {
      toast.error(errorText(saveError, "Couldn't save the changes right now."));
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { kind, admin } = confirm;
    try {
      if (kind === "remove") {
        await removeAdmin.mutateAsync(admin.id);
        toast.success(`${admin.email} is no longer an admin.`);
      } else if (kind === "password") {
        await resendPassword.mutateAsync(admin.id);
        toast.success(`A new temporary password is on its way to ${admin.email}.`);
      } else {
        await setSuspension.mutateAsync({
          id: admin.id,
          suspended: kind === "suspend",
        });
        toast.success(
          kind === "suspend"
            ? `${admin.email} is suspended and signed out.`
            : `${admin.email} can sign in again.`,
        );
      }
      setConfirm(undefined);
    } catch (actionError) {
      toast.error(errorText(actionError, "Couldn't do that right now."));
    }
  };

  const unchanged =
    editor?.mode === "edit" &&
    editor.admin.permissions.length === picked.length &&
    editor.admin.permissions.every((p) => picked.includes(p));
  const canSave =
    !isSaving &&
    picked.length > 0 &&
    !unchanged &&
    (editor?.mode !== "add" ||
      (/\S+@\S+\.\S+/.test(email.trim()) && !!firstName.trim() && !!lastName.trim()));

  const confirmCopy =
    confirm &&
    {
      suspend: {
        title: `Suspend ${confirm.admin.email}?`,
        body: "They are signed out on every device straight away and can't sign in until reactivated. Their permissions are kept.",
        action: "Suspend",
      },
      reactivate: {
        title: `Reactivate ${confirm.admin.email}?`,
        body: "They can sign in again, with the permissions they had before.",
        action: "Reactivate",
      },
      password: {
        title: `Send ${confirm.admin.email} a new temporary password?`,
        body: "Their current password stops working and they're signed out everywhere. The new one is emailed to them, lasts 24 hours, and they choose their own when they sign in.",
        action: "Send password",
      },
      remove: {
        title: `Remove ${confirm.admin.email} as an admin?`,
        body: "Their permissions are taken away. The account stays, as a vendor if they ever applied to sell, otherwise as a regular user.",
        action: "Remove admin",
      },
    }[confirm.kind];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-secondary-800">
            Admins &amp; Permissions
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Each admin can only use what their permissions allow. You can grant
            and take away only the permissions you hold yourself, and you
            can&apos;t change your own.
          </p>
        </div>
        <Button
          type="button"
          onClick={openAdd}
          className="shrink-0 rounded-xl bg-secondary-800 text-white hover:bg-secondary-900"
        >
          <UserPlus className="size-4" />
          Add admin
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!!error && !isLoading && (
        <ErrorContainer
          error={errorText(error, "Could not load the admins")}
          retryFunction={() => void refetch()}
        />
      )}

      {!isLoading && !error && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {(admins ?? []).map((admin) => {
            const locked = lockReason(admin);
            return (
              <li
                key={admin.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-foreground">
                      {admin.name ?? admin.email}
                    </span>
                    {admin.isYou && (
                      <span className="rounded-full bg-secondary-50 px-2 py-0.5 text-[11px] font-semibold text-secondary-800">
                        You
                      </span>
                    )}
                    {admin.isSuspended && (
                      <span className="rounded-full bg-secondary-50 px-2 py-0.5 text-[11px] font-semibold text-secondary-800">
                        Suspended
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {admin.name ? `${admin.email} · ` : ""}Admin since{" "}
                    {format(new Date(admin.createdAt), "d MMM yyyy")}
                  </p>
                  <PermissionChips permissions={admin.permissions} />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={!!locked}
                      title={locked}
                      aria-label={
                        locked
                          ? `No actions available: ${locked}`
                          : `Actions for ${admin.email}`
                      }
                      className="size-9 shrink-0 self-end rounded-xl sm:self-center"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEdit(admin)}>
                      Edit permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setConfirm({ kind: "password", admin })}
                    >
                      Send new temporary password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        setConfirm({
                          kind: admin.isSuspended ? "reactivate" : "suspend",
                          admin,
                        })
                      }
                    >
                      {admin.isSuspended ? "Reactivate" : "Suspend"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setConfirm({ kind: "remove", admin })}
                    >
                      Remove admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!editor} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-[1.6rem] border-secondary-100 p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-secondary-950">
              {editor?.mode === "edit"
                ? `Permissions for ${editor.admin.email}`
                : "Add an admin"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-secondary-500">
              {editor?.mode === "edit"
                ? "Changes apply from their next action; they don't need to sign in again."
                : "A new account for their work email. We email them a temporary password that lasts 24 hours; they choose their own when they first sign in."}
            </DialogDescription>
          </DialogHeader>

          {editor?.mode === "add" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-first-name">First name</Label>
                <Input
                  id="admin-first-name"
                  autoComplete="off"
                  value={firstName}
                  disabled={isSaving}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-last-name">Last name</Label>
                <Input
                  id="admin-last-name"
                  autoComplete="off"
                  value={lastName}
                  disabled={isSaving}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </div>
            </div>
          )}

          {editor?.mode === "add" && (
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Work email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="off"
                placeholder="name@turnupz.com"
                value={email}
                disabled={isSaving}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          )}

          <PermissionPicker
            value={picked}
            onChange={setPicked}
            grantable={mine}
            disabled={isSaving}
          />

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-secondary-200"
              disabled={isSaving}
              onClick={closeEditor}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-2xl bg-secondary-800 text-white hover:bg-secondary-900"
              disabled={!canSave}
              onClick={handleSave}
            >
              {isSaving
                ? "Saving..."
                : editor?.mode === "add"
                  ? "Add admin"
                  : "Save permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirm}
        onOpenChange={(open) => !open && !isConfirming && setConfirm(undefined)}
      >
        <DialogContent className="rounded-[1.6rem] border-secondary-100 p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-secondary-950">
              {confirmCopy?.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-7 text-secondary-500">
              {confirmCopy?.body}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-secondary-200"
              disabled={isConfirming}
              onClick={() => setConfirm(undefined)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isConfirming}
              onClick={handleConfirm}
              className={cn(
                "rounded-2xl text-white",
                confirm?.kind === "reactivate"
                  ? "bg-secondary-800 hover:bg-secondary-900"
                  : "bg-red-600 hover:bg-red-700",
              )}
            >
              {isConfirming ? "Working..." : confirmCopy?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(AdminsList);
