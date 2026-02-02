"use client";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { joiResolver } from "@hookform/resolvers/joi";
import { useForm } from "react-hook-form";
import React, { memo, useCallback } from "react";

export const dynamic = "force-dynamic";
import joi from "joi";
import { toast } from "sonner";
import { getData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { IUserCheckedCredentials, OTP_VERIFICATION_TYPE } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/variables";

interface IFormValues {
  email: string;
}

interface IResponse {
  message: string;
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
    async (body: IFormValues) => {
      try {
        const { data } = await getData<IUserCheckedCredentials>(
          `/auth?email=${body.email}`
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
          `${ROUTES.OTP.href}?email=${body.email}&type=${OTP_VERIFICATION_TYPE.FORGOT_PASSWORD}`
        );
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Something went wrong while sending the reset email"
          )
        );
      }
    },
    [push]
  );
  return (
    <SectionContainer className="flex flex-col items-center justify-center min-h-full py-10 md:py-16">
      <div className="flex flex-col items-center justify-center w-full max-w-sm gap-10">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-[clamp(1.1rem,2vw,2rem)] font-bold text-secondary-900">
            Forgot Password 🔒
          </h1>
          <p className="opacity-60 max-w-xs">
            Don&apos;t fret! Your account is just a few steps away. Just enter
            your email and we will send you a password reset email.
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 w-full max-w-sm"
        >
          <InputField
            inputClassName="bg-black/10"
            placeholder="name@example.com"
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Button
            disabled={!isValid}
            loading={isSubmitting}
            className="w-full"
            type="submit"
          >
            Send Reset email
          </Button>
        </form>
      </div>
    </SectionContainer>
  );
};

export default memo(ForgotPasswordPage);
