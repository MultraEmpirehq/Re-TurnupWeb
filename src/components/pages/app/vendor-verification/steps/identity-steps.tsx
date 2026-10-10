"use client";

import ComboboxSelect from "@/components/ui/combobox-select";
import DateSelect from "@/components/ui/date-select";
import InputField from "@/components/ui/input-field";
import TextareaField from "@/components/ui/textarea-field";
import { earliestBirthDate, latestAdultBirthDate } from "@/lib/age";
import { getAllCountryOptions } from "@/lib/vendor-verification-helpers";
import { Building2, UserRound } from "lucide-react";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ChoiceCards, DocumentField } from "../fields";
import { VerificationFormValues } from "../types";

const COUNTRY_OPTIONS = getAllCountryOptions();

export const VendorTypeStep = () => {
  const { control } = useFormContext<VerificationFormValues>();
  return (
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
  );
};

export const IdentityStep = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<VerificationFormValues>();

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <InputField
        label="Legal first name"
        placeholder="As on your ID"
        autoComplete="given-name"
        required
        {...register("legalFirstName")}
        error={errors.legalFirstName?.message}
      />
      <InputField
        label="Legal last name"
        placeholder="As on your ID"
        autoComplete="family-name"
        required
        {...register("legalLastName")}
        error={errors.legalLastName?.message}
      />
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
