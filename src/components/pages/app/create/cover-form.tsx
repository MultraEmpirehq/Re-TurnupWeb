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

export const coverFormSchema = Joi.object({
  coverImage: Joi.object({
    name: Joi.string().required(),
    size: Joi.number().max(MAX_FILE_SIZE).required(),
    type: Joi.string()
      .valid("image/jpeg", "image/png", "image/webp", "image/jpg")
      .required(),
  })
    .required()
    .unknown(true),
});
const CoverForm: React.FC<{ handleNextStep: () => void }> = ({
  handleNextStep,
}) => {
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isValid, errors },
  } = useFormContext<ICoverFormValues>();
  const errorMessage = useMemo(() => {
    if (errors?.coverImage) {
      return errors?.coverImage?.message;
    }
    return null;
  }, [errors]);
  const coverImage = watch("coverImage");
  console.log(coverImage);
  const onSubmit = useCallback(() => {
    handleNextStep?.();
  }, [handleNextStep]);
  return (
    <div className="gap-3 flex flex-col items-center justify-center w-full py-20">
      <div
        className={cn(
          "border border-dashed flex flex-col gap-3 items-center justify-center w-full max-w-[500px] rounded-xl relative overflow-hidden",
          !coverImage && "py-10 px-14",
          coverImage && " p-5"
        )}
      >
        <Controller
          control={control}
          name="coverImage"
          render={({ field }) => (
            <Input
              type="file"
              accept=".jpg, .png"
              onChange={(e) => {
                const file = e?.target?.files?.[0];
                if (!file) {
                  return toast.error("Please select a file");
                }
                if (file?.size > MAX_FILE_SIZE) {
                  return toast.error("File size must be less than 5MB");
                }
                if (!file?.type.includes("image")) {
                  return toast.error("Please select an image file");
                }
                return field.onChange(file);
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
                setValue("coverImage", null);
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
      <div className="w-full max-w-[500px] mt-10">
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid}
          className=""
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default memo(CoverForm);
