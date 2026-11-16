"use client";

import { postData } from "@/api";
import { uploadAttachment } from "@/api/attachments";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import DateSelect from "@/components/ui/date-select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, format } from "date-fns";
import { IdCard } from "lucide-react";
import React, { memo, useState } from "react";
import { DocumentField } from "./fields";
import type { VendorVerificationApiResponse } from "./types";

/** Days after expiry before new events and payouts pause; matches the api. */
const GRACE_DAYS = 14;

/**
 * An approved organiser's ID: when it expires, and uploading a new one. The
 * new one replaces it straight away and waits for the team to check it.
 */
const IdRenewalCard: React.FC<{
  expiresOn?: string | null;
  renewalSubmittedAt?: string | null;
  onRenewed: (data: VendorVerificationApiResponse) => void;
}> = ({ expiresOn, renewalSubmittedAt, onRenewed }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [newExpiry, setNewExpiry] = useState<Date | undefined>();
  const [busy, setBusy] = useState(false);

  const expiry = expiresOn ? new Date(expiresOn) : null;
  const days = expiry ? differenceInCalendarDays(expiry, new Date()) : null;
  const urgent = days !== null && days <= 30;
  const expired = days !== null && days < 0;

  const submit = async () => {
    if (!file || !newExpiry) return;
    setBusy(true);
    try {
      const attachment = await uploadAttachment(file, "ID_DOCUMENT");
      const { data } = await postData<
        { idDocumentId: string; idExpiresOn: string },
        VendorVerificationApiResponse
      >("/vendor/verification/id-renewal", {
        idDocumentId: attachment.id,
        idExpiresOn: format(newExpiry, "yyyy-MM-dd"),
      });
      if (data?.data) onRenewed(data.data);
      toast.success("Thanks. We'll check your new ID and let you know.");
      setOpen(false);
      setFile(null);
      setNewExpiry(undefined);
    } catch (error) {
      toast.error(
        constructErrorMessage(error as TApiErrorResponseType, "Couldn't upload your new ID"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="id-renewal-title"
      className={cn(
        "space-y-4 rounded-2xl border p-5",
        expired ? "border-danger-line bg-danger-soft" : urgent ? "border-warning-line bg-warning-soft" : "border-secondary-100",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <IdCard className="mt-0.5 size-5 shrink-0 text-secondary-700" aria-hidden />
          <div className="text-sm leading-6">
            <h2 id="id-renewal-title" className="font-semibold text-secondary-950">
              Your ID
            </h2>
            <p className="text-secondary-800">
              {renewalSubmittedAt
                ? "We're checking the new ID you sent. Everything carries on while we look."
                : !expiry
                  ? "We'll add its expiry date when we check it."
                  : expired
                    ? `Expired on ${format(expiry, "d MMMM yyyy")}. ${
                        -days! >= GRACE_DAYS
                          ? "New events and payouts are paused until a new one is approved."
                          : `Upload a new one within ${GRACE_DAYS + days!} day${GRACE_DAYS + days! === 1 ? "" : "s"}, or new events and payouts will pause.`
                      }`
                    : `Valid until ${format(expiry, "d MMMM yyyy")}.${urgent ? " Upload a new one before then to keep selling and getting paid." : ""}`}
            </p>
          </div>
        </div>
        {!open && !renewalSubmittedAt && (
          <Button
            type="button"
            variant={urgent ? "default" : "outline"}
            className="h-10 shrink-0 rounded-full px-5"
            onClick={() => setOpen(true)}
          >
            Upload a new ID
          </Button>
        )}
      </div>

      {open && (
        <div className="grid gap-4 rounded-xl bg-card p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <DocumentField
              label="New government ID"
              required
              value={file}
              onChange={setFile}
              helperText="Same name and date of birth as your application."
            />
          </div>
          <DateSelect
            date={newExpiry}
            setDate={setNewExpiry}
            label="When it expires"
            placeholder="As printed on the ID"
            required
            minDate={new Date()}
            maxDate={new Date(new Date().getFullYear() + 25, 11, 31)}
            inputClassName="h-11"
          />
          <div className="flex items-end gap-2 md:justify-end">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" loading={busy} disabled={!file || !newExpiry} onClick={() => submit()}>
              Send for checking
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default memo(IdRenewalCard);
