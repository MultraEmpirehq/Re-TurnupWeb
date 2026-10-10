"use client";

import ScrollRow from "@/components/ui/scroll-row";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import TextareaField from "@/components/ui/textarea-field";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

/** Page title and the line under it, as every admin page has. */
export const PageHeading: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="flex flex-col gap-1">
    <h1 className="text-xl font-bold text-secondary-800">{title}</h1>
    <p className="max-w-2xl text-sm text-muted-foreground">{children}</p>
  </div>
);

export const FilterTabs = <T extends string | undefined>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <ScrollRow>
    <div className="inline-flex rounded-lg border border-border bg-card p-1">
      {tabs.map((tab) => (
        <Button
          key={tab.label}
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-md px-4",
            value === tab.value &&
              "bg-secondary-800 text-white hover:bg-secondary-800 hover:text-white",
          )}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  </ScrollRow>
);

export const ListSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <Skeleton key={index} className="h-28 w-full rounded-xl" />
    ))}
  </div>
);

/**
 * Asks for a note before an action, such as why an event is being sent back.
 * `required` keeps the confirm button off until something is written.
 */
export const NoteDialog: React.FC<{
  open: boolean;
  title: string;
  description: string;
  label: string;
  placeholder: string;
  confirmLabel: string;
  tone?: "danger" | "default";
  required?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}> = ({
  open,
  title,
  description,
  label,
  placeholder,
  confirmLabel,
  tone = "default",
  required = false,
  busy = false,
  onCancel,
  onConfirm,
}) => {
  const [note, setNote] = useState("");
  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <DialogContent className="rounded-[1.6rem] border-secondary-100 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary-950">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-secondary-500">
            {description}
          </DialogDescription>
        </DialogHeader>
        <TextareaField
          label={label}
          placeholder={placeholder}
          value={note}
          maxLength={500}
          inputClassName="min-h-24"
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            setNote(event.target.value)
          }
        />
        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl border-secondary-200"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || (required && !note.trim())}
            onClick={() => onConfirm(note.trim())}
            className={cn(
              "rounded-2xl text-white",
              tone === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-secondary-800 hover:bg-secondary-900",
            )}
          >
            {busy ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
