"use client";

import { deleteData, getData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import Notice from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/status-badge";
import { forgetTrustedDevice } from "@/lib/trusted-device";
import { toast } from "@/lib/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Copy, Download, KeyRound, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { memo, useEffect, useState } from "react";

type TStatus = {
  enabled: boolean;
  enabledAt: string | null;
  backupCodesLeft: number;
  trustedDevices: number;
};

const KEY = ["two-factor"];
const errorText = (error: unknown, fallback: string) =>
  constructErrorMessage(error as TApiErrorResponseType, fallback);

/** A 6-digit code, or a backup code when they've lost the app. */
const CodeInput = ({
  label,
  value,
  onChange,
  allowBackup,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowBackup?: boolean;
}) => (
  <InputField
    label={label}
    value={value}
    onChange={(event) =>
      onChange(allowBackup ? event.target.value.slice(0, 20) : event.target.value.replace(/\D/g, "").slice(0, 6))
    }
    inputMode={allowBackup ? "text" : "numeric"}
    autoComplete="one-time-code"
    placeholder={allowBackup ? "123456 or a backup code" : "123456"}
  />
);

/** Shown once: copy or download, then they confirm they've kept them. */
const BackupCodes = ({ codes, onDone }: { codes: string[]; onDone: () => void }) => {
  const text = `Turnupz backup codes (each works once)\n\n${codes.join("\n")}\n`;
  return (
    <div className="space-y-4">
      <Notice tone="warning" title="Save your backup codes now">
        <p>If you lose your phone, each of these signs you in once. We won&apos;t show them again.</p>
      </Notice>
      <ul className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted p-3 font-mono text-sm sm:grid-cols-5">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            void navigator.clipboard?.writeText(text);
            toast.success("Backup codes copied");
          }}
        >
          <Copy className="size-4" aria-hidden /> Copy
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
            link.download = "turnupz-backup-codes.txt";
            link.click();
            URL.revokeObjectURL(link.href);
          }}
        >
          <Download className="size-4" aria-hidden /> Download
        </Button>
        <Button type="button" className="rounded-xl" onClick={onDone}>
          I&apos;ve saved them
        </Button>
      </div>
    </div>
  );
};

/**
 * Two-factor sign-in with an authenticator app, inside "Sign-in and security"
 * (the password card): optional for every account.
 * Turning it on shows a QR code to scan, asks for one code to prove it works,
 * then shows the backup codes once.
 */
const TwoFactorSection = () => {
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => (await getData<TStatus>("/account/two-factor")).data?.data ?? null,
  });
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [action, setAction] = useState<"disable" | "codes" | null>(null);
  const [code, setCode] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });

  // Arriving from "Turn it on" (…/settings#two-factor): the page lays out
  // after the browser has tried to jump there, so bring the card into view.
  useEffect(() => {
    if (isLoading || window.location.hash !== "#two-factor") return;
    const timer = window.setTimeout(
      () => document.getElementById("two-factor")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  const start = useMutation({
    mutationFn: async () => (await postData<undefined, { secret: string; otpauthUrl: string }>("/account/two-factor/setup")).data?.data,
    onSuccess: (data) => {
      setSetup(data ?? null);
      setCode("");
    },
    onError: (error) => toast.error(errorText(error, "Couldn't start. Try again.")),
  });
  const enable = useMutation({
    mutationFn: async () => (await postData<{ code: string }, { backupCodes: string[] }>("/account/two-factor/enable", { code })).data?.data,
    onSuccess: (data) => {
      setSetup(null);
      setCode("");
      setBackupCodes(data?.backupCodes ?? null);
      void refresh();
      toast.success("Two-factor sign-in is on");
    },
    onError: (error) => toast.error(errorText(error, "That code didn't match.")),
  });
  const confirm = useMutation({
    mutationFn: async () => {
      if (action === "disable") {
        await postData("/account/two-factor/disable", { code });
        forgetTrustedDevice();
        return null;
      }
      return (await postData<{ code: string }, { backupCodes: string[] }>("/account/two-factor/backup-codes", { code })).data?.data;
    },
    onSuccess: (data) => {
      if (action === "disable") toast.success("Two-factor sign-in is off");
      else setBackupCodes(data?.backupCodes ?? null);
      setAction(null);
      setCode("");
      void refresh();
    },
    onError: (error) => toast.error(errorText(error, "That code didn't work.")),
  });
  const forget = useMutation({
    mutationFn: () => deleteData("/account/two-factor/trusted-devices"),
    onSuccess: () => {
      forgetTrustedDevice();
      void refresh();
      toast.success("Every device will ask for a code next time");
    },
    onError: (error) => toast.error(errorText(error, "Couldn't do that. Try again.")),
  });

  return (
    <section id="two-factor" aria-labelledby="two-factor-title" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 id="two-factor-title" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            Two-factor sign-in
          </h3>
          <p className="text-sm text-muted-foreground">
            Signing in also asks for a code from an authenticator app (Google Authenticator, Microsoft
            Authenticator, 1Password or Authy), so a stolen password isn&apos;t enough. Free.
          </p>
        </div>
        {status && (
          <StatusBadge tone={status.enabled ? "success" : "neutral"}>{status.enabled ? "On" : "Off"}</StatusBadge>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-16 rounded-xl" />
      ) : backupCodes ? (
        <BackupCodes codes={backupCodes} onDone={() => setBackupCodes(null)} />
      ) : setup ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.length === 6) enable.mutate();
          }}
        >
          <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
            <li>Open your authenticator app and add an account.</li>
            <li>Scan this code, or type the key below.</li>
            <li>Enter the 6-digit code the app shows.</li>
          </ol>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="w-fit rounded-xl border border-border bg-white p-3">
              <QRCodeSVG value={setup.otpauthUrl} size={160} />
            </div>
            <div className="min-w-0 space-y-1 text-sm">
              <p className="text-muted-foreground">Can&apos;t scan? Type this key:</p>
              <p className="font-mono break-all text-foreground">{setup.secret.match(/.{1,4}/g)?.join(" ")}</p>
            </div>
          </div>
          <CodeInput label="6-digit code" value={code} onChange={setCode} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="rounded-xl" loading={enable.isPending} disabled={code.length !== 6 || enable.isPending}>
              Turn on
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSetup(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : status?.enabled ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            On since {status.enabledAt ? format(new Date(status.enabledAt), "d MMM yyyy") : "recently"} ·{" "}
            {status.backupCodesLeft} backup code{status.backupCodesLeft === 1 ? "" : "s"} left
            {status.trustedDevices > 0 &&
              ` · ${status.trustedDevices} trusted device${status.trustedDevices === 1 ? "" : "s"}`}
          </p>
          {status.backupCodesLeft <= 2 && (
            <Notice tone="warning" title="You're running out of backup codes">
              <p>Make new ones so you can still sign in if you lose your phone.</p>
            </Notice>
          )}
          {action ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (code.trim().length >= 6) confirm.mutate();
              }}
            >
              <CodeInput
                label={action === "disable" ? "Enter a code to turn it off" : "Enter a code to make new backup codes"}
                value={code}
                onChange={setCode}
                allowBackup
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant={action === "disable" ? "destructive" : "default"}
                  className="rounded-xl"
                  loading={confirm.isPending}
                  disabled={code.trim().length < 6 || confirm.isPending}
                >
                  {action === "disable" ? "Turn off" : "Make new codes"}
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAction(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => { setAction("codes"); setCode(""); }}>
                <KeyRound className="size-4" aria-hidden /> New backup codes
              </Button>
              {status.trustedDevices > 0 && (
                <Button variant="outline" className="rounded-xl" loading={forget.isPending} onClick={() => forget.mutate()}>
                  Forget trusted devices
                </Button>
              )}
              <Button variant="ghost" className="rounded-xl text-danger" onClick={() => { setAction("disable"); setCode(""); }}>
                Turn off
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Button className="rounded-xl" loading={start.isPending} onClick={() => start.mutate()}>
          Turn on
        </Button>
      )}
    </section>
  );
};

export default memo(TwoFactorSection);
