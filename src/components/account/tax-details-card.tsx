"use client";

import { uploadAttachment } from "@/api/attachments";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  requestTaxExemption,
  saveTaxRegistration,
  TExemptionReason,
  TTaxKind,
  TTaxRegistrationStatus,
  useVendorTax,
} from "@/hooks/use-tax";
import { useQueryClient } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";

const COUNTRY: Record<string, string> = { NG: "Nigeria", CA: "Canada" };
const REASONS: [TExemptionReason, string][] = [
  ["CHARITY", "Charity"],
  ["NON_PROFIT", "Non-profit"],
  ["EDUCATIONAL", "Educational"],
  ["CULTURAL", "Cultural"],
  ["OTHER", "Something else"],
];
const REVIEW: Record<string, string> = {
  PENDING: "We're checking this",
  CONFIRMED: "Confirmed",
  REJECTED: "Needs another look",
};
const field = "h-11 w-full rounded-xl border border-secondary-100 bg-white px-3 text-sm";

const failed = (error: unknown, fallback: string) =>
  toast.error(constructErrorMessage(error as TApiErrorResponseType, fallback));

const Registration: React.FC<{
  kind: TTaxKind;
  label: string;
  example?: string;
  canadian: boolean;
  saved?: { status: TTaxRegistrationStatus; number: string | null; reviewStatus: string; reviewNote: string | null };
}> = ({ kind, label, example, canadian, saved }) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TTaxRegistrationStatus | "">(saved?.status ?? "");
  const [number, setNumber] = useState(saved?.number ?? "");
  const [saving, setSaving] = useState(false);
  const changed = status !== (saved?.status ?? "") || number !== (saved?.number ?? "");

  const save = async () => {
    if (!status) return;
    setSaving(true);
    try {
      await saveTaxRegistration(kind, { status, ...(status === "REGISTERED" ? { number } : {}) });
      await queryClient.invalidateQueries({ queryKey: ["vendor-tax"] });
      toast.success(`${label} saved.`);
    } catch (error) {
      failed(error, `We couldn't save your ${label}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl border border-secondary-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-secondary-950">{label}</p>
        {saved?.status === "REGISTERED" && (
          <span className="text-xs font-medium text-secondary-500">{REVIEW[saved.reviewStatus]}</span>
        )}
      </div>
      <select
        className={field}
        aria-label={`Are you registered for ${label}?`}
        value={status}
        onChange={(event) => setStatus(event.target.value as TTaxRegistrationStatus)}
      >
        <option value="">Are you registered?</option>
        <option value="REGISTERED">Yes, I&apos;m registered</option>
        <option value="NOT_REGISTERED">No, I&apos;m not</option>
        {canadian && <option value="SMALL_SUPPLIER">I&apos;m a small supplier and didn&apos;t register</option>}
      </select>
      {status === "REGISTERED" && (
        <Input
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder={example ? `Your number, like ${example}` : "Your registration number"}
          aria-label={`${label} registration number`}
        />
      )}
      {saved?.reviewStatus === "REJECTED" && saved.reviewNote && (
        <p className="text-sm text-red-700">{saved.reviewNote}</p>
      )}
      {changed && !!status && (
        <Button size="sm" onClick={save} disabled={saving || (status === "REGISTERED" && !number.trim())}>
          {saving ? "Saving…" : "Save"}
        </Button>
      )}
    </div>
  );
};

const ExemptionForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const queryClient = useQueryClient();
  const [countryCode, setCountryCode] = useState("NG");
  const [reason, setReason] = useState<TExemptionReason>("CHARITY");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const evidence = await uploadAttachment(file, "TAX_EVIDENCE");
      await requestTaxExemption({ countryCode, reason, details, evidenceId: evidence.id });
      await queryClient.invalidateQueries({ queryKey: ["vendor-tax"] });
      toast.success("Sent. We'll let you know what we decide.");
      onDone();
    } catch (error) {
      failed(error, "We couldn't send your request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl bg-secondary-50/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className={field}
          aria-label="Country"
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
        >
          <option value="NG">Nigeria</option>
          <option value="CA">Canada</option>
        </select>
        <select
          className={field}
          aria-label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value as TExemptionReason)}
        >
          {REASONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <Textarea
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        placeholder="Why your events are exempt"
        aria-label="Why your events are exempt"
      />
      <label className="block space-y-1 text-sm font-medium text-secondary-800">
        A document that shows it, like your registration or exemption letter
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={saving || !file || details.trim().length < 10}>
          {saving ? "Sending…" : "Send request"}
        </Button>
        <Button size="sm" variant="outline" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

/** What the organiser declares about tax. Where it applies, buyers pay it at checkout. */
const TaxDetailsCard = () => {
  const { data } = useVendorTax();
  const [asking, setAsking] = useState(false);
  if (!data) return null;
  return (
    <section className="space-y-5 rounded-[1.5rem] border border-secondary-100 bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-secondary-50 p-2.5 text-secondary">
          <Receipt className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-secondary-950">Tax details</h2>
          <p className="text-sm text-secondary-500">
            If you&apos;re registered, tax goes on your tickets where it applies. It reaches you with your share of each
            sale, and sending it to the tax office is up to you.
          </p>
        </div>
      </div>
      {data.countries.map((country) => (
        <div key={country.countryCode} className="space-y-3">
          <p className="text-sm font-semibold text-secondary-800">{COUNTRY[country.countryCode]}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {country.kinds.map((item) => {
              const saved = data.registrations.find((row) => row.kind === item.kind);
              return (
                <Registration
                  // Starts again from what's saved once it's reloaded.
                  key={`${item.kind}:${saved?.status ?? ""}:${saved?.number ?? ""}`}
                  kind={item.kind}
                  label={item.label}
                  example={item.example}
                  canadian={country.countryCode === "CA"}
                  saved={saved}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div className="space-y-3 border-t border-secondary-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-secondary-950">Exemptions</p>
            <p className="text-sm text-secondary-500">For charities and others whose tickets don&apos;t carry tax.</p>
          </div>
          {!asking && (
            <Button size="sm" variant="outline" onClick={() => setAsking(true)}>
              Ask for an exemption
            </Button>
          )}
        </div>
        {asking && <ExemptionForm onDone={() => setAsking(false)} />}
        {data.exemptions.map((row) => (
          <div key={row.id} className="rounded-2xl border border-secondary-100 p-3 text-sm">
            <p className="font-medium text-secondary-950">
              {COUNTRY[row.countryCode] ?? row.countryCode} · {row.event?.name ?? "All your events there"}
            </p>
            <p className="text-secondary-500">{REVIEW[row.status]}</p>
            {row.reviewNote && <p className="text-red-700">{row.reviewNote}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default memo(TaxDetailsCard);
