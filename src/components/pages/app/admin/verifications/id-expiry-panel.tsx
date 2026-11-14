"use client";

import { patchData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import DateSelect from "@/components/ui/date-select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { IVendorVerification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format } from "date-fns";
import React, { memo, useState } from "react";

/**
 * The ID's expiry: set or corrected from the document on file (needed before
 * approving someone to sell), and a new ID an organiser sent, to accept or
 * turn down.
 */
const IdExpiryPanel = ({ verification }: { verification: IVendorVerification }) => {
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(
    verification.idExpiresOn ? new Date(verification.idExpiresOn) : undefined,
  );
  const [message, setMessage] = useState("");
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-user"] });
  };
  const failed = (error: unknown) =>
    toast.error(constructErrorMessage(error as TApiErrorResponseType, "That didn't go through"));

  const saveDate = useMutation({
    mutationFn: () =>
      patchData(`/admin/vendor-verifications/${verification.id}/id-expiry`, {
        idExpiresOn: format(date!, "yyyy-MM-dd"),
      }),
    onSuccess: () => {
      toast.success("Expiry date saved.");
      refresh();
    },
    onError: failed,
  });
  const review = useMutation({
    mutationFn: (approve: boolean) =>
      postData(`/admin/vendor-verifications/${verification.id}/id-renewal`, {
        approve,
        message: message.trim() || undefined,
      }),
    onSuccess: (_, approve) => {
      toast.success(approve ? "New ID accepted." : "Sent back with your note.");
      setMessage("");
      refresh();
    },
    onError: failed,
  });

  const expiry = verification.idExpiresOn ? new Date(verification.idExpiresOn) : null;
  const days = expiry ? differenceInCalendarDays(expiry, new Date()) : null;
  const changed =
    !!date && (!expiry || format(date, "yyyy-MM-dd") !== format(expiry, "yyyy-MM-dd"));

  return (
    <div className="space-y-4">
      <p
        className={cn(
          "text-sm",
          days === null ? "text-warning" : days < 0 ? "text-danger" : days <= 30 ? "text-warning" : "text-muted-foreground",
        )}
      >
        {days === null
          ? "No expiry date yet. Read it off the ID and add it: it's needed before approving them to sell."
          : days < 0
            ? `Expired ${-days} day${days === -1 ? "" : "s"} ago (${format(expiry!, "d MMM yyyy")}).`
            : `Valid until ${format(expiry!, "d MMM yyyy")}, ${days} day${days === 1 ? "" : "s"} from now.`}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <DateSelect
            date={date}
            setDate={setDate}
            label="ID expiry date"
            placeholder="As printed on the ID"
            maxDate={new Date(new Date().getFullYear() + 25, 11, 31)}
            inputClassName="h-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!changed}
          loading={saveDate.isPending}
          onClick={() => saveDate.mutate()}
        >
          Save date
        </Button>
      </div>

      {verification.idRenewalSubmittedAt && (
        <div className="space-y-3 rounded-lg border border-info-line bg-info-soft p-4">
          <p className="text-sm font-semibold text-info">
            New ID sent {format(new Date(verification.idRenewalSubmittedAt), "d MMM yyyy")}
          </p>
          <p className="text-sm text-info/80">
            It&apos;s the identity document above. Check it matches and the expiry date is right, then accept it.
            Accepting lifts a restriction made for the expired ID.
          </p>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            maxLength={500}
            placeholder="If turning it down: what's wrong (they see this)"
            className="bg-card"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" loading={review.isPending && review.variables === true} onClick={() => review.mutate(true)}>
              Accept new ID
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!message.trim()}
              loading={review.isPending && review.variables === false}
              onClick={() => review.mutate(false)}
            >
              Turn down
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(IdExpiryPanel);
