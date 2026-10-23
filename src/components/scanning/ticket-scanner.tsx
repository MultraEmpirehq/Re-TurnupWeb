"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TScanResult } from "@/hooks/use-ticket-scan";
import { cn } from "@/lib/utils";
import {
  Camera,
  CheckCircle2,
  CircleAlert,
  Keyboard,
  Loader2,
  XCircle,
} from "lucide-react";
import React, { memo, useCallback, useState } from "react";
import QrCamera from "./qr-camera";

type TLogEntry = TScanResult & { code: string; at: number };

/** How long a result stays up before the camera reads again. */
const RESULT_MS = 2600;

const TONE = {
  approved: {
    icon: CheckCircle2,
    title: "Let them in",
    card: "border-emerald-200 bg-emerald-50 text-emerald-900",
    iconClass: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  already_checked_in: {
    icon: CircleAlert,
    title: "Already checked in",
    card: "border-amber-200 bg-amber-50 text-amber-900",
    iconClass: "text-amber-600",
    dot: "bg-amber-500",
  },
  denied: {
    icon: XCircle,
    title: "Not valid",
    card: "border-red-200 bg-red-50 text-red-900",
    iconClass: "text-red-600",
    dot: "bg-red-500",
  },
} as const;

const timeOf = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

/**
 * Reads tickets with the camera, or a typed code, and shows the door's answer
 * big enough to read at arm's length. A short buzz tells the scanner the result
 * without looking: one for in, three for a problem.
 */
const TicketScanner: React.FC<{
  onScan: (code: string) => Promise<TScanResult>;
  /** Called after every answer, e.g. to refresh the door count. */
  onScanned?: (result: TScanResult) => void;
  disabled?: boolean;
  disabledMessage?: string;
}> = ({ onScan, onScanned, disabled, disabledMessage }) => {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<TLogEntry | null>(null);
  const [log, setLog] = useState<TLogEntry[]>([]);

  const submit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || pending || disabled) return;
      setPending(true);
      let entry: TLogEntry;
      try {
        const answer = await onScan(trimmed);
        entry = { ...answer, code: trimmed, at: Date.now() };
      } catch (error) {
        entry = {
          status: "denied",
          message: constructErrorMessage(
            error as TApiErrorResponseType,
            "Couldn't check that ticket. Check your connection and try again.",
          ),
          code: trimmed,
          at: Date.now(),
        };
      }
      setPending(false);
      setResult(entry);
      setLog((current) => [entry, ...current].slice(0, 12));
      navigator.vibrate?.(entry.status === "approved" ? 120 : [80, 60, 80, 60, 80]);
      onScanned?.(entry);
      setCode("");
      window.setTimeout(
        () => setResult((current) => (current?.at === entry.at ? null : current)),
        RESULT_MS,
      );
    },
    [disabled, onScan, onScanned, pending],
  );

  const tone = result ? TONE[result.status] : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist" aria-label="How to scan">
        {(
          [
            { value: "camera", label: "Camera", icon: Camera },
            { value: "manual", label: "Type a code", icon: Keyboard },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={mode === option.value}
            onClick={() => setMode(option.value)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              mode === option.value
                ? "border-secondary-800 bg-secondary-800 text-white"
                : "border-border bg-white text-muted-foreground hover:text-foreground",
            )}
          >
            <option.icon className="size-4" aria-hidden />
            {option.label}
          </button>
        ))}
      </div>

      {disabled ? (
        <div className="flex aspect-square max-h-[460px] w-full items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground sm:aspect-[4/3]">
          {disabledMessage}
        </div>
      ) : (
        <div className="relative">
          {mode === "camera" ? (
            <QrCamera
              paused={pending || !!result}
              onDetect={submit}
              className="aspect-square max-h-[460px] w-full sm:aspect-[4/3]"
            />
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submit(code);
              }}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:flex-row"
            >
              <label htmlFor="ticket-code" className="sr-only">
                Ticket code
              </label>
              <Input
                id="ticket-code"
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Ticket code, e.g. TZ8K2M4Q"
                className="h-12 font-mono text-base tracking-wider uppercase"
              />
              <Button type="submit" className="h-12 px-6" disabled={pending || !code.trim()}>
                {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Check in
              </Button>
            </form>
          )}

          {pending && mode === "camera" && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
              <Loader2 className="size-9 animate-spin text-white" aria-label="Checking ticket" />
            </div>
          )}
        </div>
      )}

      <div aria-live="assertive" className="min-h-[104px]">
        {result && tone && (
          <div
            className={cn(
              "flex items-start gap-4 rounded-2xl border p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95",
              tone.card,
            )}
          >
            <tone.icon className={cn("size-10 shrink-0", tone.iconClass)} aria-hidden />
            <div className="min-w-0">
              <p className="text-xl font-extrabold">{tone.title}</p>
              {result.attendeeName && (
                <p className="mt-0.5 truncate font-semibold">
                  {result.attendeeName}
                  {result.ticketCategory && (
                    <span className="font-normal opacity-80"> · {result.ticketCategory}</span>
                  )}
                </p>
              )}
              <p className="mt-1 text-sm opacity-90">
                {result.message}
                {result.status === "already_checked_in" && result.checkedInAt && (
                  <> at {timeOf(result.checkedInAt)}</>
                )}
                {result.status === "already_checked_in" && result.scannerEmail && (
                  <> by {result.scannerEmail}</>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {log.length > 0 && (
        <section aria-labelledby="recent-scans">
          <h2 id="recent-scans" className="mb-2 text-sm font-semibold text-muted-foreground">
            Recent scans on this device
          </h2>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
            {log.map((entry) => (
              <li key={entry.at} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className={cn("size-2.5 shrink-0 rounded-full", TONE[entry.status].dot)} aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">
                    {entry.attendeeName || entry.code}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {TONE[entry.status].title}
                    {entry.dayName ? ` · ${entry.dayName}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(entry.at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default memo(TicketScanner);
