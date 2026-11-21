"use client";

import ImageCropDialog from "@/components/ui/image-crop-dialog";
import { Smartphone, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";

const MAX_MB = 5;

/**
 * The optional phone cover: a taller 4:5 image the app and phone browsers show
 * at the top of the event and in feeds, instead of cutting the sides off the
 * 16:9 banner. Left empty, the banner is used everywhere. The value is a picked
 * file, the saved image's link, or null.
 */
const PhoneCoverField = ({
  value,
  onChange,
  bannerUrl,
}: {
  value: File | string | null | undefined;
  onChange: (value: File | null) => void;
  /** The banner, to show what phones get when there's no phone cover. */
  bannerUrl?: string;
}) => {
  const input = useRef<HTMLInputElement>(null);
  const [toCrop, setToCrop] = useState<File | null>(null);
  const preview = useMemo(() => (value instanceof File ? URL.createObjectURL(value) : value || ""), [value]);
  useEffect(() => () => {
    if (value instanceof File && preview) URL.revokeObjectURL(preview);
  }, [value, preview]);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-secondary-100 bg-card p-4 sm:flex-row sm:items-center">
      <div className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-2xl border border-dashed border-secondary-200 bg-secondary-50">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Phone cover" className="size-full object-cover" />
        ) : bannerUrl ? (
          <>
            {/* What phones get without one: the banner, over a blurred copy of itself. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="" aria-hidden className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-md" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="" aria-hidden className="relative top-1/2 w-full -translate-y-1/2 object-contain" />
          </>
        ) : (
          <div className="flex size-full items-center justify-center text-secondary-300">
            <Smartphone className="size-7" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-sm font-semibold text-secondary-950">
            Phone cover <span className="font-normal text-secondary-500">(optional)</span>
          </p>
          <p className="mt-1 text-sm text-secondary-500">
            A taller 4:5 image for phones, like an Instagram flyer. Without one, phones show your banner
            {bannerUrl ? " as in the preview" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-secondary-200 bg-background px-4 text-sm font-semibold text-secondary-900 transition-colors hover:border-primary"
          >
            <Upload className="size-4" aria-hidden /> {preview ? "Replace" : "Add phone cover"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" aria-hidden /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept=".jpg, .jpeg, .png, .webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (!file.type.startsWith("image/")) return void toast.error("Please select an image file");
          if (file.size > MAX_MB * 1024 * 1024) return void toast.error(`File size must be less than ${MAX_MB}MB`);
          setToCrop(file);
        }}
      />
      <ImageCropDialog
        file={toCrop}
        aspect={4 / 5}
        kind="photo"
        title="Crop your phone cover"
        description="Phone covers show at 4:5 at the top of the event in the app and on phones. Drag and zoom to frame it."
        onCancel={() => setToCrop(null)}
        onDone={(cropped) => {
          onChange(cropped);
          setToCrop(null);
        }}
      />
    </div>
  );
};

export default memo(PhoneCoverField);
