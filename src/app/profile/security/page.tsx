"use client";

import { patchData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import React, { memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface IPasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const schema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required",
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(8).required().messages({
    "string.empty": "New password is required",
    "string.min": "Password must be at least 8 characters",
    "any.required": "New password is required",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "string.empty": "Please confirm your new password",
      "any.required": "Please confirm your new password",
      "any.only": "Passwords do not match",
    }),
});

const defaultValues: IPasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const SecurityPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IPasswordFormValues>({
    resolver: joiResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = useCallback(
    async (body: IPasswordFormValues) => {
      try {
        await patchData<{ oldPassword: string; password: string }, void>(
          "/user/password",
          {
            oldPassword: body.currentPassword,
            password: body.newPassword,
          },
        );
        toast.success("Password changed successfully");
        reset();
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Failed to change password. Please check your current password.",
          ),
        );
      }
    },
    [reset],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Change Password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Update your password to keep your account secure.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border rounded-xl p-6 space-y-5 max-w-md"
      >
        <InputField
          label="Current Password"
          placeholder="Enter your current password"
          type="password"
          {...register("currentPassword")}
          error={errors.currentPassword?.message}
        />
        <InputField
          label="New Password"
          placeholder="Enter a new password"
          type="password"
          {...register("newPassword")}
          error={errors.newPassword?.message}
        />
        <InputField
          label="Confirm New Password"
          placeholder="Confirm your new password"
          type="password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
        <Button
          type="submit"
          disabled={!isValid}
          loading={isSubmitting}
          className="w-full"
        >
          Update Password
        </Button>
      </form>
    </div>
  );
};

export default memo(SecurityPage);
