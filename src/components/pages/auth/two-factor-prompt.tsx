"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import InputField from "@/components/ui/input-field";
import { setTrustedDevice } from "@/lib/trusted-device";
import { ShieldCheck } from "lucide-react";
import React, { memo, useState } from "react";

type TCompleted = { trustedDeviceToken?: string } & Record<string, unknown>;

/**
 * The second step of signing in when two-factor is on: the 6-digit code from
 * their authenticator app, or a backup code. "Trust this device" skips it here
 * for 30 days. `onDone` gets the same response a normal sign-in would.
 */
const TwoFactorPrompt = <T extends TCompleted>({
  challenge,
  onDone,
  onCancel,
}: {
  challenge: string;
  onDone: (response: T) => void | Promise<void>;
  onCancel: () => void;
}) => {
  const [useBackup, setUseBackup] = useState(false);
  const [code, setCode] = useState("");
  const [trust, setTrust] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ready = useBackup ? code.replace(/[^a-z0-9]/gi, "").length >= 10 : /^\d{6}$/.test(code);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await postData<
        { challenge: string; code: string; trustDevice: boolean },
        T
      >("/auth/two-factor", { challenge, code: code.trim(), trustDevice: trust });
      const result = data?.data as T;
      setTrustedDevice(result?.trustedDeviceToken);
      await onDone(result);
    } catch (err) {
      const message = constructErrorMessage(err as TApiErrorResponseType, "That code didn't work.");
      setError(message);
      // A spent or expired challenge can't be retried: back to the start.
      if (/sign in again/i.test(message)) setTimeout(onCancel, 1500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5" aria-labelledby="two-factor-title">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <ShieldCheck className="size-4" aria-hidden />
          Two-factor sign-in
        </p>
        <h2 id="two-factor-title" className="text-xl font-bold text-foreground">
          {useBackup ? "Enter a backup code" : "Enter the code from your app"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {useBackup
            ? "One of the codes you saved when you turned this on. Each works once."
            : "Open your authenticator app and type the 6-digit code for Turnupz."}
        </p>
      </div>

      <InputField
        label={useBackup ? "Backup code" : "6-digit code"}
        value={code}
        onChange={(event) =>
          setCode(useBackup ? event.target.value.slice(0, 20) : event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        inputMode={useBackup ? "text" : "numeric"}
        autoComplete="one-time-code"
        autoFocus
        placeholder={useBackup ? "xxxxx-xxxxx" : "123456"}
        error={error ?? undefined}
      />

      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={trust} onCheckedChange={(value) => setTrust(value === true)} />
        Trust this device for 30 days
      </label>

      <Button type="submit" className="w-full" loading={busy} disabled={!ready || busy}>
        Verify and sign in
      </Button>

      <div className="flex justify-between text-sm">
        <button
          type="button"
          className="font-semibold text-primary hover:underline"
          onClick={() => {
            setUseBackup((value) => !value);
            setCode("");
            setError(null);
          }}
        >
          {useBackup ? "Use the app instead" : "Use a backup code"}
        </button>
        <button type="button" className="text-muted-foreground hover:underline" onClick={onCancel}>
          Back
        </button>
      </div>
    </form>
  );
};

export default memo(TwoFactorPrompt) as typeof TwoFactorPrompt;
