"use client";

import { patchData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import PasswordRules from "@/components/pages/auth/password-rules";
import { isStrongPassword, PASSWORD_HINT } from "@/lib/password";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";

/**
 * First sign-in on a temporary password (emailed when they were added, or
 * resent): they choose their own before the console opens. The api refuses
 * every admin action until they do.
 */
const AdminChangePassword = () => {
  const router = useRouter();
  const userDetails = useUserStore((state) => state.userDetails);
  const setUserDetails = useUserStore((state) => state.setUserDetails);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const sameAsCurrent = !!password && password === current;
  const mismatch = !!confirm && confirm !== password;
  const canSave = !!current && isStrongPassword(password) && password === confirm && !sameAsCurrent;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await patchData("/user/password", { oldPassword: current, password });
      if (userDetails) setUserDetails({ ...userDetails, mustChangePassword: false });
      toast.success("Password set. Welcome to the admin console.");
      router.replace(ROUTES.ADMIN_OVERVIEW.href);
    } catch (error) {
      toast.error(
        constructErrorMessage(error as TApiErrorResponseType, "We couldn't change your password."),
      );
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="w-full max-w-md space-y-5 rounded-[1.6rem] border border-secondary-100 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]"
    >
      <div className="space-y-2">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-800">
          <KeyRound className="size-5" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-secondary-950">Choose your password</h1>
        <p className="text-sm leading-6 text-secondary-950/60">
          You signed in with a temporary password. Choose your own to open the admin console.{" "}
          {PASSWORD_HINT}
        </p>
      </div>

      <InputField
        label="Temporary password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={current}
        onChange={(event) => setCurrent(event.target.value)}
        helperText="The one in your email."
      />
      <div className="space-y-3">
        <InputField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={sameAsCurrent ? "Choose a different password from the temporary one" : undefined}
        />
        <PasswordRules value={password} />
      </div>
      <InputField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        error={mismatch ? "Passwords don't match" : undefined}
      />
      <Button
        type="submit"
        disabled={!canSave}
        loading={saving}
        className="h-12 w-full rounded-full bg-secondary-800 text-base text-white hover:bg-secondary-900"
      >
        Set password and continue
      </Button>
    </form>
  );
};

export default memo(AdminChangePassword);
