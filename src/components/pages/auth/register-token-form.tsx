"use client";
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
    <div className="flex w-full flex-col gap-7">
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">
          Sign up · Step 1 of 2
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-secondary-950">
          Create a password
        </h1>
        <p className="text-secondary-950/60">
          {email ? (
            <>
              You&apos;ll use it with{" "}
              <span className="font-medium text-secondary-950">{email}</span> to
              log in.
            </>
          ) : (
            "You'll use it with your email to log in."
          )}
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
        <InputField
          label="Password"
          labelClassName="text-secondary-950"
          inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
          placeholder="At least 8 characters"
          type="password"
          autoComplete="new-password"
          autoFocus
          {...register("password")}
          error={errors.password?.message}
        />
        <InputField
          label="Confirm password"
          labelClassName="text-secondary-950"
          inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
          placeholder="Type it again"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
        <Button
          disabled={!isValid}
          loading={isSubmitting}
          className="h-12 w-full rounded-full bg-secondary-950 text-base text-white hover:bg-secondary-900"
          type="submit"
        >
          Continue
        </Button>
      </form>
    </div>
  );
};

export default memo(RegisterTokenForm);
