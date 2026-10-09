"use client";
import { resolveLandingRoute } from "@/lib/auth-landing";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import joi from "joi";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { getData, postData } from "@/api";
import { Separator } from "@/components/ui/separator";
import MagicLinkModal from "@/components/pages/auth/magic-link-modal";
import { toast } from "sonner";
import { constructErrorMessage } from "@/api/functions";
import useAuth from "@/hooks/use-auth";
import useSocialAuth, {
  GOOGLE_SCRIPT_SRC,
  ISocialAuthResponse,
} from "@/hooks/use-social-auth";
import useUserStore, { TUserDetails } from "@/stores/user-store";
import { IUserCheckedCredentials, OTP_VERIFICATION_TYPE } from "@/lib/types";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/variables";
import Script from "next/script";
import Link from "next/link";
import { Mail } from "lucide-react";

interface IFormValues {
  email: string;
  password: string;
}

interface IAuthResponse {
  user: TUserDetails;
  token?: string;
  accessToken?: string;
  authToken?: string;
}

const checkAccountSchema = joi
  .object({
    email: joi.string().email().required().messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
  })
  .required();

const loginSchema = joi.object({
  email: joi.string().email().required().messages({
    "string.email": "Invalid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

const checkAccountDefaultValues: Omit<IFormValues, "password"> = {
  email: "",
};

const loginDefaultValues: IFormValues = {
  email: "",
  password: "",
};

const AuthForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect");
  const { performAuthOperation } = useAuth();
  const setUserToken = useUserStore((state) => state.setUserToken);
  const [magicLinkEmail, setMagicLinkEmail] = useState<string | null>(null);
  const [checkedCredentials, setCheckedCredentials] =
    useState<IUserCheckedCredentials | null>(null);
  const params = useParams();
  const email = useMemo(() => {
    const emailParam = params?.email;
    return Array.isArray(emailParam) ? emailParam[0] : emailParam;
  }, [params.email]);
  const shouldShowLoginForm = useMemo(() => {
    return (
      checkedCredentials?.exists &&
      checkedCredentials?.isAccountCreationCompleted
    );
  }, [checkedCredentials]);
  // An account made with Google has no password, so asking for one is a dead end.
  const isPasswordless =
    !!shouldShowLoginForm && !!checkedCredentials?.shouldRequestPassword;

  const schema = useMemo(() => {
    return shouldShowLoginForm ? loginSchema : checkAccountSchema;
  }, [shouldShowLoginForm]);
  const defaultValues = useMemo(() => {
    return shouldShowLoginForm ? loginDefaultValues : checkAccountDefaultValues;
  }, [shouldShowLoginForm]);
  const {
    register,
    handleSubmit,
    resetField,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IFormValues>({
    resolver: joiResolver(schema),
    defaultValues,
    mode: "onChange",
  });
  useEffect(() => {
    if (email) {
      resetField("email", { defaultValue: email });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const handleAuthSuccess = useCallback(
    async (authPayload?: IAuthResponse | ISocialAuthResponse) => {
      const payload = authPayload as IAuthResponse | undefined;
      const authToken =
        payload?.token || payload?.accessToken || payload?.authToken;
      if (authToken) {
        setUserToken(authToken.replace(/^Bearer\s+/i, ""));
      }
      await performAuthOperation(payload?.user);

      if (payload?.user && payload.user.isAccountCreationCompleted === false) {
        const completeUrl = redirectTo
          ? `${ROUTES.COMPLETE_USER_INFORMATION.href}?redirect=${encodeURIComponent(redirectTo)}`
          : ROUTES.COMPLETE_USER_INFORMATION.href;
        router.push(completeUrl);
        return;
      }

      router.push(await resolveLandingRoute(payload?.user, redirectTo));
    },
    [performAuthOperation, redirectTo, router, setUserToken],
  );

  const handleAuthError = useCallback((error: unknown) => {
    toast.error(
      constructErrorMessage(
        error as TApiErrorResponseType,
        "Something went wrong while accessing your account!",
      ),
    );
  }, []);

  const {
    googleButtonRef,
    isGoogleConfigured,
    isSubmitting: isSocialSubmitting,
    onGoogleScriptReady,
  } = useSocialAuth({
    onSuccess: handleAuthSuccess,
    onError: handleAuthError,
  });

  const isBusy = isSubmitting || isSocialSubmitting;

  const onSubmit = useCallback(
    async (values: IFormValues) => {
      // Emails are case-insensitive, so send one spelling or the same person can
      // end up looked up (or registered) as a different account.
      const body = { ...values, email: values.email.trim().toLowerCase() };
      try {
        if (!checkedCredentials) {
          const { data } = await getData<IUserCheckedCredentials>(
            `/auth?email=${body.email}`,
          );
          const credentials = data?.data;
          if (
            !credentials?.exists ||
            !credentials?.isAccountCreationCompleted ||
            !credentials?.isEmailVerified
          ) {
            const registerUrl = new URL(
              `${window.location.origin}/auth/register/{{token}}?email=${body.email}`,
            );
            if (redirectTo) {
              registerUrl.searchParams.set("redirect", redirectTo);
            }
            await postData("/auth/register", {
              email: body.email,
              url: decodeURIComponent(registerUrl.toString()),
            });
            setMagicLinkEmail(body?.email);
            return;
          }
          setCheckedCredentials(credentials);
          return;
        }
        const { data } = await postData<IFormValues, IAuthResponse>(
          "/auth/login",
          body,
        );
        await handleAuthSuccess(data?.data);
      } catch (error) {
        handleAuthError(error);
      }
    },
    [checkedCredentials, redirectTo, handleAuthSuccess, handleAuthError],
  );

  return (
    <>
      {isGoogleConfigured && (
        <Script
          src={GOOGLE_SCRIPT_SRC}
          strategy="afterInteractive"
          onReady={onGoogleScriptReady}
        />
      )}
      <div className="flex w-full flex-col gap-7">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wider text-primary uppercase">
            {shouldShowLoginForm ? "Log in" : "Log in or sign up"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-secondary-950">
            {shouldShowLoginForm ? "Welcome back" : "Let's get you in"}
          </h1>
          <p className="text-secondary-950/60">
            {isPasswordless
              ? "This account was created with Google, so it doesn't have a password yet."
              : shouldShowLoginForm
                ? "Enter your password to carry on where you left off."
                : "Enter your email. We'll log you in, or send a link to set up your account if you're new."}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
          {shouldShowLoginForm ? (
            // The email is settled by now, so it shows as a chip that can be changed.
            <div className="flex items-center gap-3 rounded-2xl bg-[#f7f9fc] px-4 py-3 ring-1 ring-secondary-100">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-secondary-800 ring-1 ring-secondary-100">
                <Mail className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-secondary-950">
                {getValues("email")?.trim().toLowerCase()}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCheckedCredentials(null);
                  resetField("password");
                }}
                className="shrink-0 text-sm font-semibold text-primary hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
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
          )}
          {isPasswordless && (
            <div className="space-y-3 rounded-2xl bg-secondary-50/60 p-4 text-sm text-secondary-950/70">
              <p>
                {isGoogleConfigured
                  ? "Use Continue with Google below, or set a password to sign in with your email from now on."
                  : "Set a password to sign in with your email from now on."}
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full border-secondary-200 bg-white"
                onClick={() =>
                  router.push(
                    `${ROUTES.OTP.href}?email=${encodeURIComponent(
                      getValues("email")?.trim().toLowerCase() ?? "",
                    )}&type=${OTP_VERIFICATION_TYPE.FORGOT_PASSWORD}`,
                  )
                }
              >
                Email me a code to set a password
              </Button>
            </div>
          )}
          {shouldShowLoginForm && !isPasswordless && (
            <div className="space-y-2">
              <InputField
                label="Password"
                labelClassName="text-secondary-950"
                inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
                placeholder="Enter your password"
                type="password"
                autoComplete="current-password"
                autoFocus
                {...register("password")}
                error={errors.password?.message}
              />
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-secondary-950/60 hover:text-secondary-950 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          )}
          {!isPasswordless && (
            <Button
              disabled={!isValid || isBusy}
              loading={isSubmitting}
              type="submit"
              className="h-12 w-full rounded-full bg-secondary text-base text-white hover:bg-secondary-600"
            >
              {shouldShowLoginForm ? "Log in" : "Continue with email"}
            </Button>
          )}
        </form>

        {isGoogleConfigured && (
          <>
            <div className="flex w-full flex-row items-center gap-3">
              <Separator className="flex-1" />
              <p className="text-xs font-medium tracking-wider text-secondary-950/45 uppercase">
                or
              </p>
              <Separator className="flex-1" />
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-3">
              {isGoogleConfigured && (
                <div
                  ref={googleButtonRef}
                  className="flex min-h-10 w-full justify-center"
                  aria-busy={isSocialSubmitting}
                />
              )}
            </div>
          </>
        )}

        <p className="text-center text-xs leading-5 text-secondary-950/50">
          By continuing you agree to the Turnupz{" "}
          <Link
            href="/terms"
            className="font-medium text-secondary-950/70 underline-offset-2 hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="font-medium text-secondary-950/70 underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
      <MagicLinkModal
        open={!!magicLinkEmail}
        setOpen={() => setMagicLinkEmail(null)}
        email={magicLinkEmail || ""}
      />
    </>
  );
};

export default memo(AuthForm);
