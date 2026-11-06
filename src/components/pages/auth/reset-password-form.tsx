"use client";
import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { OTP_VERIFICATION_TYPE } from "@/lib/types";
import { isStrongPassword, PASSWORD_HINT } from "@/lib/password";
import { ROUTES } from "@/lib/variables";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import PasswordRules from "./password-rules";

const RESEND_AFTER_SECONDS = 60;

type TStage = "sending" | "code" | "password" | "done" | "invalid";

const errorText = (error: unknown, fallback: string) =>
  constructErrorMessage(error as TApiErrorResponseType, fallback);

/**
 * Forgotten password: we email a 6-digit code, they enter it here, then pick a
 * new password. Also how an account made with Google gets a password.
 */
const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const type = searchParams.get("type");
  const [stage, setStage] = useState<TStage>(
    email && type === OTP_VERIFICATION_TYPE.FORGOT_PASSWORD ? "sending" : "invalid",
  );
  const [codeToken, setCodeToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [checking, setChecking] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const sentOnce = useRef(false);

  const sendCode = useCallback(async () => {
    setCodeError("");
    try {
      const { data } = await postData<
        { email: string; otpType: string },
        { token: string; expiresAt: string }
      >("/auth/otp/send", { email, otpType: OTP_VERIFICATION_TYPE.FORGOT_PASSWORD });
      if (!data?.data?.token) throw new Error("No code was sent");
      setCodeToken(data.data.token);
      setCode("");
      setResendIn(RESEND_AFTER_SECONDS);
      setStage("code");
    } catch (error) {
      toast.error(errorText(error, "We couldn't send a code just now. Try again in a minute."));
      setStage("code");
    }
  }, [email]);

  // Once, as the page opens (not twice when React re-runs effects in development).
  useEffect(() => {
    if (stage !== "sending" || sentOnce.current) return;
    sentOnce.current = true;
    void sendCode();
  }, [stage, sendCode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((left) => left - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const checkCode = useCallback(
    async (value: string) => {
      if (!codeToken || value.length !== 6 || checking) return;
      setChecking(true);
      setCodeError("");
      try {
        const { data } = await postData<
          { token: string; otp: string; otpType: string },
          { token: string }
        >("/auth/otp/verify", {
          token: codeToken,
          otp: value,
          otpType: OTP_VERIFICATION_TYPE.FORGOT_PASSWORD,
        });
        if (!data?.data?.token) throw new Error("The code couldn't be checked");
        setResetToken(data.data.token);
        setStage("password");
      } catch (error) {
        setCodeError(errorText(error, "That code isn't right. Check the email and try again."));
      } finally {
        setChecking(false);
      }
    },
    [codeToken, checking],
  );

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetToken || !isStrongPassword(password) || password !== confirm) return;
    setSaving(true);
    try {
      await postData("/auth/password/change", { token: resetToken, password });
      setStage("done");
    } catch (error) {
      toast.error(errorText(error, "We couldn't change your password. Start again for a new code."));
    } finally {
      setSaving(false);
    }
  };

  const loginHref = `${ROUTES.LOGIN.href}?email=${encodeURIComponent(email)}`;

  if (stage === "invalid") {
    return (
      <div className="flex w-full flex-col gap-5">
        <h1 className="text-3xl font-bold tracking-tight text-secondary-950">This link isn&apos;t complete</h1>
        <p className="text-secondary-950/60">Start again and we&apos;ll email you a new code.</p>
        <Button asChild className="h-12 w-full rounded-full bg-secondary text-base text-white hover:bg-secondary-600">
          <Link href="/auth/forgot-password">Reset my password</Link>
        </Button>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="flex w-full flex-col items-center gap-5 text-center">
        <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-secondary-950">Password changed</h1>
          <p className="text-secondary-950/60">Log in with your new password.</p>
        </div>
        <Button
          className="h-12 w-full rounded-full bg-secondary text-base text-white hover:bg-secondary-600"
          onClick={() => router.push(loginHref)}
        >
          Log in
        </Button>
        <Link href={ROUTES.ADMIN_LOGIN.href} className="text-sm text-secondary-950/50 hover:underline">
          Turnupz team? Admin sign-in
        </Link>
      </div>
    );
  }

  if (stage === "password") {
    const mismatch = !!confirm && confirm !== password;
    return (
      <div className="flex w-full flex-col gap-7">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wider text-primary uppercase">Reset password · Step 2 of 2</p>
          <h1 className="text-3xl font-bold tracking-tight text-secondary-950">Choose a new password</h1>
          <p className="text-secondary-950/60">{PASSWORD_HINT}</p>
        </div>
        <form onSubmit={savePassword} className="w-full space-y-5">
          <div className="space-y-3">
            <InputField
              label="New password"
              labelClassName="text-secondary-950"
              inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
              type="password"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordRules value={password} />
          </div>
          <InputField
            label="Confirm new password"
            labelClassName="text-secondary-950"
            inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            error={mismatch ? "Passwords don't match" : undefined}
          />
          <Button
            type="submit"
            disabled={!isStrongPassword(password) || password !== confirm}
            loading={saving}
            className="h-12 w-full rounded-full bg-secondary text-base text-white hover:bg-secondary-600"
          >
            Save new password
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-7">
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">Reset password · Step 1 of 2</p>
        <h1 className="text-3xl font-bold tracking-tight text-secondary-950">Enter your code</h1>
        <p className="text-secondary-950/60">
          {stage === "sending" ? (
            "Sending a code…"
          ) : (
            <>
              We sent a 6-digit code to <span className="font-medium text-secondary-950">{email}</span>. It
              expires in 10 minutes.
            </>
          )}
        </p>
      </div>
      <form
        className="w-full space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void checkCode(code);
        }}
      >
        <InputField
          label="Code"
          labelClassName="text-secondary-950"
          inputClassName="h-14 rounded-xl bg-[#f7f9fc] text-center text-2xl font-semibold tracking-[0.5em]"
          placeholder="••••••"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          disabled={stage === "sending"}
          value={code}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(digits);
            setCodeError("");
            if (digits.length === 6) void checkCode(digits);
          }}
          error={codeError}
        />
        <Button
          type="submit"
          disabled={code.length !== 6 || !codeToken}
          loading={checking}
          className="h-12 w-full rounded-full bg-secondary text-base text-white hover:bg-secondary-600"
        >
          Continue
        </Button>
      </form>
      <p className="text-center text-sm text-secondary-950/60">
        Didn&apos;t get it? Check spam, or{" "}
        {resendIn > 0 ? (
          <span>send a new code in {resendIn}s</span>
        ) : (
          <button
            type="button"
            onClick={() => void sendCode()}
            className="font-semibold text-primary hover:underline"
          >
            send a new code
          </button>
        )}
        .
      </p>
    </div>
  );
};

export default memo(ResetPasswordForm);
