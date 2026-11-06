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
import { toast } from "@/lib/toast";
import { TUserDetails } from "@/stores/user-store";
import useAuth from "@/hooks/use-auth";
import { INTENT_PARAM, intentFrom } from "@/lib/auth-intent";
import { completeProfileRoute } from "@/lib/profile-complete";
import { isStrongPassword, PASSWORD_HINT } from "@/lib/password";
import PasswordRules from "./password-rules";

interface IFormValues {
  password: string;
  confirmPassword: string;
}

const schema = joi.object({
  // The api's rule, so a weak one is caught here rather than after sending.
  password: joi
    .string()
    .required()
    .custom((value: string, helpers) =>
      isStrongPassword(value) ? value : helpers.error("password.weak"),
    )
    .messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
      "password.weak": PASSWORD_HINT,
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
    watch,
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
  const intent = intentFrom(searchParams?.get(INTENT_PARAM));
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
        router.push(completeProfileRoute(redirectTo, intent));
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Something went wrong while verifying your password",
          ),
        );
      }
    },
    [token, email, performAuthOperation, router, redirectTo, intent],
  );
  return (
    <div className="flex w-full flex-col gap-7">
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">
          {intent === "vendor" ? "Organiser sign-up" : "Sign up"} · Step 1 of{" "}
          {intent === "vendor" ? 3 : 2}
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
        <div className="space-y-3">
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
          <PasswordRules value={watch("password") ?? ""} />
        </div>
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
          className="h-12 w-full rounded-full bg-secondary text-base text-white hover:bg-secondary-600"
          type="submit"
        >
          Continue
        </Button>
      </form>
    </div>
  );
};

export default memo(RegisterTokenForm);
