"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { LogoWhiteSVG } from "@/assets/svg";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import useAuth from "@/hooks/use-auth";
import { ROUTES } from "@/lib/variables";
import useUserStore, { TUserDetails } from "@/stores/user-store";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { memo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type TAdminLoginValues = { email: string; password: string };
type TAdminLoginResponse = {
  user: TUserDetails;
  token?: string;
  accessToken?: string;
  authToken?: string;
};

const schema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Enter a valid email",
    }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

/**
 * The admin console's own door: email and password only, no Google, no sign-up.
 * The API turns away anyone who isn't an admin with a plain "Invalid credentials".
 */
const AdminLoginForm = () => {
  const router = useRouter();
  const { performAuthOperation } = useAuth();
  const setUserToken = useUserStore((state) => state.setUserToken);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TAdminLoginValues>({
    resolver: joiResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: TAdminLoginValues) => {
    try {
      const { data } = await postData<TAdminLoginValues, TAdminLoginResponse>(
        "/auth/admin/login",
        { email: values.email.trim().toLowerCase(), password: values.password },
      );
      const payload = data?.data;
      const token =
        payload?.token || payload?.accessToken || payload?.authToken;
      if (token) setUserToken(token.replace(/^Bearer\s+/i, ""));
      await performAuthOperation(payload?.user);
      // A temporary password is changed first (the console sends them there too).
      router.push(
        payload?.user?.mustChangePassword
          ? `${ROUTES.ADMIN_OVERVIEW.href}/change-password`
          : ROUTES.ADMIN_OVERVIEW.href,
      );
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't sign you in.",
        ),
      );
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-secondary-950 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center text-white">
          <Image src={LogoWhiteSVG} alt="Turnupz" className="h-8 w-auto" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            <ShieldCheck className="size-3.5" aria-hidden />
            Admin console
          </span>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5 rounded-2xl bg-white p-6 shadow-xl"
        >
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-secondary-950">Sign in</h1>
            <p className="text-sm text-secondary-500">
              For Turnupz staff only.
            </p>
          </div>
          <InputField
            label="Email"
            type="email"
            autoComplete="username"
            placeholder="you@turnupz.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <InputField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Sign in
          </Button>
          <p className="text-center text-xs text-secondary-500">
            <Link
              href="/auth/forgot-password"
              className="font-medium underline-offset-2 hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
};

export default memo(AdminLoginForm);
