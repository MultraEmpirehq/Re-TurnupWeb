"use client";

import { uploadAttachment } from "@/api/attachments";
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
import TextareaField from "@/components/ui/textarea-field";
import {
  PERFORMER_TYPE_LABELS,
  TPerformerInput,
  useCreatePerformer,
  useUpdatePerformer,
} from "@/hooks/use-discovery";
import { IPerformer, TPerformerType } from "@/lib/types";
import { Country } from "country-state-city";
import dynamic from "next/dynamic";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import PerformerAvatar from "./performer-avatar";

const ComboboxSelect = dynamic(
  () => import("@/components/ui/combobox-select"),
  {
    ssr: false,
  },
);

const TYPE_OPTIONS = (
  Object.keys(PERFORMER_TYPE_LABELS) as TPerformerType[]
).map((value) => ({ value, label: PERFORMER_TYPE_LABELS[value] }));

type TFormState = {
  name: string;
  type: TPerformerType;
  bio: string;
  countryCode: string;
  instagram: string;
  twitter: string;
  website: string;
};

const fromPerformer = (performer?: IPerformer | null): TFormState => ({
  name: performer?.name ?? "",
  type: performer?.type ?? "ARTIST",
  bio: performer?.bio ?? "",
  countryCode: performer?.countryCode ?? "",
  instagram: performer?.instagram ?? "",
  twitter: performer?.twitter ?? "",
  website: performer?.website ?? "",
});

/**
 * Adds a performer, or edits one when `performer` is given. Used on the
 * Performers page and from the line-up picker, which gets the new performer back
 * through `onSaved` so it can go straight onto the bill.
 */
const PerformerFormDialog: React.FC<{
  open: boolean;
  performer?: IPerformer | null;
  initialName?: string;
  onClose: () => void;
  onSaved?: (performer: IPerformer) => void;
}> = ({ open, performer, initialName, onClose, onSaved }) => {
  const isEditing = !!performer;
  const [form, setForm] = useState<TFormState>(fromPerformer(performer));
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const create = useCreatePerformer();
  const update = useUpdatePerformer();

  useEffect(() => {
    if (!open) return;
    setForm({
      ...fromPerformer(performer),
      name: performer?.name ?? initialName ?? "",
    });
    setPhoto(null);
  }, [open, performer, initialName]);

  const countries = useMemo(
    () =>
      Country.getAllCountries().map((country) => ({
        value: country.isoCode,
        label: country.name,
      })),
    [],
  );
  const preview = useMemo(
    () => (photo ? URL.createObjectURL(photo) : (performer?.image ?? null)),
    [photo, performer?.image],
  );
  useEffect(
    () => () => {
      if (photo && preview) URL.revokeObjectURL(preview);
    },
    [photo, preview],
  );

  const set =
    (field: keyof TFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Give the performer a name.");
      return;
    }
    setSaving(true);
    try {
      const imageId = photo
        ? ((await uploadAttachment(photo, "PERFORMER_IMAGE")).id ?? undefined)
        : undefined;
      const body: TPerformerInput = {
        name: form.name.trim(),
        type: form.type,
        bio: form.bio.trim() || undefined,
        countryCode: form.countryCode || undefined,
        country: form.countryCode
          ? Country.getCountryByCode(form.countryCode)?.name
          : undefined,
        instagram: form.instagram.trim() || undefined,
        twitter: form.twitter.trim() || undefined,
        website: form.website.trim() || undefined,
        ...(imageId ? { imageId } : {}),
      };
      const saved = isEditing
        ? await update.mutateAsync({ id: performer.id, ...body })
        : await create.mutateAsync(body);
      toast.success(isEditing ? "Performer updated." : `${body.name} added.`);
      if (saved) onSaved?.(saved);
      onClose();
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't save the performer.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.6rem] p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary-950">
            {isEditing ? `Edit ${performer.name}` : "Add a performer"}
          </DialogTitle>
          <DialogDescription className="text-sm text-secondary-500">
            Performers can be added to any event&apos;s line-up and get a page of
            their own that people can follow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <PerformerAvatar
              name={form.name || "?"}
              image={preview}
              className="size-16"
            />
            <label className="cursor-pointer text-sm font-semibold text-secondary hover:underline">
              {preview ? "Change photo" : "Add a photo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <InputField
            label="Name"
            required
            value={form.name}
            maxLength={120}
            placeholder="e.g. Tems"
            onChange={set("name")}
          />
          <SelectField
            label="What they do"
            value={form.type}
            setValue={(value) =>
              setForm((current) => ({
                ...current,
                type: value as TPerformerType,
              }))
            }
            options={TYPE_OPTIONS}
          />
          <ComboboxSelect
            label="Country (for the regional charts)"
            item={form.countryCode}
            setItem={(countryCode) =>
              setForm((current) => ({ ...current, countryCode }))
            }
            items={countries}
            placeholder="Select a country"
            emptyText="No country found."
          />
          <TextareaField
            label="Bio"
            value={form.bio}
            maxLength={1000}
            placeholder="A line or two about them."
            onChange={set("bio")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Instagram"
              value={form.instagram}
              placeholder="@handle"
              onChange={set("instagram")}
            />
            <InputField
              label="X (Twitter)"
              value={form.twitter}
              placeholder="@handle"
              onChange={set("twitter")}
            />
          </div>
          <InputField
            label="Website"
            value={form.website}
            placeholder="example.com"
            onChange={set("website")}
          />
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={saving}
            disabled={saving}
            onClick={() => void handleSave()}
            className="rounded-2xl bg-secondary text-white hover:bg-secondary-600"
          >
            {isEditing ? "Save changes" : "Add performer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(PerformerFormDialog);
