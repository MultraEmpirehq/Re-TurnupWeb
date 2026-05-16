import { Button } from "@/components/ui/button";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { constructErrorMessage } from "@/api/functions";
import { cn } from "@/lib/utils";
import Joi from "joi";
import { TrashIcon, UploadIcon } from "lucide-react";
import React, { memo, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

export interface IMediaUploadFormValues {
  mediaFiles: (File | string)[];
  sponsorNames: string[];
  sponsorImages: (File | string)[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const getImagePreviewUrl = (image: File | string | null | undefined) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (image instanceof Blob) return URL.createObjectURL(image);
  return "";
};

function validateFile(
  value: unknown,
  helpers: Joi.CustomHelpers,
): File | string | Joi.ErrorReport {
  if (value == null) {
    return helpers.error("any.required");
  }
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (!(value instanceof File)) {
    return helpers.error("any.custom", {
      message: "Please select an image file",
    });
  }
  if (value.size > MAX_FILE_SIZE) {
    return helpers.error("any.custom", {
      message: "File size must be less than 5MB",
    });
  }
  if (!ALLOWED_TYPES.includes(value.type)) {
    return helpers.error("any.custom", {
      message: "Only .jpg, .png, .webp are supported",
    });
  }
  return value;
}

export const mediaUploadFormSchema = Joi.object({
  mediaFiles: Joi.array()
    .items(Joi.any().custom(validateFile))
    .optional()
    .messages({
      "array.min": "Please add at least one image",
      "any.required": "Please add at least one image",
    }),
  sponsorNames: Joi.array().items(Joi.string().allow("")).optional(),
  sponsorImages: Joi.array().items(Joi.any().custom(validateFile)).optional(),
}).unknown(true);

const MediaUploadForm: React.FC<{
  handleNextStep?: () => Promise<void>;
  handlePreviousStep?: () => void;
}> = ({ handleNextStep, handlePreviousStep }) => {
  const {
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useFormContext<IMediaUploadFormValues>();

  const watchedMediaFiles = watch("mediaFiles");
  const watchedSponsorImages = watch("sponsorImages");
  const mediaFiles = useMemo(() => watchedMediaFiles ?? [], [watchedMediaFiles]);
  const sponsorNames = watch("sponsorNames") ?? [];
  const sponsorImages = useMemo(
    () => watchedSponsorImages ?? [],
    [watchedSponsorImages],
  );

  const errorMessage = useMemo(() => {
    if (errors?.mediaFiles?.message) {
      return typeof errors.mediaFiles.message === "string"
        ? errors.mediaFiles.message
        : "Please add at least one image";
    }
    return null;
  }, [errors?.mediaFiles]);

  const addFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles?.length) return;
      const current = getValues("mediaFiles") ?? [];
      const filesToAdd: File[] = [];
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
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
        filesToAdd.push(file);
      }
      if (filesToAdd.length > 0) {
        setValue("mediaFiles", [...current, ...filesToAdd], {
          shouldValidate: true,
        });
      }
    },
    [getValues, setValue],
  );

  const removeFile = useCallback(
    (index: number) => {
      const current = getValues("mediaFiles") ?? [];
      const next = current.filter((_, i: number) => i !== index);
      setValue("mediaFiles", next, { shouldValidate: true });
    },
    [getValues, setValue],
  );

  const addSponsor = useCallback(() => {
    setValue("sponsorNames", [...(getValues("sponsorNames") ?? []), ""], {
      shouldValidate: true,
    });
    setValue("sponsorImages", [...(getValues("sponsorImages") ?? [])], {
      shouldValidate: true,
    });
  }, [getValues, setValue]);

  const updateSponsorName = useCallback(
    (index: number, value: string) => {
      const next = [...(getValues("sponsorNames") ?? [])];
      next[index] = value;
      setValue("sponsorNames", next, { shouldValidate: true });
    },
    [getValues, setValue],
  );

  const updateSponsorImage = useCallback(
    (index: number, file?: File | null) => {
      if (!file) return;
      if (!file.type.includes("image")) {
        toast.error("Please select an image file");
        return;
      }
      const next = [...(getValues("sponsorImages") ?? [])];
      next[index] = file;
      setValue("sponsorImages", next, { shouldValidate: true });
    },
    [getValues, setValue],
  );

  const removeSponsor = useCallback(
    (index: number) => {
      setValue(
        "sponsorNames",
        (getValues("sponsorNames") ?? []).filter((_, i) => i !== index),
        { shouldValidate: true },
      );
      setValue(
        "sponsorImages",
        (getValues("sponsorImages") ?? []).filter((_, i) => i !== index),
        { shouldValidate: true },
      );
    },
    [getValues, setValue],
  );

  const hasMediaFiles = useMemo(() => {
    return mediaFiles.length > 0;
  }, [mediaFiles]);
  const mediaPreviewUrls = useMemo(
    () => mediaFiles.map(getImagePreviewUrl).filter(Boolean),
    [mediaFiles],
  );
  const sponsorImagePreviewUrls = useMemo(
    () => sponsorImages.map(getImagePreviewUrl),
    [sponsorImages],
  );

  const onSubmit = useCallback(async () => {
    try {
      await handleNextStep?.();
    } catch (error) {
      console.log("inner error", error);
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Something went wrong while creating event",
        ),
      );
    }
  }, [handleNextStep]);

  return (
    <div className="gap-3 flex flex-col items-center justify-center w-full py-10 md:py-20">
      {hasMediaFiles && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-[500px]">
          {mediaPreviewUrls.map((previewUrl, index) => (
            <div
              key={`${previewUrl}-${index}`}
              className="aspect-video relative rounded-lg overflow-hidden bg-secondary-100"
            >
              <CustomImageComponent
                src={previewUrl}
                alt={`Media ${index + 1}`}
                className="size-full"
                fill
                imageClassName="object-cover object-center"
              />
              <button
                type="button"
                title="Remove"
                className="absolute top-1 right-1 size-8 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 z-10"
                onClick={() => removeFile(index)}
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        className={cn(
          "border border-dashed flex flex-col gap-3 items-center justify-center w-full max-w-[500px] rounded-xl relative overflow-hidden min-h-[140px] py-8 px-6 md:py-10 md:px-14",
        )}
      >
        <Input
          key={mediaFiles.length}
          type="file"
          accept=".jpg, .png, .webp"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <>
          <UploadIcon className="size-10 text-secondary-700" />
          <p>Drag your files to start uploading</p>
          <div className="flex flex-row items-center w-full gap-3 max-w-[200px]">
            <Separator className="flex-1" />
            <p className="text-sm opacity-60">OR</p>
            <Separator className="flex-1" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-secondary-700 text-secondary-700 pointer-events-none"
          >
            Browse Files
          </Button>
        </>
      </div>
      {!errorMessage && (
        <p className="text-sm max-w-[500px] w-full text-secondary-700">
          Only .jpg, .png, .webp supported. Max 5MB per file.
        </p>
      )}
      {errorMessage && (
        <p className="text-sm max-w-[500px] w-full text-destructive">
          {errorMessage}
        </p>
      )}
      <div className="w-full max-w-[720px] space-y-4 rounded-2xl border border-secondary-100 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-secondary-950">Sponsors</p>
            <p className="text-xs leading-5 text-secondary-500">
              Add sponsor names or logos. These connect to the event preview sponsor board.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addSponsor}>
            Add Sponsor
          </Button>
        </div>

        {sponsorNames.length === 0 && (
          <div className="rounded-xl border border-dashed border-secondary-200 px-4 py-5 text-sm text-secondary-500">
            No sponsors added yet.
          </div>
        )}

        <div className="space-y-3">
          {sponsorNames.map((name, index) => (
            <div
              key={`sponsor-${index}`}
              className="grid gap-3 rounded-xl bg-secondary-50 p-4 md:grid-cols-[1fr_1fr_auto]"
            >
              <Input
                value={name}
                onChange={(event) => updateSponsorName(index, event.target.value)}
                placeholder="Sponsor name"
                className="h-11 rounded-xl bg-white"
              />
              <Input
                type="file"
                accept=".jpg, .png, .webp"
                className="h-11 rounded-xl bg-white"
                onChange={(event) => {
                  updateSponsorImage(index, event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-xl bg-white"
                onClick={() => removeSponsor(index)}
              >
                Remove
              </Button>
              {sponsorImagePreviewUrls[index] && (
                <div className="h-24 rounded-xl border border-secondary-100 bg-white p-3 md:col-span-3">
                  <div className="relative h-full w-full">
                    <CustomImageComponent
                      src={sponsorImagePreviewUrls[index]}
                      alt={`${name || "Sponsor"} logo`}
                      fill
                      className="size-full"
                      imageClassName="object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-[500px] mt-6 md:mt-10 flex flex-row items-center justify-start gap-3">
        <Button
          onClick={handlePreviousStep}
          variant="outline"
          className="border-secondary-700 text-secondary-700"
        >
          Previous
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={!!errors?.mediaFiles || isSubmitting}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default memo(MediaUploadForm);
