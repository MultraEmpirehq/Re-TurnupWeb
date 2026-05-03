import { Button } from "@/components/ui/button";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Joi from "joi";
import { TrashIcon, UploadIcon } from "lucide-react";
import React, { memo, useCallback, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { toast } from "sonner";

export interface ICoverFormValues {
  coverImage: File | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export const coverFormSchema = Joi.object({
  coverImage: Joi.any()
    .required()
    .custom((value, helpers) => {
      if (value == null) {
        return helpers.error("any.required");
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
    })
    .messages({
      "any.required": "Please select a cover image",
    }),
}).unknown(true);
const CoverForm: React.FC<{
  handleNextStep: () => Promise<void>;
  handlePreviousStep?: () => void;
}> = ({ handleNextStep, handlePreviousStep }) => {
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ICoverFormValues>();
  const errorMessage = useMemo(() => {
    if (errors?.coverImage) {
      return errors?.coverImage?.message;
    }
    return null;
  }, [errors]);
  console.log(errors);
  const coverImage = watch("coverImage");
  const onSubmit = useCallback(() => {
    handleNextStep?.();
  }, [handleNextStep]);
  return (
    <div className="gap-3 flex flex-col items-center justify-center w-full py-10 md:py-20">
      <div
        className={cn(
          "border border-dashed flex flex-col gap-3 items-center justify-center w-full max-w-[500px] rounded-xl relative overflow-hidden",
          !coverImage && "py-8 px-6 md:py-10 md:px-14",
          coverImage && "p-4 md:p-5",
        )}
      >
        <Controller
          control={control}
          name="coverImage"
          render={({ field }) => (
            <Input
              key={coverImage ? "has-file" : "no-file"}
              type="file"
              accept=".jpg, .png, .webp"
              ref={field.ref}
              name={field.name}
              onBlur={field.onBlur}
              onChange={(e) => {
                const file = e?.target?.files?.[0];
                if (!file) {
                  field.onChange(null);
                  setValue("coverImage", null, { shouldValidate: true });
                  return toast.error("Please select a file");
                }
                if (file.size > MAX_FILE_SIZE) {
                  field.onChange(null);
                  setValue("coverImage", null, { shouldValidate: true });
                  return toast.error("File size must be less than 5MB");
                }
                if (!file.type.includes("image")) {
                  field.onChange(null);
                  setValue("coverImage", null, { shouldValidate: true });
                  return toast.error("Please select an image file");
                }
                field.onChange(file);
                setValue("coverImage", file, { shouldValidate: true });
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          )}
        />
        {!coverImage && (
          <>
            <UploadIcon className="size-10 text-secondary-700" />
            <p>Drag your file to start uploading</p>
            <div className="flex flex-row items-center w-full gap-3 max-w-[200px]">
              <Separator className="flex-1" />
              <p className="text-sm opacity-60">OR</p>
              <Separator className="flex-1" />
            </div>
            <Button
              variant="outline"
              className="border-secondary-700 text-secondary-700"
            >
              Browse Files
            </Button>
          </>
        )}
        {coverImage && (
          <div className="w-full aspect-video relative">
            <CustomImageComponent
              src={URL.createObjectURL(coverImage)}
              alt="Cover Image"
              className="size-full"
              fill
              imageClassName="object-cover object-center"
            />
            <button
              type="button"
              title="Remove Image"
              className="size-full opacity-0 hover:opacity-100 transition-all duration-300 z-10 absolute top-0 left-0 flex items-center justify-center text-red-500 bg-white/30 cursor-pointer"
              onClick={() => {
                setValue("coverImage", null, { shouldValidate: true });
              }}
            >
              <TrashIcon className="size-8 text-red-500" />
            </button>
          </div>
        )}
      </div>
      {!errorMessage && (
        <p className="text-sm max-w-[500px] w-full text-secondary-700">
          Only support .jpg, .png files{" "}
        </p>
      )}
      {errorMessage && (
        <p className="text-sm max-w-[500px] w-full text-destructive">
          {errorMessage}
        </p>
      )}
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
          disabled={!coverImage || !!errors?.coverImage}
          className=""
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default memo(CoverForm);
