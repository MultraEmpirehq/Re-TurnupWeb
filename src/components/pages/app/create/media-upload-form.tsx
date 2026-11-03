import { Button } from "@/components/ui/button";
import SponsorShowToggle from "./sponsor-show-toggle";
import { MediaThumb } from "@/components/pages/explore/event-detail/event-detail-media";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { Input } from "@/components/ui/input";
import { constructErrorMessage } from "@/api/functions";
import { cn } from "@/lib/utils";
import Joi from "joi";
import {
  ChevronLeft,
  ChevronRight,
  PlusIcon,
  UploadIcon,
  X,
} from "lucide-react";
import React, { memo, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { moveItem } from "@/lib/move-item";

export interface IMediaUploadFormValues {
  mediaFiles: (File | string)[];
  /** Parallel to mediaFiles: a saved photo's attachment id (null for new). */
  mediaFileIds?: (string | null)[];
  sponsorNames: string[];
  sponsorImages: (File | string)[];
  /** Parallel to sponsorNames: the logo a saved sponsor has (an attachment id). */
  sponsorLogoIds?: (string | null)[];
  /** Parallel to sponsorNames: show the name instead of the logo. */
  sponsorShowNames?: boolean[];
}


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
/** Short clips for the gallery; the upload limit is 10MB. */
const MAX_VIDEO_SIZE = 10 * 1024 * 1024;
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

/** Why a gallery file can't be used, or null when it can. */
const galleryFileProblem = (file: File) => {
  if (file.type.startsWith("video/")) {
    if (!VIDEO_TYPES.includes(file.type)) return "Videos can be MP4, MOV or WebM";
    if (file.size > MAX_VIDEO_SIZE) return "Videos must be under 10MB";
    return null;
  }
  if (!ALLOWED_TYPES.includes(file.type)) return "Photos can be JPG, PNG or WEBP";
  if (file.size > MAX_FILE_SIZE) return "Photos must be under 5MB";
  return null;
};

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

function validateGalleryFile(
  value: unknown,
  helpers: Joi.CustomHelpers,
): File | string | Joi.ErrorReport {
  if (typeof value === "string" && value.trim()) return value;
  if (!(value instanceof File)) {
    return helpers.error("any.custom", { message: "Please select a photo or video" });
  }
  const problem = galleryFileProblem(value);
  return problem ? helpers.error("any.custom", { message: problem }) : value;
}

export const mediaUploadFormSchema = Joi.object({
  mediaFiles: Joi.array()
    .items(Joi.any().custom(validateGalleryFile))
    .optional()
    .messages({
      "array.min": "Please add at least one image",
      "any.required": "Please add at least one image",
    }),
  mediaFileIds: Joi.array().items(Joi.string().allow(null, "")).optional(),
  sponsorLogoIds: Joi.array().items(Joi.string().allow(null, "")).optional(),
  sponsorShowNames: Joi.array().items(Joi.boolean()).optional(),
  sponsorNames: Joi.array().items(Joi.string().allow("")).optional(),
  // A sponsor without a logo yet holds an empty slot, which is fine.
  sponsorImages: Joi.array()
    .items(Joi.any().allow("", null).custom(validateFile))
    .optional(),
}).unknown(true);

const MediaUploadForm: React.FC<{
  handleNextStep?: () => Promise<void>;
  handlePreviousStep?: () => void;
  isSaving?: boolean;
}> = ({ handleNextStep, handlePreviousStep, isSaving = false }) => {
  const {
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useFormContext<IMediaUploadFormValues>();

  const watchedMediaFiles = watch("mediaFiles");
  const watchedSponsorImages = watch("sponsorImages");
  const mediaFiles = useMemo(
    () => watchedMediaFiles ?? [],
    [watchedMediaFiles],
  );
  const sponsorNames = watch("sponsorNames") ?? [];
  const sponsorShowNames = watch("sponsorShowNames") ?? [];
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
        const problem = galleryFileProblem(file);
        if (problem) {
          toast.error(`${file.name}: ${problem}`);
          continue;
        }
        filesToAdd.push(file);
      }
      if (filesToAdd.length > 0) {
        const ids = getValues("mediaFileIds") ?? [];
        setValue("mediaFileIds", [
          ...current.map((_, i) => ids[i] ?? null),
          ...filesToAdd.map(() => null),
        ]);
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
      const ids = current.map((_, i) => getValues("mediaFileIds")?.[i] ?? null);
      setValue(
        "mediaFileIds",
        ids.filter((_, i) => i !== index),
      );
      setValue("mediaFiles", next, { shouldValidate: true });
    },
    [getValues, setValue],
  );

  /** Moves a photo a place earlier (-1) or later (+1), as the gallery shows it. */
  const moveFile = useCallback(
    (index: number, by: -1 | 1) => {
      const files = getValues("mediaFiles") ?? [];
      const ids = files.map((_, i) => getValues("mediaFileIds")?.[i] ?? null);
      setValue("mediaFiles", moveItem(files, index, by), { shouldValidate: true });
      setValue("mediaFileIds", moveItem(ids, index, by));
    },
    [getValues, setValue],
  );

  /** Sponsors with their logos (and saved logo ids), one entry per sponsor. */
  const sponsorLists = useCallback(() => {
    const names = getValues("sponsorNames") ?? [];
    return {
      names,
      images: names.map((_, i) => getValues("sponsorImages")?.[i] ?? ""),
      ids: names.map((_, i) => getValues("sponsorLogoIds")?.[i] ?? null),
      show: names.map((_, i) => !!getValues("sponsorShowNames")?.[i]),
    };
  }, [getValues]);

  const setSponsorLists = useCallback(
    (lists: {
      names: string[];
      images: (File | string)[];
      ids: (string | null)[];
      show: boolean[];
    }) => {
      setValue("sponsorNames", lists.names, { shouldValidate: true });
      setValue("sponsorImages", lists.images, { shouldValidate: true });
      setValue("sponsorLogoIds", lists.ids);
      setValue("sponsorShowNames", lists.show, { shouldDirty: true });
    },
    [setValue],
  );

  /** Moves a sponsor a place up (-1) or down (+1) the board, logo and all. */
  const moveSponsor = useCallback(
    (index: number, by: -1 | 1) => {
      const { names, images, ids, show } = sponsorLists();
      setSponsorLists({
        names: moveItem(names, index, by),
        images: moveItem(images, index, by),
        ids: moveItem(ids, index, by),
        show: moveItem(show, index, by),
      });
    },
    [setSponsorLists, sponsorLists],
  );

  const addSponsor = useCallback(() => {
    const { names, images, ids, show } = sponsorLists();
    setSponsorLists({
      names: [...names, ""],
      images: [...images, ""],
      ids: [...ids, null],
      show: [...show, false],
    });
  }, [setSponsorLists, sponsorLists]);

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
      const { names, images, ids, show } = sponsorLists();
      images[index] = file;
      // The new logo replaces the one it had.
      ids[index] = null;
      setSponsorLists({ names, images, ids, show });
    },
    [setSponsorLists, sponsorLists],
  );

  const removeSponsor = useCallback(
    (index: number) => {
      const { names, images, ids, show } = sponsorLists();
      const keep = (_: unknown, i: number) => i !== index;
      setSponsorLists({
        names: names.filter(keep),
        images: images.filter(keep),
        ids: ids.filter(keep),
        show: show.filter(keep),
      });
    },
    [setSponsorLists, sponsorLists],
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
    <div className="flex w-full flex-col gap-6 py-4 md:py-6">
      <div className="w-full space-y-4 rounded-2xl border border-secondary-100 bg-white p-5">
        <div>
          <p className="text-sm font-semibold text-secondary-950">
            Event photos and videos
          </p>
          <p className="text-xs leading-5 text-secondary-500">
            Shown in your event&apos;s gallery, in this order. Photos (JPG, PNG
            or WEBP, up to 5MB) and short videos (MP4, MOV or WebM, up to 10MB).
          </p>
        </div>

        <div
          className={cn(
            "grid gap-3",
            hasMediaFiles && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
          )}
        >
          {mediaPreviewUrls.map((previewUrl, index) => (
            <div
              key={`${previewUrl}-${index}`}
              className="relative aspect-video overflow-hidden rounded-xl bg-secondary-100"
            >
              <MediaThumb
                item={{
                  url: previewUrl,
                  type:
                    mediaFiles[index] instanceof File &&
                    (mediaFiles[index] as File).type.startsWith("video/")
                      ? "VIDEO"
                      : null,
                }}
                alt={`Media ${index + 1}`}
              />
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                className="absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow hover:bg-red-50"
                onClick={() => removeFile(index)}
              >
                <X className="size-4" />
              </button>
              <div className="absolute bottom-1.5 left-1.5 z-10 flex gap-1">
                <button
                  type="button"
                  aria-label="Move photo earlier"
                  disabled={index === 0}
                  onClick={() => moveFile(index, -1)}
                  className="flex size-7 items-center justify-center rounded-full bg-white/90 text-secondary-800 shadow disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Move photo later"
                  disabled={index === mediaPreviewUrls.length - 1}
                  onClick={() => moveFile(index, 1)}
                  className="flex size-7 items-center justify-center rounded-full bg-white/90 text-secondary-800 shadow disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              {index === 0 && (
                <span className="absolute top-1.5 left-1.5 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-secondary-800 shadow">
                  First
                </span>
              )}
            </div>
          ))}

          {/* Drop or pick photos: a tile beside the others, or the whole area when empty. */}
          <label
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-secondary-200 text-center text-sm text-secondary-500 hover:bg-secondary-50 hover:text-secondary-950",
              hasMediaFiles ? "aspect-video" : "py-10",
            )}
          >
            <Input
              key={mediaFiles.length}
              type="file"
              accept=".jpg, .png, .webp, .mp4, .mov, .webm"
              multiple
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {hasMediaFiles ? (
              <>
                <PlusIcon className="size-4" />
                <span className="font-medium">Add photos or videos</span>
              </>
            ) : (
              <>
                <UploadIcon className="size-8 text-secondary-700" />
                <span className="font-medium text-secondary-800">
                  Drag photos or videos here, or click to browse
                </span>
                <span className="text-xs">You can add several at once.</span>
              </>
            )}
          </label>
        </div>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
      </div>

      <div className="w-full space-y-4 rounded-2xl border border-secondary-100 bg-white p-5">
        <div>
          <p className="text-sm font-semibold text-secondary-950">Sponsors</p>
          <p className="text-xs leading-5 text-secondary-500">
            Laid out as your event&apos;s sponsor board. Tap a tile to add its
            logo, choose whether the logo or the name shows, and use the arrows
            to change the order.
          </p>
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-secondary-100 sm:grid-cols-3 lg:grid-cols-4">
          {sponsorNames.map((name, index) => (
            <div
              key={`sponsor-${index}`}
              className="group relative flex flex-col items-center gap-1.5 border-r border-b border-secondary-100 px-3 pt-7 pb-2"
            >
              <div className="absolute inset-x-1 top-1 flex items-center justify-between">
                <div className="flex">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveSponsor(index, -1)}
                    aria-label={`Move ${name || "sponsor"} earlier`}
                    className="flex size-6 items-center justify-center rounded-md text-secondary-400 hover:bg-secondary-50 hover:text-secondary-950 disabled:opacity-30"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === sponsorNames.length - 1}
                    onClick={() => moveSponsor(index, 1)}
                    aria-label={`Move ${name || "sponsor"} later`}
                    className="flex size-6 items-center justify-center rounded-md text-secondary-400 hover:bg-secondary-50 hover:text-secondary-950 disabled:opacity-30"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeSponsor(index)}
                  aria-label={`Remove ${name || "sponsor"}`}
                  className="flex size-6 items-center justify-center rounded-md text-secondary-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <label
                className="relative flex h-12 w-full cursor-pointer items-center justify-center rounded-lg hover:bg-secondary-50"
                title={sponsorImagePreviewUrls[index] ? "Change logo" : "Add logo"}
              >
                {sponsorImagePreviewUrls[index] ? (
                  <CustomImageComponent
                    src={sponsorImagePreviewUrls[index]}
                    alt={`${name || "Sponsor"} logo`}
                    fill
                    className="size-full"
                    imageClassName="object-contain"
                  />
                ) : (
                  <span className="flex items-center gap-1 text-xs text-secondary-400">
                    <UploadIcon className="size-3.5" /> Logo
                  </span>
                )}
                <input
                  type="file"
                  accept=".jpg, .png, .webp"
                  className="sr-only"
                  onChange={(event) => {
                    updateSponsorImage(index, event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <input
                value={name}
                onChange={(event) =>
                  updateSponsorName(index, event.target.value)
                }
                placeholder="Sponsor name"
                aria-label="Sponsor name"
                className="w-full rounded-md bg-transparent px-1 py-0.5 text-center text-sm font-semibold text-secondary-700 outline-none placeholder:font-normal placeholder:text-secondary-300 focus:bg-secondary-50"
              />
              {sponsorImagePreviewUrls[index] && (
                <SponsorShowToggle
                  showName={!!sponsorShowNames[index]}
                  onChange={(showName) => {
                    const next = sponsorNames.map((_, i) => !!sponsorShowNames[i]);
                    next[index] = showName;
                    setValue("sponsorShowNames", next, { shouldDirty: true });
                  }}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSponsor}
            className="flex min-h-[6.5rem] flex-col items-center justify-center gap-1 border-r border-b border-dashed border-secondary-200 text-sm font-medium text-secondary-500 hover:bg-secondary-50 hover:text-secondary-950"
          >
            <PlusIcon className="size-4" />
            {sponsorNames.length ? "Add sponsor" : "Add your first sponsor"}
          </button>
        </div>
      </div>

      <div className="flex w-full flex-row items-center justify-start gap-3">
        <Button
          onClick={handlePreviousStep}
          disabled={isSaving}
          variant="outline"
          className="border-secondary-700 text-secondary-700"
        >
          Previous
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          loading={isSubmitting || isSaving}
          disabled={!!errors?.mediaFiles || isSubmitting || isSaving}
        >
          {isSaving ? "Saving draft..." : "Continue"}
        </Button>
      </div>
    </div>
  );
};

export default memo(MediaUploadForm);
