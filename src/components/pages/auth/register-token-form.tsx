"use client";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { memo, useCallback } from "react";
import joi from "joi";
import { joiResolver } from "@hookform/resolvers/joi";
import { useForm } from "react-hook-form";
import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { toast } from "sonner";
import { TUserDetails } from "@/stores/user-store";
import useAuth from "@/hooks/use-auth";
import { ROUTES } from "@/lib/variables";

interface IFormValues {
  password: string;
  confirmPassword: string;
}

const schema = joi.object({
  password: joi.string().required().min(8).messages({
    "string.min": "Password must be at least 8 characters long",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
  confirmPassword: joi.string().required().valid(joi.ref("password")).messages({
    "string.empty": "Confirm password is required",
    "any.required": "Confirm password is required",
    "any.only": "Passwords do not match",
  }),
});

const defaultValues: IFormValues = {
  password: "",
  confirmPassword: "",
};

const RegisterTokenForm = () => {
  const router = useRouter();
  const { performAuthOperation } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IFormValues>({
    resolver: joiResolver(schema),
    defaultValues,
    mode: "onChange",
  });
  const params = useParams();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email");
  const redirectTo = searchParams?.get("redirect");
  const { token } = params;

  const onSubmit = useCallback(
    async (body: IFormValues) => {
      if (!token || !email) {
        toast.error("Invalid token or email");
        return;
      }
      try {
        const { data } = await postData<
          { password: string; token: string; email: string },
          { user: TUserDetails }
        >("/auth/register/verify", {
          password: body?.password,
          token: token?.toString(),
          email: email?.toString(),
        });
        await performAuthOperation(data?.data?.user);
        toast.success("Account created successfully");
        const completeUrl = redirectTo
          ? `${ROUTES.COMPLETE_USER_INFORMATION.href}?redirect=${encodeURIComponent(redirectTo)}`
          : ROUTES.COMPLETE_USER_INFORMATION.href;
        router.push(completeUrl);
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Something went wrong while verifying your password",
          ),
        );
      }
    },
    [token, email, performAuthOperation, router, redirectTo],
  );
  return (
    <SectionContainer className="flex flex-col items-center justify-center min-h-full py-10 md:py-16">
      <div className="flex flex-col items-center justify-center w-full max-w-sm gap-10">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-[clamp(1.1rem,1.5vw,1.5rem)] font-bold text-secondary-900">
            Continue Account Creation
          </h1>
          <p className="opacity-60 max-w-xs">
            Complete your account creation by creating a password to secure your
            account.
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 w-full max-w-sm"
        >
          <InputField
            inputClassName="bg-black/10"
            placeholder="Enter your password"
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />
          <InputField
            inputClassName="bg-black/10"
            placeholder="Confirm your password"
            type="password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
          <Button
            disabled={!isValid}
            loading={isSubmitting}
            className="w-full"
            type="submit"
          >
            Continue
          </Button>
        </form>
      </div>
    </SectionContainer>
  );
};

export default memo(RegisterTokenForm);
