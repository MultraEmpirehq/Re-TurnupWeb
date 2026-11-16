"use client";

import { deleteData, getData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import StatusBadge from "@/components/ui/status-badge";
import { toast } from "@/lib/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import React, { memo, useState } from "react";

export type TSignInMethods = {
  email: string;
  /** Has a password (accounts made with Google start without one). */
  password: boolean;
  google: { email: string; connectedAt: string } | null;
};

export const SIGN_IN_METHODS_KEY = ["sign-in-methods"];

/** How this account signs in: a password, Google, or both. */
export const useSignInMethods = (enabled = true) =>
  useQuery({
    queryKey: SIGN_IN_METHODS_KEY,
    enabled,
    queryFn: async () => (await getData<TSignInMethods>("/user/sign-in-methods")).data?.data ?? null,
  });

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Adds a first password to an account made with Google. A code goes to their
 * email first, so a borrowed signed-in phone can't quietly add one.
 */
export const AddPasswordForm = memo(({ email }: { email: string }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const sendCode = async () => {
    try {
      const { data } = await postData<undefined, { token: string }>("/user/sign-in-methods/password/code", undefined);
      setToken(data?.data?.token ?? null);
      toast.success(`We sent a code to ${email}`);
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't send a code. Try again."));
    }
  };

  const save = useMutation({
    mutationFn: () => postData("/user/sign-in-methods/password", { token, otp: otp.trim(), password }),
    onSuccess: () => {
      toast.success("Password added. You can sign in with it now.");
      void queryClient.invalidateQueries({ queryKey: SIGN_IN_METHODS_KEY });
    },
    onError: (error) =>
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't add the password.")),
  });

  const weak = password.length > 0 && !PASSWORD_RULE.test(password);
  const mismatch = confirm.length > 0 && confirm !== password;

  if (!token) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          You sign in with Google. Add a password too, so you can sign in with your email if you ever can&apos;t use
          Google. We&apos;ll email a code to {email} first.
        </p>
        <Button type="button" variant="outline" className="rounded-xl" onClick={sendCode}>
          Add a password
        </Button>
      </div>
    );
  }

  return (
    <form
      className="grid grid-cols-1 gap-5 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <InputField
        label="Code from your email"
        placeholder="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={otp}
        onChange={(event) => setOtp(event.target.value)}
        containerClassName="md:col-span-2 md:max-w-[calc(50%-0.625rem)]"
      />
      <InputField
        label="New password"
        placeholder="Choose a password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={weak ? "At least 8 characters, with an upper and lower case letter, a number and a symbol" : undefined}
      />
      <InputField
        label="Confirm password"
        placeholder="Type it again"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        error={mismatch ? "Passwords do not match" : undefined}
      />
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Button
          type="submit"
          className="rounded-xl"
          loading={save.isPending}
          disabled={!otp.trim() || !PASSWORD_RULE.test(password) || confirm !== password}
        >
          Add password
        </Button>
        <Button type="button" variant="ghost" className="rounded-xl" onClick={sendCode}>
          Send a new code
        </Button>
      </div>
    </form>
  );
});
AddPasswordForm.displayName = "AddPasswordForm";

/** Google: connected (with a way to disconnect) or how to connect it. */
export const GoogleSignIn = memo(({ methods }: { methods: TSignInMethods }) => {
  const queryClient = useQueryClient();

  const disconnect = async () => {
    if (!window.confirm("Disconnect Google? You'll sign in with your email and password from now on.")) return;
    try {
      await deleteData("/user/sign-in-methods/google");
      toast.success("Google disconnected");
      void queryClient.invalidateQueries({ queryKey: SIGN_IN_METHODS_KEY });
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't disconnect Google."));
    }
  };

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border px-3.5 py-3">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground">Google</p>
        {methods.google ? (
          <>
            <StatusBadge tone="success" icon={CheckCircle2}>
              Connected · {methods.google.email}
            </StatusBadge>
            <p className="text-xs text-muted-foreground">
              Since {format(new Date(methods.google.connectedAt), "d MMM yyyy")}.
              {!methods.password && " Add a password before you can disconnect it."}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not connected. Choose &ldquo;Continue with Google&rdquo; when you sign in, with {methods.email}, and
            it&apos;ll connect to this account.
          </p>
        )}
      </div>
      {methods.google && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-lg"
          disabled={!methods.password}
          onClick={disconnect}
        >
          Disconnect
        </Button>
      )}
    </div>
  );
});
GoogleSignIn.displayName = "GoogleSignIn";
