"use client";

import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import TextareaField from "@/components/ui/textarea-field";
import { sameName } from "@/lib/same-name";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import React, { memo, useMemo, useState } from "react";

/** A pass handed out rather than sold: media, sponsors, crew. */
export interface IAccessPassType {
  passName: string;
  quantity: number;
  assigneeEmails: string[];
  transferable?: boolean;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyDraft = { passName: "", quantity: "1", assigneeEmails: "", transferable: false };

/** The typed emails, split on commas, spaces or new lines. */
const parseEmails = (text: string) =>
  text
    .split(/[\s,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

/** One pass type, as a compact row: they're optional, so they stay small. */
const PassRow: React.FC<{
  pass: IAccessPassType;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ pass, editing, onEdit, onDelete }) => {
  const people = pass.assigneeEmails.length;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-secondary-100 bg-white px-2.5 py-2",
        editing && "ring-2 ring-primary",
      )}
    >
      <span className="flex h-9 min-w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-[#0b1d2a] px-1.5 text-white">
        <span className="text-sm leading-none font-extrabold">{pass.quantity}</span>
        <span className="text-[8px] leading-none font-bold tracking-wider text-white/60">PASS</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-secondary-950">{pass.passName}</p>
        <p
          className="truncate text-[11px] text-secondary-500"
          title={people ? pass.assigneeEmails.join(", ") : undefined}
        >
          {people
            ? `${people === 1 ? pass.assigneeEmails[0] : `${people} people`}`
            : "Not sent to anyone yet"}
          {" · "}
          {pass.transferable ? "can be passed on" : "can't be passed on"}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        disabled={editing}
        aria-label={`Edit ${pass.passName}`}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-950 disabled:opacity-40"
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${pass.passName}`}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
};

/**
 * Passes given, not sold: media, sponsor or crew passes, sent by email to
 * people's Turnupz accounts. They count towards the event's attendance.
 */
const AccessPassesInput: React.FC<{
  passes: IAccessPassType[];
  setPasses: (passes: IAccessPassType[]) => void;
}> = ({ passes = [], setPasses }) => {
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState(emptyDraft);

  const emails = useMemo(() => parseEmails(draft.assigneeEmails), [draft.assigneeEmails]);
  const badEmails = emails.filter((email) => !EMAIL.test(email));
  const quantity = Math.max(0, Math.floor(Number(draft.quantity || 0)));
  // The other pass types (not the one being edited), to keep names and people unique.
  const others = passes.filter((_, index) => index !== editingIndex);
  const nameTaken = others.some(
    (pass) => sameName(pass.passName, draft.passName),
  );
  const alreadyHasOne = emails
    .map((email) => ({
      email,
      pass: others.find((pass) =>
        pass.assigneeEmails.some((other) => other.toLowerCase() === email),
      ),
    }))
    .filter((item) => item.pass);
  const problem = !draft.passName.trim()
    ? null
    : nameTaken
      ? `There's already a pass called “${draft.passName.trim().replace(/\s+/g, " ")}”. Give this one another name.`
    : quantity < 1
      ? "Give at least 1 pass."
      : badEmails.length
        ? `Check ${badEmails.length === 1 ? "this email" : "these emails"}: ${badEmails.join(", ")}`
        : alreadyHasOne.length
          ? alreadyHasOne
              .map(({ email, pass }) => `${email} already gets a ${pass!.passName}.`)
              .join(" ")
        : emails.length > quantity
          ? `That's ${emails.length} people for ${quantity} ${quantity === 1 ? "pass" : "passes"}. Add more passes or fewer people.`
          : null;
  const total = passes.reduce((sum, pass) => sum + Number(pass.quantity || 0), 0);

  const close = () => {
    setDraft(emptyDraft);
    setEditingIndex(null);
    setOpen(false);
  };

  const save = () => {
    if (!draft.passName.trim() || problem) return;
    const pass: IAccessPassType = {
      passName: draft.passName.trim(),
      quantity,
      assigneeEmails: [...new Set(emails)],
      transferable: draft.transferable,
    };
    setPasses(
      editingIndex !== null
        ? passes.map((item, index) => (index === editingIndex ? { ...item, ...pass } : item))
        : [...passes, pass],
    );
    close();
  };

  const edit = (index: number) => {
    const pass = passes[index];
    setDraft({
      passName: pass.passName,
      quantity: String(pass.quantity),
      assigneeEmails: pass.assigneeEmails.join(", "),
      transferable: !!pass.transferable,
    });
    setEditingIndex(index);
    setOpen(true);
  };

  const remove = (index: number) => {
    setPasses(passes.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) close();
    else if (editingIndex !== null && index < editingIndex) setEditingIndex(editingIndex - 1);
  };

  return (
    <div className="space-y-2.5 rounded-2xl border border-dashed border-secondary-200 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Label className="opacity-60">
            Access passes <span className="font-normal">(optional)</span>
          </Label>
          <p className="mt-1 text-xs text-secondary-500">
            {passes.length
              ? `${passes.length} ${passes.length === 1 ? "pass type" : "pass types"} · ${total} ${total === 1 ? "pass" : "passes"} given out, counted in attendance`
              : "Media, sponsor or crew passes, sent free to people's Turnupz accounts by email."}
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full px-3 py-1.5 text-xs font-bold text-primary-700 transition hover:bg-primary-50"
          >
            + Add pass
          </button>
        )}
      </div>

      {passes.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {passes.map((pass, index) => (
            <PassRow
              key={`${pass.passName}-${index}`}
              pass={pass}
              editing={editingIndex === index}
              onEdit={() => edit(index)}
              onDelete={() => remove(index)}
            />
          ))}
        </div>
      )}

      {open && (
        <div className="space-y-3 rounded-xl border border-secondary-100 bg-secondary-50/40 p-3">
          <p className="text-xs font-semibold text-secondary-950">
            {editingIndex !== null ? `Editing “${passes[editingIndex]?.passName}”` : "New pass"}
          </p>
          <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
            <InputField
              label="Pass name"
              placeholder="Media pass"
              value={draft.passName}
              onChange={(event) => setDraft((current) => ({ ...current, passName: event.target.value }))}
            />
            <InputField
              label="How many"
              type="number"
              min={1}
              placeholder="10"
              value={draft.quantity}
              onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))}
            />
          </div>
          <TextareaField
            label="Send to (optional)"
            placeholder="Emails, separated by commas or new lines"
            value={draft.assigneeEmails}
            onChange={(event) => setDraft((current) => ({ ...current, assigneeEmails: event.target.value }))}
            helperText={
              emails.length
                ? `${emails.length} ${emails.length === 1 ? "person" : "people"}. Each gets a pass in their Turnupz account.`
                : "You can also leave this empty and send them later."
            }
          />
          <label className="inline-flex cursor-pointer items-center gap-3 px-1">
            <Switch
              checked={draft.transferable}
              onCheckedChange={(value) => setDraft((current) => ({ ...current, transferable: value }))}
              aria-label="Passes can be passed on"
            />
            <span className="text-sm text-secondary-800">
              Can be passed on{" "}
              <span className="text-xs text-secondary-500">(people can transfer it)</span>
            </span>
          </label>
          {problem && <p className="text-sm text-destructive">{problem}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={close}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              disabled={!draft.passName.trim() || !!problem}
              onClick={save}
            >
              {editingIndex !== null ? "Save changes" : "Add pass"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AccessPassesInput);
