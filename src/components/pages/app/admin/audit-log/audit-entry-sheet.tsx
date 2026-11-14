"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import StatusBadge from "@/components/ui/status-badge";
import type { IAuditLogEntry } from "@/hooks/use-admin-audit-logs";
import { format, formatDistanceToNow } from "date-fns";
import { Copy, ExternalLink, History } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";
import { toast } from "@/lib/toast";
import UndoEntryButton from "./undo-entry-button";
import {
  actionLabel,
  actionTone,
  keyName,
  TARGET_LABELS,
  targetHref,
  valueText,
} from "./audit-format";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-2 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words text-foreground">{children}</dd>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-1">
    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
    <dl className="divide-y divide-border rounded-xl border border-border bg-card px-4">{children}</dl>
  </section>
);

const copy = (value: string, what: string) => {
  void navigator.clipboard?.writeText(value);
  toast.success(`${what} copied`);
};

/**
 * Everything one audit entry recorded: when, who (and from where), what it
 * was about, every detail in words (with a "before" snapshot where kept),
 * whether it was undone, and the raw record for anything else.
 */
const AuditEntrySheet = ({
  entry,
  onOpenChange,
  canUndo,
  onShowHistory,
}: {
  entry: IAuditLogEntry | null;
  onOpenChange: (open: boolean) => void;
  canUndo: boolean;
  /** Filters the log to this record's whole history. */
  onShowHistory: (targetId: string) => void;
}) => {
  const details = entry?.details ?? {};
  const before =
    details.previous && typeof details.previous === "object" && !Array.isArray(details.previous)
      ? (details.previous as Record<string, unknown>)
      : null;
  const rest = Object.entries(details).filter(([key]) => key !== "previous");
  const href = entry ? targetHref(entry) : null;

  return (
    <Sheet open={!!entry} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {entry && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={actionTone(entry.action)}>{actionLabel(entry.action)}</StatusBadge>
                {entry.undone && <StatusBadge tone="warning">Undone</StatusBadge>}
              </div>
              <SheetTitle className="pt-1">
                {entry.targetLabel ?? TARGET_LABELS[entry.targetType] ?? entry.targetType}
              </SheetTitle>
              <SheetDescription>
                {format(new Date(entry.createdAt), "EEEE d MMMM yyyy, HH:mm:ss")} ·{" "}
                {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-8">
              <Section title="Who">
                {entry.actor.id ? (
                  <>
                    {entry.actorName && <Row label="Name">{entry.actorName}</Row>}
                    <Row label="Email">{entry.actor.email ?? "—"}</Row>
                    <Row label="Role">
                      {entry.actor.role === "admin"
                        ? "Admin"
                        : entry.actor.role === "vendor"
                          ? "Organiser"
                          : entry.actor.role === "user"
                            ? "Attendee"
                            : "—"}
                    </Row>
                    <Row label="IP address">{entry.ipAddress ?? "—"}</Row>
                  </>
                ) : (
                  <Row label="Done by">Turnupz, automatically (a scheduled check or a system rule)</Row>
                )}
              </Section>

              <Section title="What it was about">
                <Row label="Kind">{TARGET_LABELS[entry.targetType] ?? entry.targetType}</Row>
                <Row label="Name">{entry.targetLabel ?? "—"}</Row>
                {entry.targetId && (
                  <Row label="Id">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-mono text-xs hover:underline"
                      onClick={() => copy(entry.targetId!, "Id")}
                    >
                      {entry.targetId}
                      <Copy className="size-3" aria-hidden />
                    </button>
                  </Row>
                )}
                {entry.targetId && (
                  <div className="flex flex-wrap gap-2 py-3">
                    {href && (
                      <Button asChild variant="outline" size="sm" className="rounded-xl">
                        <Link href={href}>
                          Open it <ExternalLink className="size-3.5" aria-hidden />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => onShowHistory(entry.targetId!)}
                    >
                      <History className="size-3.5" aria-hidden /> Everything about it
                    </Button>
                  </div>
                )}
              </Section>

              {rest.length > 0 && (
                <Section title="Details">
                  {rest.map(([key, value]) => (
                    <Row key={key} label={keyName(key)}>
                      {value && typeof value === "object" && !Array.isArray(value) ? (
                        <dl className="space-y-1">
                          {Object.entries(value as Record<string, unknown>).map(([inner, innerValue]) => (
                            <div key={inner} className="flex gap-2">
                              <dt className="text-muted-foreground">{keyName(inner)}:</dt>
                              <dd>{valueText(inner, innerValue)}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        valueText(key, value)
                      )}
                    </Row>
                  ))}
                </Section>
              )}

              {before && (
                <Section title="Before this change">
                  {Object.entries(before).map(([key, value]) => (
                    <Row key={key} label={keyName(key)}>
                      {valueText(key, value)}
                    </Row>
                  ))}
                </Section>
              )}

              {(entry.undone || canUndo) && (
                <Section title="Undo">
                  {entry.undone ? (
                    <>
                      <Row label="Undone">
                        {format(new Date(entry.undone.at), "d MMM yyyy, HH:mm")}
                      </Row>
                      <Row label="By">{entry.undone.by ?? "—"}</Row>
                      {entry.undone.reason && <Row label="Why">{entry.undone.reason}</Row>}
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-3 py-3 text-sm">
                      <p className="text-muted-foreground">This can still be taken back.</p>
                      <UndoEntryButton entry={entry} />
                    </div>
                  )}
                </Section>
              )}

              <details className="rounded-xl border border-border bg-muted px-4 py-3 text-sm">
                <summary className="cursor-pointer font-semibold text-foreground">The full record</summary>
                <pre className="mt-3 overflow-x-auto text-xs whitespace-pre-wrap text-muted-foreground">
                  {JSON.stringify(entry, null, 2)}
                </pre>
              </details>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default memo(AuditEntrySheet);
