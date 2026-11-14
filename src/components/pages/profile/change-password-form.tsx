"use client";

import TwoFactorSection from "@/components/account/two-factor-section";

import { patchData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import React, { memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/lib/toast";
import StatusBadge from "@/components/ui/status-badge";
import useUserStore from "@/stores/user-store";
import { BadgeCheck, CircleAlert, Mail } from "lucide-react";

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

  const email = useUserStore((state) => state.userDetails?.email);
  const emailVerified = useUserStore((state) => state.userDetails?.isEmailVerified);

  return (
    <section
      id="security"
      aria-labelledby="security-title"
      className="scroll-mt-24 space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="space-y-1">
        <h2 id="security-title" className="text-lg font-bold text-foreground">
          Sign-in and security
        </h2>
        <p className="text-sm text-muted-foreground">
          The email you sign in with, your password, and a code from your phone at sign-in.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted px-3.5 py-3">
        <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold text-foreground">{email ?? "No email"}</p>
          {emailVerified === false ? (
            <StatusBadge tone="warning" icon={CircleAlert}>Not verified yet</StatusBadge>
          ) : (
            <StatusBadge tone="success" icon={BadgeCheck}>Verified · used to sign in</StatusBadge>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-foreground">Password</h3>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-5 md:grid-cols-2"
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
            className="rounded-xl"
          >
            Update password
          </Button>
        </div>
      </form>

      <div className="border-t border-border pt-5">
        <TwoFactorSection />
      </div>
    </section>
  );
};

export default memo(ChangePasswordForm);
