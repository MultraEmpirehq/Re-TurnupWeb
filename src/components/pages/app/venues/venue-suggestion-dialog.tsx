"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InputField from "@/components/ui/input-field";
import SelectField from "@/components/ui/select-field";
import {
  TVenueSuggestionInput,
  useSaveVenueSuggestion,
  VenueSuggestion,
} from "@/hooks/use-vendor-venues";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";

const COUNTRIES = [
  { value: "Nigeria", label: "Nigeria" },
  { value: "Canada", label: "Canada" },
];

const empty: TVenueSuggestionInput = { name: "", address: "", city: "", state: "", country: "Nigeria" };

/**
 * Suggests a venue for the directory, or (given `suggestion`) fixes one an
 * admin sent back and sends it for review again.
 */
const VenueSuggestionDialog = ({
  open,
  suggestion,
  onClose,
}: {
  open: boolean;
  suggestion?: VenueSuggestion | null;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<TVenueSuggestionInput>(empty);
  const save = useSaveVenueSuggestion();
  const fixing = !!suggestion;

  useEffect(() => {
    if (!open) return;
    setForm(
      suggestion
        ? {
            name: suggestion.name,
            address: suggestion.address ?? "",
            city: suggestion.city ?? "",
            state: suggestion.state ?? "",
            country: suggestion.country ?? "Nigeria",
          }
        : empty,
    );
  }, [open, suggestion]);

  const set =
    (field: keyof TVenueSuggestionInput) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error("Add the venue's name, address and city.");
      return;
    }
    try {
      await save.mutateAsync({
        ...form,
        state: form.state?.trim() || undefined,
        ...(suggestion ? { id: suggestion.id } : {}),
      });
      toast.success(
        fixing ? "Sent for review again." : "Thanks. We'll review it and add it to the directory.",
      );
      onClose();
    } catch (error) {
      toast.error(
        constructErrorMessage(error as TApiErrorResponseType, "Couldn't save the venue."),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !save.isPending && onClose()}>
      <DialogContent className="rounded-[1.6rem] p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary-950">
            {fixing ? `Fix ${suggestion.name}` : "Suggest a venue"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {fixing && suggestion.reviewNote
              ? `Admin note: ${suggestion.reviewNote}`
              : "We check each venue before it joins the directory. You can use it on your events straight away."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <InputField
            label="Venue name"
            required
            maxLength={120}
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. The Rooftop Ikoyi"
          />
          <InputField
            label="Address"
            required
            maxLength={300}
            value={form.address}
            onChange={set("address")}
            placeholder="Street and number"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="City"
              required
              maxLength={80}
              value={form.city}
              onChange={set("city")}
              placeholder="e.g. Lagos"
            />
            <InputField
              label="State or province"
              maxLength={80}
              value={form.state}
              onChange={set("state")}
              placeholder="Optional"
            />
          </div>
          <SelectField
            label="Country"
            value={form.country}
            setValue={(country) => setForm((current) => ({ ...current, country }))}
            options={COUNTRIES}
          />
        </div>
        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" className="rounded-full" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button className="rounded-full" loading={save.isPending} onClick={() => void submit()}>
            {fixing ? "Send for review" : "Suggest venue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(VenueSuggestionDialog);
