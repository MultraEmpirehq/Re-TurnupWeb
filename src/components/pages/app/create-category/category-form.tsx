"use client";

import React, { memo } from "react";
import Joi from "joi";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";

export interface ICategoryFormValues {
  name: string;
}

export const categoryFormSchema = Joi.object({
  name: Joi.string().trim().min(2).required().messages({
    "string.empty": "Category name is required",
    "string.min": "Category name must be at least 2 characters",
    "any.required": "Category name is required",
  }),
}).unknown(true);

const CategoryForm: React.FC<{
  onSubmit: () => Promise<void>;
}> = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useFormContext<ICategoryFormValues>();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 md:space-y-10 max-w-[600px]"
    >
      <InputField
        label="Category Name"
        required
        placeholder="e.g. Technology"
        error={errors?.name?.message}
        {...register("name")}
      />
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        loading={isSubmitting}
      >
        Create Category
      </Button>
    </form>
  );
};

export default memo(CategoryForm);
