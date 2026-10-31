"use client";

import ComboboxSelect from "@/components/ui/combobox-select";
import DateSelect from "@/components/ui/date-select";
import InputField from "@/components/ui/input-field";
import TextareaField from "@/components/ui/textarea-field";
import { earliestBirthDate, latestAdultBirthDate } from "@/lib/age";
import { useMarketOptions } from "@/hooks/use-markets";
import { BadgeCheck, Building2, Info, Ticket, UserRound } from "lucide-react";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ChoiceCards, DocumentField } from "../fields";
import { VerificationFormValues } from "../types";


/**
 * What they'll host. Free events only skips the ID, business and bank steps;
 * selling tickets is the full verification. A free host can come back and
 * finish verifying any time, and what they've entered stays.
 */
export const VendorTypeStep: React.FC<{ planLocked?: boolean }> = ({
  planLocked,
}) => {
  const { control, watch } = useFormContext<VerificationFormValues>();
  const plan = watch("plan");
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-secondary-950">
          What will you host?
        </p>
        <Controller
          control={control}
          name="plan"
          render={({ field, fieldState }) => (
            <>
              <ChoiceCards
                value={field.value}
                onChange={field.onChange}
                disabled={planLocked}
                options={[
                  {
                    value: "free",
                    title: "Free events only",
                    description:
                      "Your name, phone and country, and you can start hosting straight away. No ID or bank details.",
                    icon: Ticket,
                  },
                  {
                    value: "paid",
                    title: "Sell tickets",
                    description:
                      "Full verification with your ID and bank details, checked by our team. You get paid and get the verified tick.",
                    icon: BadgeCheck,
                  },
                ]}
              />
              {fieldState.error?.message && (
                <p className="text-xs text-red-600">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />
        {plan === "free" && (
          <div className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50/70 p-4 text-sm leading-6 text-secondary-800">
            <Info className="mt-0.5 size-4 shrink-0 text-primary-700" />
            <p>
              Host as many free and register-only events as you like, as soon as
              you send this. When you want to sell tickets, come back here and
              finish your verification with your ID and bank details; we&apos;ll
              keep what you&apos;ve already entered.
            </p>
          </div>
        )}
      </div>

      {plan === "paid" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-secondary-950">
            Who runs your events?
          </p>
          <Controller
            control={control}
            name="vendorType"
            render={({ field }) => (
              <ChoiceCards
                value={field.value}
                onChange={field.onChange}
                options={[
                  {
                    value: "individual",
                    title: "Individual",
                    description:
                      "You run events yourself and are paid to a personal account.",
                    icon: UserRound,
                  },
                  {
                    value: "business",
                    title: "Registered business",
                    description:
                      "A company runs the events and is paid to a business account. We'll ask for its registration.",
                    icon: Building2,
                  },
                ]}
              />
            )}
          />
        </div>
      )}
    </div>
  );
};

/** Free hosts only give their name, phone and country here. */
export const IdentityStep: React.FC<{ free?: boolean }> = ({ free }) => {
  // Organisers live where Turnupz is open (the backend's list).
  const COUNTRY_OPTIONS = useMarketOptions("name");
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<VerificationFormValues>();

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <InputField
        label={free ? "First name" : "Legal first name"}
        placeholder={free ? "Your first name" : "As on your ID"}
        autoComplete="given-name"
        required
        {...register("legalFirstName")}
        error={errors.legalFirstName?.message}
      />
      <InputField
        label={free ? "Last name" : "Legal last name"}
        placeholder={free ? "Your last name" : "As on your ID"}
        autoComplete="family-name"
        required
        {...register("legalLastName")}
        error={errors.legalLastName?.message}
      />
      {!free && (
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field, fieldState }) => (
            <DateSelect
              date={field.value}
              setDate={field.onChange}
              label="Date of birth"
              placeholder="Select your date of birth"
              required
              error={fieldState.error?.message}
              errorClassName="text-xs"
              helperText="You must be 18 or older."
              minDate={earliestBirthDate()}
              maxDate={latestAdultBirthDate()}
              inputClassName="h-11"
            />
          )}
        />
      )}
      <Controller
        control={control}
        name="phoneNumber"
        render={({ field, fieldState }) => (
          <InputField
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+234 801 234 5678"
            required
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            helperText="With your country code. We may call to confirm it's you."
          />
        )}
      />
      <Controller
        control={control}
        name="countryOfResidence"
        render={({ field, fieldState }) => (
          <ComboboxSelect
            label="Country of residence"
            required
            item={field.value}
            setItem={field.onChange}
            items={COUNTRY_OPTIONS}
            placeholder="Select a country"
            emptyText="No country found."
            error={fieldState.error?.message}
            errorClassName="text-xs"
          />
        )}
      />
      {!free && (
        <>
          <TextareaField
            label="Residential address"
            placeholder="House number, street, city"
            autoComplete="street-address"
            required
            containerClassName="md:col-span-2"
            {...register("address")}
            error={errors.address?.message}
          />
          <Controller
            control={control}
            name="idDocument"
            render={({ field, fieldState }) => (
              <div className="md:col-span-2">
                <DocumentField
                  label="Government ID"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  helperText="Passport, national ID, driver's licence or voter's card. The name and date of birth must match what you entered above."
                />
              </div>
            )}
          />
        </>
      )}
    </div>
  );
};

export const BusinessStep = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<VerificationFormValues>();
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <InputField
        label="Registered business name"
        placeholder="As on your registration certificate"
        autoComplete="organization"
        required
        {...register("businessName")}
        error={errors.businessName?.message}
      />
      <InputField
        label="Registration number"
        placeholder="e.g. RC 1234567"
        required
        {...register("businessRegistrationNumber")}
        error={errors.businessRegistrationNumber?.message}
      />
      <InputField
        label="Authorised representative"
        placeholder="Who can act for the business"
        required
        {...register("authorizedRepresentative")}
        error={errors.authorizedRepresentative?.message}
      />
      <InputField
        label="Tax ID"
        placeholder="If you have one"
        {...register("taxId")}
        error={errors.taxId?.message}
        helperText="Optional."
      />
      <TextareaField
        label="Registered business address"
        placeholder="As on your registration or tax records"
        required
        containerClassName="md:col-span-2"
        {...register("businessAddress")}
        error={errors.businessAddress?.message}
      />
    </div>
  );
};
