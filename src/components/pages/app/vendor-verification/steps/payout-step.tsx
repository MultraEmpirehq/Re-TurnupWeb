"use client";

import { getData, postData } from "@/api";
import ComboboxSelect from "@/components/ui/combobox-select";
import InputField from "@/components/ui/input-field";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Landmark, Lock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  findPayoutCountry,
  PAYOUT_COUNTRIES,
  SavedPayoutDigits,
  VerificationFormValues,
} from "../types";

const COUNTRY_OPTIONS = PAYOUT_COUNTRIES.map((country) => ({
  value: country.name,
  label: `${country.name} (${country.currency})`,
}));

/** A saved number's last four, as the placeholder, so blank keeps it. */
const savedHint = (last4?: string | null) =>
  last4 ? `Saved, ending ${last4}. Leave blank to keep it.` : undefined;

/**
 * Where the organiser is paid. The bank fields follow the country; where the
 * payment provider pays directly, the bank comes from its list and (in
 * Nigeria) the bank confirms whose account it is.
 */
const PayoutStep: React.FC<{ saved: SavedPayoutDigits }> = ({ saved }) => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<VerificationFormValues>();
  const [payoutCountry, bankCode, accountNumber, accountHolderName] = useWatch({
    control,
    name: ["payoutCountry", "bankCode", "accountNumber", "accountHolderName"],
  });
  const country = findPayoutCountry(payoutCountry);
  const fields = country?.fields ?? [];
  const direct = country?.directPayout ? country.code : undefined;

  const banks = useQuery({
    queryKey: ["payout-banks", direct],
    queryFn: async () => {
      const { data } = await getData<{ code: string; name: string }[]>(
        `/vendor/verification/banks?country=${direct}`,
      );
      return data?.data ?? [];
    },
    enabled: !!direct,
    staleTime: 60 * 60 * 1000,
  });

  // Ask the bank whose account it is once it's a full NUBAN with a bank picked,
  // after a pause in typing.
  const [toCheck, setToCheck] = useState<string>();
  useEffect(() => {
    const clean = (accountNumber ?? "").replace(/\s/g, "");
    const ready = direct === "NG" && /^\d{10}$/.test(clean) && !!bankCode;
    const timer = setTimeout(
      () => setToCheck(ready ? `${clean}:${bankCode}` : undefined),
      500,
    );
    return () => clearTimeout(timer);
  }, [direct, accountNumber, bankCode]);
  const accountName = useQuery({
    queryKey: ["payout-account-name", toCheck],
    queryFn: async () => {
      const [number, code] = (toCheck ?? "").split(":");
      const { data } = await postData<
        { accountNumber: string; bankCode: string },
        { accountName: string }
      >("/vendor/verification/resolve-account", {
        accountNumber: number,
        bankCode: code,
      });
      return data?.data?.accountName ?? null;
    },
    enabled: !!toCheck,
    retry: false,
    staleTime: Infinity,
  });

  // The bank's name for the account fills the holder's name, if they haven't.
  useEffect(() => {
    if (accountName.data && !accountHolderName?.trim()) {
      setValue("accountHolderName", accountName.data, { shouldValidate: true });
    }
  }, [accountName.data, accountHolderName, setValue]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Controller
          control={control}
          name="payoutCountry"
          render={({ field, fieldState }) => (
            <ComboboxSelect
              label="Where you'll be paid"
              required
              item={field.value}
              setItem={(value) => {
                if (value === field.value) return;
                field.onChange(value);
                // Another country has other bank fields: start them fresh.
                for (const key of [
                  "bankName",
                  "bankCode",
                  "accountNumber",
                  "routingNumber",
                  "sortCode",
                  "iban",
                  "swiftCode",
                ] as const) {
                  setValue(key, "");
                }
              }}
              items={COUNTRY_OPTIONS}
              placeholder="Select a country"
              emptyText="Payouts aren't available there yet."
              error={fieldState.error?.message}
              errorClassName="text-xs"
            />
          )}
        />
        <div className="flex flex-col">
          <span className="mb-2 text-sm font-medium opacity-70">Currency</span>
          <div className="flex h-11 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-secondary-700">
            {country
              ? `${country.currency}, set by the payout country`
              : "Set by the payout country"}
          </div>
        </div>
      </div>

      {country && (
        <div className="grid grid-cols-1 gap-5 rounded-2xl border border-secondary-100 p-5 md:grid-cols-2">
          <div className="flex items-start gap-3 md:col-span-2">
            <span className="rounded-xl bg-secondary-50 p-2.5 text-secondary-600">
              <Landmark className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-secondary-950">
                {country.name} bank account
              </p>
              <p className="text-xs leading-5 text-secondary-500">
                {country.stripePayout
                  ? "Our payment partner Stripe pays your share of each ticket straight to your bank. Once you're approved, you'll add your bank details with Stripe in your Wallet, so there's nothing to enter here except the name on the account."
                  : country.directPayout
                    ? "Your share of each ticket is paid straight to this account by our payment partner."
                    : "The account must be in your name, or your business's."}
              </p>
            </div>
          </div>

          {fields.includes("bankName") &&
            (country.directPayout ? (
              <Controller
                control={control}
                name="bankCode"
                render={({ field, fieldState }) => (
                  <ComboboxSelect
                    label="Bank"
                    required
                    item={field.value}
                    setItem={(code) => {
                      field.onChange(code);
                      const bank = banks.data?.find(
                        (item) => item.code === code,
                      );
                      setValue("bankName", bank?.name ?? "", {
                        shouldValidate: true,
                      });
                    }}
                    items={(banks.data ?? []).map((bank) => ({
                      value: bank.code,
                      label: bank.name,
                    }))}
                    isLoading={banks.isLoading}
                    refetch={banks.refetch}
                    fetchingError={
                      banks.error ? "Couldn't load banks." : undefined
                    }
                    placeholder="Search for your bank"
                    emptyText="No bank found."
                    error={
                      fieldState.error?.message ?? errors.bankName?.message
                    }
                    errorClassName="text-xs"
                  />
                )}
              />
            ) : (
              <InputField
                label="Bank name"
                placeholder="e.g. Barclays"
                required
                {...register("bankName")}
                error={errors.bankName?.message}
              />
            ))}

          {fields.includes("accountNumber") && (
            <div>
              <InputField
                label="Account number"
                inputMode="numeric"
                autoComplete="off"
                placeholder={
                  saved.accountNumberLast4
                    ? `•••• ${saved.accountNumberLast4}`
                    : country.code === "NG"
                      ? "0123456789"
                      : ""
                }
                required={!saved.accountNumberLast4}
                {...register("accountNumber")}
                error={errors.accountNumber?.message}
                helperText={
                  savedHint(saved.accountNumberLast4) ??
                  country.accountNumber?.hint
                }
              />
              {accountName.isFetching && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Checking with the bank…
                </p>
              )}
              {accountName.data && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="size-3.5" />
                  {accountName.data}
                </p>
              )}
              {accountName.isError && (
                <p className="mt-1.5 text-xs text-secondary-700">
                  The bank couldn&apos;t find this account. Check the number and
                  bank.
                </p>
              )}
            </div>
          )}

          {fields.includes("routingNumber") && (
            <InputField
              label={country.routingNumber?.label ?? "Routing number"}
              inputMode="numeric"
              required={!saved.routingNumberLast4}
              placeholder={
                saved.routingNumberLast4
                  ? `•••• ${saved.routingNumberLast4}`
                  : ""
              }
              {...register("routingNumber")}
              error={errors.routingNumber?.message}
              helperText={
                savedHint(saved.routingNumberLast4) ??
                country.routingNumber?.hint
              }
            />
          )}

          {fields.includes("sortCode") && (
            <InputField
              label="Sort code"
              inputMode="numeric"
              placeholder={
                saved.sortCodeLast4 ? `•••• ${saved.sortCodeLast4}` : "12-34-56"
              }
              required={!saved.sortCodeLast4}
              {...register("sortCode")}
              error={errors.sortCode?.message}
              helperText={savedHint(saved.sortCodeLast4)}
            />
          )}

          {fields.includes("iban") && (
            <InputField
              label="IBAN"
              autoCapitalize="characters"
              placeholder={
                saved.ibanLast4
                  ? `•••• ${saved.ibanLast4}`
                  : "AE07 0331 2345 6789 0123 456"
              }
              required={!saved.ibanLast4}
              {...register("iban")}
              error={errors.iban?.message}
              helperText={savedHint(saved.ibanLast4)}
            />
          )}

          {fields.includes("swiftCode") && (
            <InputField
              label="SWIFT / BIC code"
              autoCapitalize="characters"
              placeholder="e.g. EBILAEAD"
              required
              {...register("swiftCode")}
              error={errors.swiftCode?.message}
            />
          )}

          <InputField
            label="Account holder name"
            placeholder="Exactly as the bank has it"
            required
            containerClassName="md:col-span-2"
            {...register("accountHolderName")}
            error={errors.accountHolderName?.message}
            helperText="It must match your legal name, or your registered business name."
          />

          {!country.stripePayout && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground md:col-span-2">
              <Lock className="size-3.5" />
              Bank details are encrypted. Only the last four digits are ever
              shown back.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PayoutStep;
