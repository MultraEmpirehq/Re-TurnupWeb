"use client";

import { Button } from "@/components/ui/button";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TrashIcon, UploadIcon } from "lucide-react";
import React, { memo, useCallback, useMemo } from "react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

interface IVenueImagesInputProps {
  images: File[];
  setImages: (images: File[]) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

const VenueImagesInput: React.FC<IVenueImagesInputProps> = ({
  images,
  setImages,
  error,
  label = "Venue Images",
  required,
}) => {
  const hasImages = useMemo(() => images.length > 0, [images]);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const next: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.includes("image")) {
          toast.error(`${file.name}: Please select an image file`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: File size must be less than 5MB`);
          continue;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`${file.name}: Only .jpg, .png, .webp are supported`);
          continue;
        }
        next.push(file);
      }
      if (next.length > 0) {
        setImages([...images, ...next]);
      }
    },
    [images, setImages],
  );

  const removeImage = useCallback(
    (index: number) => {
      setImages(images.filter((_, i) => i !== index));
    },
    [images, setImages],
  );

  return (
    <div className="space-y-2 lg:col-span-2">
      {label && (
        <Label className="opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {hasImages && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="aspect-video relative rounded-lg overflow-hidden bg-secondary-100"
            >
              <CustomImageComponent
                src={URL.createObjectURL(file)}
                alt={`Venue image ${index + 1}`}
                className="size-full"
                fill
                imageClassName="object-cover object-center"
              />
              <button
                type="button"
                title="Remove"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 size-8 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 z-10"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        className={cn(
          "border border-dashed flex flex-col gap-3 items-center justify-center w-full rounded-xl relative overflow-hidden min-h-[140px] py-6 px-4",
        )}
      >
        <Input
          key={images.length}
          type="file"
          accept=".jpg, .png, .webp"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <UploadIcon className="size-8 text-secondary-700" />
        <p className="text-sm">Drag your images to start uploading</p>
        <div className="flex flex-row items-center w-full gap-3 max-w-[200px]">
          <Separator className="flex-1" />
          <p className="text-xs opacity-60">OR</p>
          <Separator className="flex-1" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-secondary-700 text-secondary-700 pointer-events-none"
        >
          Browse Files
        </Button>
      </div>
      {!error && (
        <p className="text-xs text-secondary-700">
          Only .jpg, .png, .webp supported. Max 5MB per file.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default memo(VenueImagesInput);
