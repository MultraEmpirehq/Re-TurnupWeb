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

/** The password section of the dashboard profile, linked to as `#security`. */
const ChangePasswordForm = () => {
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
    <section
      id="security"
      className="scroll-mt-24 rounded-[1.75rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8"
    >
      <p className="text-xs font-bold tracking-[0.2em] text-secondary-400 uppercase">
        Security
      </p>
      <h2 className="mt-2 text-2xl font-bold text-secondary-950">
        Change password
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-secondary-500">
        Update your password to keep your account secure.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        <InputField
          label="Current Password"
          placeholder="Enter your current password"
          type="password"
          containerClassName="md:col-span-2 md:max-w-[calc(50%-0.625rem)]"
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
        <div className="md:col-span-2">
          <Button
            type="submit"
            disabled={!isValid}
            loading={isSubmitting}
            className="h-11 rounded-2xl bg-secondary-400 px-5 font-semibold text-white hover:bg-secondary-500"
          >
            Update password
          </Button>
        </div>
      </form>
    </section>
  );
};

export default memo(ChangePasswordForm);
