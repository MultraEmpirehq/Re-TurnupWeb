"use client";

import { patchData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import useVendorVerificationStatus from "@/hooks/use-vendor-verification-status";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * The name a vendor's events go out under ("Organised by"). It can change any
 * time, even after approval; events already made keep the name they have.
 */
const OrganiserNameCard = () => {
  const queryClient = useQueryClient();
  const { organiserName, isChecking } = useVendorVerificationStatus();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setValue(organiserName ?? "");
  }, [organiserName]);

  const trimmed = value.trim();
  const changed = trimmed !== (organiserName ?? "");
  const error =
    changed && trimmed.length < 2
      ? "Enter the name your events go out under"
      : trimmed.length > 80
        ? "Keep it under 80 characters"
        : undefined;

  const save = async () => {
    if (error || !changed) return;
    setSaving(true);
    try {
      await patchData("/vendor/verification/organiser-name", {
        organiserName: trimmed,
      });
      await queryClient.invalidateQueries({
        queryKey: ["vendor-verification-status"],
      });
      toast.success("Organiser name saved. New events will use it.");
    } catch (failure) {
      toast.error(
        constructErrorMessage(
          failure as TApiErrorResponseType,
          "We couldn't save your organiser name",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5 rounded-[1.5rem] border border-secondary-100 bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-secondary-50 p-2.5 text-secondary">
          <Megaphone className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-secondary-950">Organiser name</h2>
          <p className="text-sm text-secondary-500">
            Shown as &ldquo;Organised by&rdquo; on your events and your organiser
            page. Events you&apos;ve already made keep their name.
          </p>
        </div>
      </div>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-start"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <InputField
          label="Organiser name"
          labelClassName="sr-only"
          placeholder="e.g. Afrobeat Live"
          disabled={isChecking}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={error}
          containerClassName="flex-1"
        />
        <Button
          type="submit"
          disabled={!changed || !!error}
          loading={saving}
          className="h-11 rounded-full px-6"
        >
          Save
        </Button>
      </form>
    </section>
  );
};

export default memo(OrganiserNameCard);
