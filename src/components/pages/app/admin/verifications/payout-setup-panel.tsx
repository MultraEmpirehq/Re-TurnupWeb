"use client";

import { getData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ComboboxSelect from "@/components/ui/combobox-select";
import { PayoutSetupAttempt } from "@/hooks/use-vendor-wallet";
import { IVendorVerification } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

/** Payout countries the payment provider pays vendors in directly, by name or code. */
const DIRECT_PAYOUT_COUNTRIES: Record<string, string> = {
  nigeria: "NG",
  ng: "NG",
  "south africa": "ZA",
  za: "ZA",
};

/** How a setup attempt went, for the admin. */
const adminAttemptMessage = (attempt?: PayoutSetupAttempt) => {
  switch (attempt?.status) {
    case undefined:
    case "active":
      return null;
    case "not_approved":
      return "The vendor isn't approved yet.";
    case "unsupported_country":
      return "Direct payouts aren't offered in their payout country.";
    case "not_configured":
      return "The payment provider's keys aren't set on this server.";
    case "missing_details":
      return `Missing from their application: ${attempt.missing.join(", ")}.`;
    case "failed":
      return `The payment provider refused: ${attempt.message}`;
  }
};

/**
 * Where an approved vendor is paid. Approval sets it up; this shows how that
 * went and lets an admin retry, picking the bank for vendors approved before
 * banks came from the provider's list.
 */
const PayoutSetupPanel: React.FC<{ verification: IVendorVerification }> = ({
  verification,
}) => {
  const queryClient = useQueryClient();
  const account = verification.payoutAccount;
  const country =
    DIRECT_PAYOUT_COUNTRIES[
      verification.payoutCountry?.trim().toLowerCase() ?? ""
    ];
  const [bankCode, setBankCode] = useState(verification.bankCode ?? "");
  const [attempt, setAttempt] = useState<PayoutSetupAttempt>();

  const banks = useQuery({
    queryKey: ["payout-banks", country],
    queryFn: async () => {
      const { data } = await getData<{ code: string; name: string }[]>(
        `/vendor/verification/banks?country=${country}`,
      );
      return data?.data ?? [];
    },
    enabled: !!country && !account,
    staleTime: 60 * 60 * 1000,
  });

  const setUp = useMutation({
    mutationFn: async () => {
      const { data } = await postData<
        { bankCode?: string },
        { attempt?: PayoutSetupAttempt }
      >(`/admin/vendor-verifications/${verification.id}/payout-account`, {
        ...(bankCode ? { bankCode } : {}),
      });
      return data?.data?.attempt;
    },
    onSuccess: (result) => {
      setAttempt(result);
      if (result?.status === "active") toast.success("Payouts set up.");
      void queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    },
    onError: (error) =>
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't set up payouts.",
        ),
      ),
  });

  if (verification.status !== "approved") return null;

  if (account) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
        <Landmark className="mt-0.5 size-4 shrink-0" />
        <p>
          Paid directly by {account.provider.toLowerCase()} to{" "}
          <span className="font-semibold">
            {account.bankName ?? "their bank"}
            {account.accountLast4 ? ` ••${account.accountLast4}` : ""}
          </span>{" "}
          ({account.currency}
          {account.livemode ? "" : ", test mode"}).
        </p>
      </div>
    );
  }

  if (!country) {
    return (
      <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        Direct payouts aren&apos;t available for {verification.payoutCountry}{" "}
        yet, so this vendor&apos;s sales are collected by Turnupz for now.
      </p>
    );
  }

  const message = adminAttemptMessage(attempt);
  return (
    <div className="space-y-3 rounded-xl border border-secondary-100 bg-secondary-50/60 p-4 text-sm">
      <p className="font-medium text-secondary-900">
        Not set up to be paid directly yet.
      </p>
      {!verification.bankCode && (
        <ComboboxSelect
          label={`Their bank (they entered "${verification.bankName ?? "none"}")`}
          item={bankCode}
          setItem={setBankCode}
          items={(banks.data ?? []).map((bank) => ({
            value: bank.code,
            label: bank.name,
          }))}
          isLoading={banks.isLoading}
          refetch={banks.refetch}
          placeholder="Pick their bank"
          emptyText="No bank found."
        />
      )}
      {message && <p className="text-secondary-800">{message}</p>}
      <Button
        size="sm"
        onClick={() => setUp.mutate()}
        loading={setUp.isPending}
        disabled={!verification.bankCode && !bankCode}
        className="rounded-full"
      >
        Set up payouts
      </Button>
    </div>
  );
};

export default PayoutSetupPanel;
