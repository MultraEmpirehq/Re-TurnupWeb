"use client";

import { patchData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import DateSelect from "@/components/ui/date-select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InputField from "@/components/ui/input-field";
import Notice from "@/components/ui/notice";
import SelectField from "@/components/ui/select-field";
import StatusBadge from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import type { IIdentityDuplicate, IVendorVerification } from "@/lib/types";
import { toast } from "@/lib/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, PencilLine, TriangleAlert } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useState } from "react";
import {
  BUSINESS_DOCUMENT_TYPES,
  ID_TYPES,
  REPRESENTATIVE_ROLES,
  idHasNoExpiry,
  labelOf,
} from "../../vendor-verification/id-options";

const day = (value?: string | null) => (value ? format(new Date(value), "d MMM yyyy") : null);
const toDate = (value?: string | null) => (value ? new Date(value) : undefined);
const iso = (value?: Date) => (value ? format(value, "yyyy-MM-dd") : undefined);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-0.5">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm font-medium text-foreground">{children || <span className="text-warning">Not recorded</span>}</dd>
  </div>
);

/** Other accounts with the same number: a likely repeat or a borrowed ID. */
const Duplicates = ({ title, rows }: { title: string; rows: IIdentityDuplicate[] }) =>
  rows.length ? (
    <Notice tone="danger" icon={TriangleAlert} title={title}>
      <ul className="mt-1 space-y-1">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={`/app/admin/verifications/${row.id}`} className="font-semibold underline">
              {row.name}
            </Link>
            {row.email && row.email !== row.name ? ` · ${row.email}` : ""} · {row.status.replace(/_/g, " ")}
            {row.suspended ? " · suspended" : ""}
            {row.accountClosed ? " · account closed" : ""}
          </li>
        ))}
      </ul>
    </Notice>
  ) : null;

/**
 * The ID and business details read off the documents: which ID, its dates
 * and number (last 4; the full number with IDENTITY_REVEAL and a reason),
 * the business's document and representative, and any other account using
 * the same numbers. Admins add or correct them here.
 */
const IdentityPanel = ({ verification }: { verification: IVendorVerification }) => {
  const queryClient = useQueryClient();
  const { has } = useAdminPermissions();
  const isBusiness = verification.vendorType === "business";
  const [editing, setEditing] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [reason, setReason] = useState("");
  const [revealed, setRevealed] = useState<{ idNumber: string | null; taxId: string | null; businessRegistrationNumber: string | null } | null>(null);
  const [form, setForm] = useState({
    idType: verification.idType ?? "",
    idNumber: "",
    idIssuedOn: toDate(verification.idIssuedOn),
    idExpiresOn: toDate(verification.idExpiresOn),
    representativeRole: verification.representativeRole ?? "",
    businessDocumentType: verification.businessDocumentType ?? "",
    businessRegisteredOn: toDate(verification.businessRegisteredOn),
  });

  // Shown for a minute, then hidden again.
  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setRevealed(null), 60_000);
    return () => clearTimeout(timer);
  }, [revealed]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-user"] });
  };
  const failed = (error: unknown) =>
    toast.error(constructErrorMessage(error as TApiErrorResponseType, "That didn't go through"));

  const save = useMutation({
    mutationFn: () =>
      patchData(`/admin/vendor-verifications/${verification.id}/identity`, {
        idType: form.idType || undefined,
        idNumber: form.idNumber.trim() || undefined,
        idIssuedOn: iso(form.idIssuedOn),
        idExpiresOn: idHasNoExpiry(form.idType) ? undefined : iso(form.idExpiresOn),
        ...(isBusiness
          ? {
              representativeRole: form.representativeRole || undefined,
              businessDocumentType: form.businessDocumentType || undefined,
              businessRegisteredOn: iso(form.businessRegisteredOn),
            }
          : {}),
      }),
    onSuccess: () => {
      toast.success("Identity details saved.");
      setEditing(false);
      setForm((current) => ({ ...current, idNumber: "" }));
      refresh();
    },
    onError: failed,
  });

  const reveal = useMutation({
    mutationFn: async () =>
      (
        await postData<{ reason: string }, NonNullable<typeof revealed>>(
          `/admin/vendor-verifications/${verification.id}/reveal-identity`,
          { reason: reason.trim() },
        )
      ).data?.data ?? null,
    onSuccess: (data) => {
      setRevealed(data);
      setRevealing(false);
      setReason("");
    },
    onError: failed,
  });

  if (verification.identityPurgedAt) {
    return (
      <Notice tone="neutral" title="Identity details deleted">
        <p>
          The account closed, and its ID details and documents were deleted on {day(verification.identityPurgedAt)}, 5
          years later.
        </p>
      </Notice>
    );
  }

  const duplicates = verification.duplicates;
  const lastFour = (value?: string | null) => (value ? `•••• ${value}` : null);

  return (
    <div className="space-y-4">
      {duplicates && (
        <>
          <Duplicates title="This ID number is on another application" rows={duplicates.idNumber} />
          <Duplicates title="This registration number is on another application" rows={duplicates.registrationNumber} />
        </>
      )}

      {!editing ? (
        <>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label={isBusiness ? "Representative's ID" : "Type of ID"}>{labelOf(ID_TYPES, verification.idType)}</Row>
            <Row label="ID number">
              {revealed?.idNumber ? (
                <span className="font-mono">{revealed.idNumber}</span>
              ) : (
                lastFour(verification.idNumberLast4)
              )}
            </Row>
            <Row label="Issued (valid from)">{day(verification.idIssuedOn) ?? "—"}</Row>
            <Row label="Expires">
              {idHasNoExpiry(verification.idType) ? "Doesn't expire" : day(verification.idExpiresOn)}
            </Row>
            {isBusiness && (
              <>
                <Row label="Representative">
                  {[verification.authorizedRepresentative, labelOf(REPRESENTATIVE_ROLES, verification.representativeRole)]
                    .filter(Boolean)
                    .join(", ")}
                </Row>
                <Row label="Registration document">
                  {labelOf(BUSINESS_DOCUMENT_TYPES, verification.businessDocumentType)}
                </Row>
                <Row label="Registered">{day(verification.businessRegisteredOn) ?? "—"}</Row>
              </>
            )}
            {(verification.taxId || verification.taxIdLast4) && (
              <Row label="Tax ID">
                {verification.taxId ?? (revealed?.taxId ? <span className="font-mono">{revealed.taxId}</span> : lastFour(verification.taxIdLast4))}
              </Row>
            )}
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setEditing(true)}>
              <PencilLine className="size-4" aria-hidden /> Add or correct
            </Button>
            {has("IDENTITY_REVEAL") && (verification.idNumberLast4 || verification.taxIdLast4) && !revealed && (
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setRevealing(true)}>
                <Eye className="size-4" aria-hidden /> See full number
              </Button>
            )}
            {revealed && <StatusBadge tone="warning">Shown for a minute, and logged</StatusBadge>}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Read these off the documents on file. The number is stored encrypted.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={isBusiness ? "Representative's ID" : "Type of ID"}
              value={form.idType}
              setValue={(value) => setForm({ ...form, idType: value })}
              options={ID_TYPES}
              placeholder="Choose"
            />
            <InputField
              label="ID number"
              placeholder={verification.idNumberLast4 ? `On file: ending ${verification.idNumberLast4}` : "As printed on the ID"}
              helperText={verification.idNumberLast4 ? "Leave blank to keep it." : undefined}
              autoComplete="off"
              value={form.idNumber}
              onChange={(event) => setForm({ ...form, idNumber: event.target.value })}
            />
            <DateSelect
              date={form.idIssuedOn}
              setDate={(value) => setForm({ ...form, idIssuedOn: value })}
              label="Issued (valid from)"
              placeholder="If printed"
              maxDate={new Date()}
              minDate={new Date(new Date().getFullYear() - 50, 0, 1)}
              inputClassName="h-10"
            />
            {!idHasNoExpiry(form.idType) && (
              <DateSelect
                date={form.idExpiresOn}
                setDate={(value) => setForm({ ...form, idExpiresOn: value })}
                label="Expires"
                placeholder="As printed"
                maxDate={new Date(new Date().getFullYear() + 25, 11, 31)}
                inputClassName="h-10"
              />
            )}
            {isBusiness && (
              <>
                <SelectField
                  label="Representative's role"
                  value={form.representativeRole}
                  setValue={(value) => setForm({ ...form, representativeRole: value })}
                  options={REPRESENTATIVE_ROLES}
                  placeholder="Choose"
                />
                <SelectField
                  label="Registration document"
                  value={form.businessDocumentType}
                  setValue={(value) => setForm({ ...form, businessDocumentType: value })}
                  options={BUSINESS_DOCUMENT_TYPES}
                  placeholder="Choose"
                />
                <DateSelect
                  date={form.businessRegisteredOn}
                  setDate={(value) => setForm({ ...form, businessRegisteredOn: value })}
                  label="Registered"
                  placeholder="As on the certificate"
                  maxDate={new Date()}
                  minDate={new Date(1900, 0, 1)}
                  inputClassName="h-10"
                />
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" loading={save.isPending} onClick={() => save.mutate()}>
              Save details
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Dialog open={revealing} onOpenChange={setRevealing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>See the full number</DialogTitle>
            <DialogDescription>
              Say why you need it. Your name, the reason and the time go in the audit log, and it&apos;s shown for one
              minute.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={300}
            placeholder="e.g. Chargeback on order ORD-123: the payment provider asked for the organiser's ID"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRevealing(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={reason.trim().length < 10}
              loading={reveal.isPending}
              onClick={() => reveal.mutate()}
            >
              Show it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(IdentityPanel);
