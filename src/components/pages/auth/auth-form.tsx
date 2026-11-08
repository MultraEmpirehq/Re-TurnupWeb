"use client";
import { INTENT_PARAM, TAuthIntent } from "@/lib/auth-intent";
import { resolveLandingRoute } from "@/lib/auth-landing";
import { completeProfileRoute } from "@/lib/profile-complete";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import joi from "joi";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { postData, WEB_CLIENT_HEADERS } from "@/api";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { constructErrorMessage } from "@/api/functions";
import useAuth from "@/hooks/use-auth";
import useSocialAuth, {
  GOOGLE_SCRIPT_SRC,
  ISocialAuthResponse,
} from "@/hooks/use-social-auth";
import useUserStore, { TUserDetails } from "@/stores/user-store";
import { OTP_VERIFICATION_TYPE } from "@/lib/types";
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

interface ICodeSent {
  token: string;
  expiresAt: string;
}

type TMode = "login" | "signup";

/** A code is on its way: for logging in, or for creating an account. */
type TCodeStep = { purpose: TMode; email: string; token: string };

const emailRule = joi.string().email({ tlds: false }).required().messages({
  "string.email": "Enter a valid email address",
  "string.empty": "Email is required",
  "any.required": "Email is required",
});

const loginSchema = joi.object({
  email: emailRule,
  password: joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

const signupSchema = joi.object({ email: emailRule }).unknown(true);

/** How long before another code can be asked for. */
const RESEND_AFTER_SECONDS = 30;

// The words for each door; the forms are the same.
const COPY: Record<
  TAuthIntent,
  {
    eyebrow: string;
    title: Record<TMode, string>;
    intro: Record<TMode, string>;
    other: { prompt: string; label: string; href: string };
  }
> = {
  attendee: {
    eyebrow: "Welcome to Turnupz",
    title: { login: "Welcome back", signup: "Create your account" },
    intro: {
      login: "",
      signup: "Enter your email and we'll send you a code to get started.",
    },
    other: {
      prompt: "Hosting events?",
      label: "Organiser sign-in",
      href: ROUTES.VENDOR_LOGIN.href,
    },
  },
  vendor: {
    eyebrow: "For organisers",
    title: { login: "Organiser log in", signup: "Host on Turnupz" },
    intro: {
      login: "",
      signup:
        "Enter your email and we'll send you a code. Then tell us about your business and start selling tickets.",
    },
    other: {
      prompt: "Just going to events?",
      label: "Attendee sign-in",
      href: ROUTES.ATTENDEE_LOGIN.href,
    },
  },
};

const errorMessage = (error: unknown, fallback: string) =>
  constructErrorMessage(error as TApiErrorResponseType, fallback);

/** Six digits, from the email. Fills itself in from the phone's suggestion. */
const CodeStep = memo(function CodeStep({
  step,
  onVerify,
  onResend,
  onBack,
}: {
  step: TCodeStep;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [wait, setWait] = useState(RESEND_AFTER_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const verify = useCallback(
    async (value: string) => {
      if (value.length !== 6 || verifying) return;
      setVerifying(true);
      setError(undefined);
      try {
        await onVerify(value);
      } catch (cause) {
        setError(
          errorMessage(cause, "That code didn't work. Check it, or ask for a new one."),
        );
        setCode("");
      } finally {
        setVerifying(false);
      }
    },
    [onVerify, verifying],
  );

  return (
    <form
      className="w-full space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void verify(code);
      }}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-[#f7f9fc] px-4 py-3 ring-1 ring-secondary-100">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-secondary-800 ring-1 ring-secondary-100">
          <Mail className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-secondary-950">
          {step.email}
        </span>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 text-sm font-semibold text-primary hover:underline"
        >
          Change
        </button>
      </div>
      <InputField
        label="6-digit code"
        labelClassName="text-secondary-950"
        inputClassName="h-14 rounded-xl bg-[#f7f9fc] text-center text-2xl tracking-[0.5em]"
        placeholder="••••••"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        value={code}
        error={error}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
          setCode(digits);
          setError(undefined);
          if (digits.length === 6) void verify(digits);
        }}
      />
      <p className="text-sm text-secondary-950/60">
        It expires in 10 minutes. Not there? Check your spam folder.
      </p>
      <Button
        type="submit"
        disabled={code.length !== 6 || verifying}
        loading={verifying}
        className="h-12 w-full rounded-full bg-secondary text-base text-white hover:bg-secondary-600"
      >
        {step.purpose === "login" ? "Log in" : "Continue"}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="font-medium text-secondary-950/60 hover:text-secondary-950 hover:underline"
        >
          Use a different email
        </button>
        <button
          type="button"
          disabled={wait > 0}
          onClick={async () => {
            try {
              await onResend();
              setWait(RESEND_AFTER_SECONDS);
              setCode("");
              setError(undefined);
              toast.success("We've sent a new code.");
            } catch (cause) {
              toast.error(errorMessage(cause, "We couldn't send a new code. Try again."));
            }
          }}
          className="font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-secondary-950/40 disabled:no-underline"
        >
          {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
});

const AuthForm = ({ intent = "attendee" }: { intent?: TAuthIntent }) => {
  const copy = COPY[intent];
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect");
  const { performAuthOperation } = useAuth();
  const setUserToken = useUserStore((state) => state.setUserToken);
  // Organisers mostly arrive to start hosting; everyone else, to log in.
  const [mode, setMode] = useState<TMode>(() => {
    const asked = searchParams?.get("mode");
    if (asked === "signup" || asked === "login") return asked;
    return intent === "vendor" ? "signup" : "login";
  });
  const [codeStep, setCodeStep] = useState<TCodeStep | null>(null);
  const params = useParams();
  const prefilledEmail = useMemo(() => {
    const emailParam = params?.email;
    return Array.isArray(emailParam) ? emailParam[0] : emailParam;
  }, [params.email]);

  const {
    register,
    handleSubmit,
    resetField,
    getValues,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IFormValues>({
    resolver: joiResolver(mode === "login" ? loginSchema : signupSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });
  useEffect(() => {
    if (prefilledEmail) {
      resetField("email", { defaultValue: prefilledEmail });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledEmail]);

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
        router.push(completeProfileRoute(redirectTo, intent));
        return;
      }

      router.push(await resolveLandingRoute(payload?.user, redirectTo, intent));
    },
    [performAuthOperation, redirectTo, router, setUserToken, intent],
  );

  const handleAuthError = useCallback((error: unknown) => {
    toast.error(errorMessage(error, "Something went wrong. Try again."));
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

  const [isSendingCode, setIsSendingCode] = useState(false);
  const isBusy = isSubmitting || isSocialSubmitting || isSendingCode;

  // The answer is the same whether or not the email has an account, so the
  // screen says the same too.
  const sendCode = useCallback(async (purpose: TMode, email: string) => {
    const { data } = await postData<{ email: string }, ICodeSent>(
      purpose === "login" ? "/auth/login/code/start" : "/auth/signup/start",
      { email },
      { headers: WEB_CLIENT_HEADERS },
    );
    const token = data?.data?.token;
    if (!token) throw new Error("No code was sent");
    setCodeStep({ purpose, email, token });
  }, []);

  const startCode = useCallback(
    async (purpose: TMode) => {
      if (!(await trigger("email"))) return;
      const email = getValues("email").trim().toLowerCase();
      setIsSendingCode(true);
      try {
        await sendCode(purpose, email);
      } catch (error) {
        handleAuthError(error);
      } finally {
        setIsSendingCode(false);
      }
    },
    [trigger, getValues, sendCode, handleAuthError],
  );

  const verifyCode = useCallback(
    async (code: string) => {
      if (!codeStep) return;
      if (codeStep.purpose === "login") {
        const { data } = await postData<
          { token: string; otp: string },
          IAuthResponse
        >("/auth/login/code", { token: codeStep.token, otp: code });
        await handleAuthSuccess(data?.data);
        return;
      }
      // Creating an account: the code proves the email, then they pick a password.
      const { data } = await postData<
        { token: string; otp: string; otpType: OTP_VERIFICATION_TYPE },
        { token: string }
      >("/auth/otp/verify", {
        token: codeStep.token,
        otp: code,
        otpType: OTP_VERIFICATION_TYPE.ACCOUNT_CREATION,
      });
      const setupToken = data?.data?.token;
      if (!setupToken) throw new Error("That code didn't work");
      const next = new URLSearchParams({ email: codeStep.email });
      if (redirectTo) next.set("redirect", redirectTo);
      if (intent === "vendor") next.set(INTENT_PARAM, intent);
      router.push(
        `/auth/register/${encodeURIComponent(setupToken)}?${next.toString()}`,
      );
    },
    [codeStep, handleAuthSuccess, redirectTo, intent, router],
  );

  const onSubmit = useCallback(
    async (values: IFormValues) => {
      // Emails are case-insensitive, so send one spelling or the same person can
      // end up looked up (or registered) as a different account.
      const email = values.email.trim().toLowerCase();
      try {
        if (mode === "signup") {
          await sendCode("signup", email);
          return;
        }
        const { data } = await postData<IFormValues, IAuthResponse>(
          "/auth/login",
          { email, password: values.password },
        );
        await handleAuthSuccess(data?.data);
      } catch (error) {
        handleAuthError(error);
      }
    },
    [mode, sendCode, handleAuthSuccess, handleAuthError],
  );

  const switchMode = (next: TMode) => {
    setMode(next);
    resetField("password");
  };

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
            {codeStep ? "Check your email" : copy.eyebrow}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-secondary-950">
            {codeStep ? "Enter your code" : copy.title[mode]}
          </h1>
          {(codeStep || copy.intro[mode]) && (
          <p className="text-secondary-950/60">
            {codeStep
              ? codeStep.purpose === "login"
                ? "If this email has a Turnupz account, we've sent it a 6-digit code."
                : "We've sent a 6-digit code to this email. If it already has an account, we've emailed it instead."
              : copy.intro[mode]}
          </p>
          )}
        </div>

        {codeStep ? (
          <CodeStep
            step={codeStep}
            onVerify={verifyCode}
            onResend={() => sendCode(codeStep.purpose, codeStep.email)}
            onBack={() => setCodeStep(null)}
          />
        ) : (
          <>
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
              {mode === "login" && (
                <div className="space-y-2">
                  <InputField
                    label="Password"
                    labelClassName="text-secondary-950"
                    inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
                    placeholder="Enter your password"
                    type="password"
                    autoComplete="current-password"
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
              <Button
                disabled={!isValid || isBusy}
                loading={isSubmitting || isSendingCode}
                type="submit"
                className="h-12 w-full rounded-full bg-secondary text-base text-white hover:bg-secondary-600"
              >
                {mode === "login" ? "Log in" : "Email me a code"}
              </Button>
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
                  <div
                    ref={googleButtonRef}
                    className="flex min-h-10 w-full justify-center"
                    aria-busy={isSocialSubmitting}
                  />
                </div>
              </>
            )}
            {mode === "login" && (
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                loading={isSendingCode}
                onClick={() => void startCode("login")}
                className="-mt-4 h-10 w-full rounded-md border-secondary-200 bg-white text-sm font-medium text-secondary-950"
              >
                <Mail className="size-4" aria-hidden />
                Email me a sign-in code
              </Button>
            )}

            {/* Log in and create account are separate screens, so neither one
                says whether an email already has an account. */}
            <p className="text-center text-sm text-secondary-950/60">
              {mode === "login" ? "New to Turnupz?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="font-semibold text-primary hover:underline"
              >
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </p>

          </>
        )}

      </div>
    </>
  );
};

export default memo(AuthForm);
