"use client";

import DateSelect from "@/components/ui/date-select";
import { addMonths, addYears, format, isSameDay, startOfDay, startOfMonth, startOfYear } from "date-fns";
import { Registration } from "@/components/account/tax-details-card";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmptyContainer from "@/components/ui/empty-container";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  approveTaxDecision,
  createTaxDecision,
  retireTaxDecision,
  reviewTaxExemption,
  reviewTaxRegistration,
  TTaxDecision,
  TTaxReview,
  useTaxDecisions,
  useTaxExemptions,
  useTaxOptions,
  useTaxRegistrations,
  saveTurnupzTaxRegistration,
  useTurnupzTax,
} from "@/hooks/use-tax";
import { percentOf } from "@/lib/checkout-tax";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import React, { memo, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { ListSkeleton } from "../moderation/moderation-ui";
import { FinanceCard, Pill } from "./finance-ui";

const DECISION_TONE = { DRAFT: "warn", APPROVED: "good", RETIRED: "muted" } as const;
const REVIEW_TONE = { PENDING: "warn", CONFIRMED: "good", REJECTED: "bad" } as const;
const REVIEW_LABEL = { PENDING: "To review", CONFIRMED: "Confirmed", REJECTED: "Rejected" } as const;
const COUNTRY = { NG: "Nigeria", CA: "Canada" } as Record<string, string>;
const CURRENCY: Record<string, string> = { NG: "NGN", CA: "CAD" };
const REASON: Record<string, string> = {
  CHARITY: "Charity",
  NON_PROFIT: "Non-profit",
  EDUCATIONAL: "Educational",
  CULTURAL: "Cultural",
  OTHER: "Other",
};

const failed = (error: unknown, fallback: string) =>
  toast.error(constructErrorMessage(error as TApiErrorResponseType, fallback));

const place = (decision: Pick<TTaxDecision, "countryCode" | "regionCode">) =>
  [COUNTRY[decision.countryCode] ?? decision.countryCode, decision.regionCode].filter(Boolean).join(" · ");

/** Quick picks for when a decision starts. */
const START_PRESETS = [
  { label: "Today", date: () => startOfDay(new Date()) },
  { label: "Start of this month", date: () => startOfMonth(new Date()) },
  { label: "Start of next month", date: () => startOfMonth(addMonths(new Date(), 1)) },
  { label: "1 January", date: () => startOfYear(new Date()) },
];

/* ------------------------------------------------------------- decisions */

const NewDecision: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const { data: options } = useTaxOptions();
  const [countryCode, setCountryCode] = useState("NG");
  const [regionCode, setRegionCode] = useState("");
  const [purpose, setPurpose] = useState<"ADMISSION" | "COMMISSION">("ADMISSION");
  const [reason, setReason] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(() => startOfDay(new Date()));
  const [saving, setSaving] = useState(false);

  const regions = useMemo(
    () => (countryCode === "CA" ? Object.keys(options?.rates?.CA ?? {}) : []),
    [countryCode, options],
  );
  const rates = options?.rates?.[countryCode]?.[countryCode === "CA" ? regionCode : ""] ?? [];

  const save = async () => {
    setSaving(true);
    try {
      await createTaxDecision({
        countryCode,
        regionCode: regionCode || undefined,
        purpose,
        currency: CURRENCY[countryCode],
        lines: rates.map(({ code, ppm }) => ({ code, ppm })),
        reason,
        evidenceRef: evidenceRef || undefined,
        // The day as picked, at midnight UTC, so no time zone moves it a day.
        effectiveFrom: new Date(
          Date.UTC(effectiveFrom!.getFullYear(), effectiveFrom!.getMonth(), effectiveFrom!.getDate()),
        ).toISOString(),
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-tax-decisions"] });
      toast.success("Saved as a draft. Nothing changes until it's approved.");
      setReason("");
      setEvidenceRef("");
      onClose();
    } catch (error) {
      failed(error, "We couldn't save that decision");
    } finally {
      setSaving(false);
    }
  };

  const field = "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm";
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New tax decision</DialogTitle>
          <DialogDescription>
            Write down what the tax adviser decided for one place. It stays a draft until someone approves it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">
            Country
            <select
              className={field}
              value={countryCode}
              onChange={(event) => {
                setCountryCode(event.target.value);
                setRegionCode("");
              }}
            >
              <option value="NG">Nigeria</option>
              <option value="CA">Canada</option>
            </select>
          </label>
          {countryCode === "CA" && (
            <label className="space-y-1 text-sm font-medium">
              Province
              <select className={field} value={regionCode} onChange={(event) => setRegionCode(event.target.value)}>
                <option value="">Choose a province</option>
                {regions.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            </label>
          )}
          <label className="space-y-1 text-sm font-medium">
            Applies to
            <select
              className={field}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value as "ADMISSION" | "COMMISSION")}
            >
              <option value="ADMISSION">Tickets (admission)</option>
              <option value="COMMISSION">Turnupz&apos;s commission</option>
            </select>
          </label>
          <div className="space-y-2 sm:col-span-2">
            <DateSelect
              date={effectiveFrom}
              setDate={setEffectiveFrom}
              label="Starts on"
              placeholder="When the decision applies from"
              helperText="Usually today or the start of a month. It can be in the past, e.g. when a rate has applied for a while."
              minDate={new Date(2015, 0, 1)}
              maxDate={addYears(new Date(), 2)}
              inputClassName="h-10"
            />
            <div className="flex flex-wrap gap-1.5">
              {START_PRESETS.map((preset) => {
                const day = preset.date();
                const on = !!effectiveFrom && isSameDay(effectiveFrom, day);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setEffectiveFrom(day)}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-sm">
          <p className="font-medium">Rates</p>
          {rates.length ? (
            <ul className="mt-1 text-muted-foreground">
              {rates.map((rate) => (
                <li key={rate.code}>
                  {rate.label} at {percentOf(rate.ppm)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-muted-foreground">
              {countryCode === "CA" ? "Choose a province to see its rates." : "None"}
            </p>
          )}
          {purpose === "COMMISSION" && (
            <p className="mt-2 text-warning dark:text-amber-300">
              Recorded only. Tax on the commission isn&apos;t charged until the open questions below are settled.
            </p>
          )}
        </div>
        <label className="space-y-1 text-sm font-medium">
          Why
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="The classification, as the adviser explained it"
          />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Where the adviser&apos;s sign-off is kept
          <Input
            value={evidenceRef}
            onChange={(event) => setEvidenceRef(event.target.value)}
            placeholder="A link or file reference. Needed to approve."
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !rates.length || !effectiveFrom || reason.trim().length < 10}>
            {saving ? "Saving…" : "Save draft"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Decisions = () => {
  const queryClient = useQueryClient();
  const { data, isPending } = useTaxDecisions();
  const [creating, setCreating] = useState(false);
  const [approving, setApproving] = useState<TTaxDecision | null>(null);
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-tax-decisions"] });
  const approve = async () => {
    if (!approving) return;
    setBusy(true);
    try {
      await approveTaxDecision(approving.id, evidence || undefined);
      await refresh();
      toast.success("Approved. Buyers pay this tax from its start date.");
      setApproving(null);
    } catch (error) {
      failed(error, "We couldn't approve that decision");
    } finally {
      setBusy(false);
    }
  };
  const retire = async (decision: TTaxDecision) => {
    try {
      await retireTaxDecision(decision.id);
      await refresh();
      toast.success("Retired. Orders already sold under it stay as they are.");
    } catch (error) {
      failed(error, "We couldn't retire that decision");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>New decision</Button>
      </div>
      {isPending ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyContainer
          title="No decisions yet"
          description="No tax is added to any ticket until a decision here is approved."
        />
      ) : (
        <div className="space-y-3">
          {data.map((decision) => (
            <div key={decision.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{place(decision)}</p>
                  <Pill tone="info">{decision.purpose === "ADMISSION" ? "Tickets" : "Commission"}</Pill>
                  <Pill tone={DECISION_TONE[decision.status]}>{decision.status.toLowerCase()}</Pill>
                </div>
                <div className="flex gap-2">
                  {decision.status === "DRAFT" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEvidence(decision.evidenceRef ?? "");
                        setApproving(decision);
                      }}
                    >
                      Approve
                    </Button>
                  )}
                  {decision.status !== "RETIRED" && (
                    <Button size="sm" variant="outline" onClick={() => retire(decision)}>
                      Retire
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm">
                {decision.lines.map((line) => `${line.label} ${percentOf(line.ppm)}`).join(", ") || "No tax"}
                <span className="text-muted-foreground">
                  {" "}
                  · from {format(new Date(decision.effectiveFrom), "d MMM yyyy")}
                  {decision.effectiveUntil ? ` to ${new Date(decision.effectiveUntil).toLocaleDateString()}` : ""}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{decision.reason}</p>
            </div>
          ))}
        </div>
      )}

      <NewDecision open={creating} onClose={() => setCreating(false)} />
      <Dialog open={!!approving} onOpenChange={(next) => !next && setApproving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve this decision?</DialogTitle>
            <DialogDescription>
              {approving && `${place(approving)}: `}
              buyers start paying this tax from its start date wherever the organiser is registered. Only approve what
              the tax adviser has signed off.
            </DialogDescription>
          </DialogHeader>
          <label className="space-y-1 text-sm font-medium">
            Where the sign-off is kept
            <Input value={evidence} onChange={(event) => setEvidence(event.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setApproving(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={approve} disabled={busy || !evidence.trim()}>
              {busy ? "Approving…" : "Approve"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* --------------------------------------------------------------- reviews */

const ReviewButtons: React.FC<{
  onReview: (status: TTaxReview, note?: string) => Promise<void>;
}> = ({ onReview }) => {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (status: TTaxReview, withNote?: string) => {
    setBusy(true);
    await onReview(status, withNote).finally(() => setBusy(false));
  };
  if (rejecting) {
    return (
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Why, for the organiser" />
        <div className="flex gap-2">
          <Button size="sm" disabled={busy || !note.trim()} onClick={() => run("REJECTED", note)}>
            Reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={busy} onClick={() => run("CONFIRMED")}>
        Confirm
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setRejecting(true)}>
        Reject
      </Button>
    </div>
  );
};

const Registrations = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TTaxReview>("PENDING");
  const { data, isPending } = useTaxRegistrations(status);
  const review = async (id: string, next: TTaxReview, note?: string) => {
    try {
      await reviewTaxRegistration(id, next, note);
      await queryClient.invalidateQueries({ queryKey: ["admin-tax-registrations"] });
      toast.success(next === "REJECTED" ? "Rejected. They stop charging this tax." : "Confirmed.");
    } catch (error) {
      failed(error, "We couldn't save that review");
    }
  };
  return (
    <div className="space-y-4">
      <StatusFilter value={status} onChange={setStatus} />
      <p className="text-sm text-muted-foreground">
        A registered organiser charges tax as soon as they say so; rejecting a number stops it.
      </p>
      {isPending ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyContainer title="Nothing here" description="No registrations in this list." />
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-semibold">{row.organiser}</p>
                <p className="text-sm text-muted-foreground">
                  {row.label} · <span className="font-mono">{row.number}</span>
                </p>
                {row.reviewNote && <p className="mt-1 text-sm text-danger dark:text-red-300">{row.reviewNote}</p>}
              </div>
              {row.reviewStatus === "PENDING" ? (
                <ReviewButtons onReview={(next, note) => review(row.id, next, note)} />
              ) : (
                <Pill tone={REVIEW_TONE[row.reviewStatus]}>{REVIEW_LABEL[row.reviewStatus]}</Pill>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Exemptions = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TTaxReview>("PENDING");
  const { data, isPending } = useTaxExemptions(status);
  const review = async (id: string, next: TTaxReview, note?: string) => {
    try {
      await reviewTaxExemption(id, next, note);
      await queryClient.invalidateQueries({ queryKey: ["admin-tax-exemptions"] });
      toast.success(next === "CONFIRMED" ? "Approved. No tax on these sales from now on." : "Rejected.");
    } catch (error) {
      failed(error, "We couldn't save that review");
    }
  };
  return (
    <div className="space-y-4">
      <StatusFilter value={status} onChange={setStatus} />
      {isPending ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyContainer title="Nothing here" description="No exemption requests in this list." />
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <div key={row.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{row.organiser}</p>
                  <p className="text-sm text-muted-foreground">
                    {REASON[row.reason]} · {COUNTRY[row.countryCode] ?? row.countryCode} ·{" "}
                    {row.event?.name ?? "All their events there"}
                  </p>
                </div>
                {row.status === "PENDING" ? (
                  <ReviewButtons onReview={(next, note) => review(row.id, next, note)} />
                ) : (
                  <Pill tone={REVIEW_TONE[row.status]}>{REVIEW_LABEL[row.status]}</Pill>
                )}
              </div>
              <p className="text-sm">{row.details}</p>
              {row.evidence && (
                <a
                  href={row.evidence.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-primary-700 underline-offset-2 dark:text-primary-300 hover:underline"
                >
                  Open their evidence
                </a>
              )}
              {row.reviewNote && <p className="text-sm text-danger dark:text-red-300">{row.reviewNote}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusFilter: React.FC<{ value: TTaxReview; onChange: (value: TTaxReview) => void }> = ({ value, onChange }) => (
  <div className="flex gap-2" role="group" aria-label="Filter by review">
    {(["PENDING", "CONFIRMED", "REJECTED"] as TTaxReview[]).map((status) => (
      <button
        key={status}
        type="button"
        aria-pressed={value === status}
        onClick={() => onChange(status)}
        className={cn(
          "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
          value === status
            ? "border-secondary-800 bg-secondary-800 text-white dark:border-foreground dark:bg-foreground dark:text-background"
            : "border-border bg-card text-secondary-800 hover:bg-muted dark:text-foreground",
        )}
      >
        {REVIEW_LABEL[status]}
      </button>
    ))}
  </div>
);

/**
 * Turnupz's own registrations. On events Turnupz hosts, Turnupz is the seller,
 * so these decide whether tax is added to those tickets.
 */
/** The company that is Turnupz in each country. */
const TURNUPZ_ENTITY: Record<string, string> = {
  NG: "Nigeria · Turnupz Experience Limited",
  CA: "Canada · Turnupz Inc.",
};

const TurnupzTax = () => {
  const { data, isLoading } = useTurnupzTax();
  if (isLoading || !data) return <ListSkeleton />;
  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        On events Turnupz hosts, Turnupz is the seller. Where it&apos;s registered (and a decision is approved), tax is
        added to those tickets like any registered organiser&apos;s. Changes are recorded in the audit log.
      </p>
      {data.countries.map((country) => (
        <FinanceCard key={country.countryCode} title={TURNUPZ_ENTITY[country.countryCode] ?? COUNTRY[country.countryCode] ?? country.countryCode}>
          <div className="grid gap-3 md:grid-cols-2">
            {country.kinds.map((kind) => (
              <Registration
                key={kind.kind}
                kind={kind.kind}
                label={kind.label}
                example={kind.example}
                canadian={country.countryCode === "CA"}
                saved={data.registrations.find((row) => row.kind === kind.kind)}
                onSave={saveTurnupzTaxRegistration}
                queryKey={["turnupz-tax"]}
                who="turnupz"
              />
            ))}
          </div>
        </FinanceCard>
      ))}
    </div>
  );
};

const TABS = [
  ["decisions", "Decisions", Decisions],
  ["turnupz", "Turnupz's own", TurnupzTax],
  ["registrations", "Organiser registrations", Registrations],
  ["exemptions", "Exemption requests", Exemptions],
] as const;

/** What the adviser decided, and what organisers declared, in one place. */
const TaxAdmin = () => {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("decisions");
  const Active = TABS.find(([key]) => key === tab)![2];
  return (
    <div className="space-y-5 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Tax</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Tax is added to a ticket only where a decision here is approved and the organiser is registered to charge it.
          Everywhere else, prices stay as listed.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border pb-3" role="tablist">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              tab === key ? "bg-secondary-50 text-secondary-800 dark:bg-white/10 dark:text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  );
};

export default memo(TaxAdmin);
