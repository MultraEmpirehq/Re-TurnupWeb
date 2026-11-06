"use client";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { joiResolver } from "@hookform/resolvers/joi";
import { useForm } from "react-hook-form";
import React, { memo, useCallback } from "react";
import joi from "joi";
import { toast } from "@/lib/toast";
import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { IUserCheckedCredentials, OTP_VERIFICATION_TYPE } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/variables";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface IFormValues {
  email: string;
}

const schema = joi.object({
  email: joi.string().email().required().messages({
    "string.email": "Invalid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
});

const defaultValues: IFormValues = {
  email: "",
};

const ForgotPasswordPage = () => {
  const { push } = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IFormValues>({
    resolver: joiResolver(schema),
    defaultValues,
    mode: "onChange",
  });
  const onSubmit = useCallback(
    async (values: IFormValues) => {
      const body = { ...values, email: values.email.trim().toLowerCase() };
      try {
        const { data } = await getData<IUserCheckedCredentials>(
          `/auth?email=${body.email}`,
        );
        if (!data?.data?.exists) {
          toast.error("An account with this email does not exist");
          return;
        }
        if (!data?.data?.isAccountCreationCompleted) {
          toast.info("Please complete your account creation first");
          push(`${ROUTES.LOGIN.href}?email=${body.email}`);
          return;
        }
        push(
          `${ROUTES.OTP.href}?email=${body.email}&type=${OTP_VERIFICATION_TYPE.FORGOT_PASSWORD}`,
        );
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Something went wrong while sending the reset email",
          ),
        );
      }
    },
    [push],
  );
  return (
    <div className="flex w-full flex-col gap-7">
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">
          Forgot password
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-secondary-950">
          Let&apos;s get you back in
        </h1>
        <p className="text-secondary-950/60">
          Enter your email and we&apos;ll send you a code to reset your
          password.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
        <InputField
          label="Email"
          labelClassName="text-secondary-950"
          inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
          placeholder="name@example.com"
          type="email"
          autoComplete="email"
          autoFocus
          {...register("email")}
          error={errors.email?.message}
        />
        <Button
          disabled={!isValid}
          loading={isSubmitting}
          className="h-12 w-full rounded-full bg-secondary text-base text-white hover:bg-secondary-600"
          type="submit"
        >
          Send reset code
        </Button>
      </form>
      <p className="text-center text-sm text-secondary-950/60">
        Remembered it?{" "}
        <Link
          href={ROUTES.LOGIN.href}
          className="font-semibold text-primary hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
};

export default memo(ForgotPasswordPage);
