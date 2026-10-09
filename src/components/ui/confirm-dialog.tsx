"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import React, { memo } from "react";

/** Asks "are you sure?" before something that can't be undone. */
const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  busy = false,
  onCancel,
  onConfirm,
}) => (
  <Dialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
    <DialogContent className="rounded-[1.6rem] p-6 sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-secondary-950">
          {title}
        </DialogTitle>
        <DialogDescription className="text-sm leading-6 text-secondary-500">
          {description}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="mt-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          loading={busy}
          disabled={busy}
          onClick={onConfirm}
          className={cn(
            "rounded-2xl text-white",
            tone === "danger"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-secondary hover:bg-secondary-600",
          )}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default memo(ConfirmDialog);
