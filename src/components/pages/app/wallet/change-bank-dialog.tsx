"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ComboboxSelect from "@/components/ui/combobox-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InputField from "@/components/ui/input-field";
import {
  resolvePayoutAccountName,
  useChangePayoutBank,
  usePayoutBanks,
} from "@/hooks/use-vendor-wallet";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { toast } from "@/lib/toast";

/**
 * Moves an organiser's Flutterwave payouts to another bank account. The bank
 * confirms the name on the account (Nigeria) before it's saved, and their
 * password is asked for, since it decides where their money goes.
 */
const ChangeBankDialog = ({
  open,
  onOpenChange,
  country,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The payout country's code, e.g. NG. */
  country: string;
}) => {
  const banks = usePayoutBanks(open ? country : undefined);
  const change = useChangePayoutBank();
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) {
      setBankCode("");
      setAccountNumber("");
      setPassword("");
    }
  }, [open]);

  const clean = accountNumber.replace(/\s/g, "");
  const canCheck = country === "NG" && /^\d{10}$/.test(clean) && !!bankCode;
  const accountName = useQuery({
    queryKey: ["payout-account-name", clean, bankCode],
    queryFn: () => resolvePayoutAccountName(clean, bankCode),
    enabled: canCheck,
    retry: false,
    staleTime: Infinity,
  });
  const bankName = banks.data?.find((bank) => bank.code === bankCode)?.name;
  const ready =
    !!bankCode &&
    /^\d{6,20}$/.test(clean) &&
    !!password &&
    (country !== "NG" || !!accountName.data);

  const save = async () => {
    try {
      await change.mutateAsync({ bankCode, bankName, accountNumber: clean, password });
      toast.success(`Your payouts now go to ${bankName ?? "your new bank"} ••${clean.slice(-4)}.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        constructErrorMessage(error as TApiErrorResponseType, "Couldn't change your bank."),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.6rem] p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change the bank you&apos;re paid to</DialogTitle>
          <DialogDescription>
            Ticket earnings from now on go to the new account. We&apos;ll email
            you to confirm the change.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ComboboxSelect
            label="Bank"
            required
            item={bankCode}
            setItem={setBankCode}
            items={(banks.data ?? []).map((bank) => ({ value: bank.code, label: bank.name }))}
            isLoading={banks.isLoading}
            refetch={banks.refetch}
            fetchingError={banks.error ? "Couldn't load banks." : undefined}
            placeholder="Search for your bank"
            emptyText="No bank found."
          />
          <div>
            <InputField
              label="Account number"
              inputMode="numeric"
              autoComplete="off"
              placeholder={country === "NG" ? "0123456789" : "Account number"}
              required
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              helperText={country === "NG" ? "Your 10-digit NUBAN." : undefined}
            />
            {accountName.isFetching && (
              <p className="mt-1.5 text-xs text-muted-foreground">Checking with the bank…</p>
            )}
            {accountName.data && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                {accountName.data}
              </p>
            )}
            {accountName.isError && (
              <p className="mt-1.5 text-xs text-secondary-700">
                The bank couldn&apos;t find this account. Check the number and bank.
              </p>
            )}
          </div>
          <InputField
            label="Your Turnupz password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helperText="Signed up with Google or Apple? Set a password with Forgot password on the sign-in page first."
          />
          <Button
            className="w-full rounded-full"
            onClick={() => void save()}
            disabled={!ready}
            loading={change.isPending}
          >
            Move my payouts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ChangeBankDialog);
