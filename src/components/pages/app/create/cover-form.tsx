import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Joi from "joi";
import { UploadIcon } from "lucide-react";
import React, { memo, useCallback, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { toast } from "sonner";

export interface ICoverFormValues {
  coverImage: File;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const coverFormSchema = Joi.object({
  coverImage: Joi.object({
    name: Joi.string().required(),
    size: Joi.number().max(MAX_FILE_SIZE).required(),
    type: Joi.string()
      .valid("image/jpeg", "image/png", "image/webp", "image/jpg")
      .required(),

    lastModified: Joi.number().required(),
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
    formState: { isValid, errors },
  } = useFormContext<ICoverFormValues>();
  const errorMessage = useMemo(() => {
    if (errors?.coverImage) {
      return errors?.coverImage?.message;
    }
    return null;
  }, [errors]);
  const onSubmit = useCallback(() => {
    handleNextStep?.();
  }, [handleNextStep]);
  return (
    <div className="gap-3 flex flex-col items-center justify-center w-full py-20">
      <div className="border border-dashed flex flex-col gap-3 items-center justify-center w-full max-w-[500px] py-10 px-14 rounded-xl relative overflow-hidden">
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
