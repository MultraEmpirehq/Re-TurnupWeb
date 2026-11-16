"use client";

import ComboboxSelect from "@/components/ui/combobox-select";
import DateSelect from "@/components/ui/date-select";
import InputField from "@/components/ui/input-field";
import PhoneField from "@/components/ui/phone-field";
import { earliestBirthDate, latestAdultBirthDate } from "@/lib/age";
import { useMarketOptions } from "@/hooks/use-markets";
import { Country } from "country-state-city";
import { BadgeCheck, Building2, Info, Ticket, UserRound } from "lucide-react";
import useUserStore from "@/stores/user-store";
import React, { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import AddressField from "@/components/ui/address-field";
import { ChoiceCards, DocumentField } from "../fields";
import { VerificationFormValues } from "../types";
import SelectField from "@/components/ui/select-field";
import {
  BUSINESS_DOCUMENT_TYPES,
  ID_TYPES,
  REPRESENTATIVE_ROLES,
  idHasNoExpiry,
  idNeedsExpiry,
} from "../id-options";


/**
 * What they'll host. Free events only skips the ID, business and bank steps;
 * selling tickets is the full verification. A free host can come back and
 * finish verifying any time, and what they've entered stays.
 */
export const VendorTypeStep: React.FC<{ planLocked?: boolean }> = ({
  planLocked,
}) => {
  const {
    control,
    watch,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<VerificationFormValues>();
  const plan = watch("plan");
  const vendorType = watch("vendorType");
  const isBusiness = plan === "paid" && vendorType === "business";
  const user = useUserStore((state) => state.userDetails);
  const ownName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  // An individual usually runs events under their own name: start with it.
  useEffect(() => {
    if (!isBusiness && ownName && !getValues("organiserName")) {
      setValue("organiserName", ownName);
    }
  }, [isBusiness, ownName, getValues, setValue]);
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
                <p className="text-xs text-danger">
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

      {plan && (
        <InputField
          label="Organiser name"
          placeholder={isBusiness ? "e.g. Afrobeat Live" : ownName || "e.g. DJ Kemi"}
          autoComplete="organization"
          required
          {...register("organiserName")}
          error={errors.organiserName?.message}
          helperText={
            isBusiness
              ? "The name people know you by, shown as “Organised by” on your events. It can differ from your registered company name."
              : "Shown as “Organised by” on your events. Use your own name, or a brand or stage name like “DJ Kemi” or “Ada's Parties”."
          }
        />
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
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<VerificationFormValues>();
  const idType = watch("idType");
  const idNumberLast4 = watch("idNumberLast4");

  // What they already told us when they signed up, so it isn't asked twice.
  // Only empty fields are filled, and each can still be changed (an ID may
  // carry a fuller legal name than the profile).
  const user = useUserStore((state) => state.userDetails);
  useEffect(() => {
    if (!user) return;
    type TFillable = "legalFirstName" | "legalLastName" | "phoneNumber" | "countryOfResidence" | "dateOfBirth";
    const fill = (key: TFillable, value: string | Date | undefined | null) => {
      if (value && !getValues(key)) {
        setValue(key, value as never, { shouldDirty: true });
      }
    };
    fill("legalFirstName", user.firstName);
    fill("legalLastName", user.lastName);
    fill("phoneNumber", user.phone);
    if (!free && user.dateOfBirth) fill("dateOfBirth", new Date(user.dateOfBirth));
    // The profile keeps a country code or name; this form keeps the name of a
    // country Turnupz is open in.
    const countryName =
      (user.countryCode && Country.getCountryByCode(user.countryCode)?.name) ||
      (user.country && Country.getCountryByCode(user.country)?.name) ||
      user.country;
    if (countryName && COUNTRY_OPTIONS.some((option) => option.value === countryName)) {
      fill("countryOfResidence", countryName);
    }
  }, [user, free, COUNTRY_OPTIONS, getValues, setValue]);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <InputField
        label={free ? "First name" : "Legal first name"}
        placeholder={free ? "Your first name" : "As on your ID"}
        helperText={free ? undefined : "Filled in from your profile. Change it if your ID shows it differently."}
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
          <PhoneField
            label="Phone number"
            required
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            defaultCountry={user?.countryCode}
            error={fieldState.error?.message}
            helperText="We may call to confirm it's you."
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
          <Controller
            control={control}
            name="address"
            render={({ field, fieldState }) => (
              <AddressField
                label="Residential address"
                placeholder="House number, street, city"
                required
                anyCountry
                className="md:col-span-2"
                value={field.value ?? ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
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
          <Controller
            control={control}
            name="idType"
            render={({ field, fieldState }) => (
              <SelectField
                label="Type of ID"
                required
                value={field.value}
                setValue={field.onChange}
                options={ID_TYPES}
                placeholder="Choose the ID you uploaded"
                error={fieldState.error?.message}
                inputClassName="h-11"
              />
            )}
          />
          <InputField
            label="ID number"
            placeholder={idNumberLast4 ? `On file: ending ${idNumberLast4}` : "As printed on the ID"}
            required={!idNumberLast4}
            autoComplete="off"
            {...register("idNumber")}
            error={errors.idNumber?.message}
            helperText={
              idNumberLast4
                ? "Leave it blank to keep the one on file."
                : "Kept encrypted. Only the last 4 are ever shown, and only our verification team can see it in full."
            }
          />
          <Controller
            control={control}
            name="idIssuedOn"
            render={({ field, fieldState }) => (
              <DateSelect
                date={field.value}
                setDate={field.onChange}
                label="Issue date (valid from)"
                placeholder="When the ID was issued"
                error={fieldState.error?.message}
                errorClassName="text-xs"
                helperText="If it's printed on the ID."
                minDate={new Date(new Date().getFullYear() - 50, 0, 1)}
                maxDate={new Date()}
                inputClassName="h-11"
              />
            )}
          />
          {!idHasNoExpiry(idType) && (
            <Controller
              control={control}
              name="idExpiresOn"
              render={({ field, fieldState }) => (
                <DateSelect
                  date={field.value}
                  setDate={field.onChange}
                  label="ID expiry date"
                  placeholder="When your ID expires"
                  required={idNeedsExpiry(idType)}
                  error={fieldState.error?.message}
                  errorClassName="text-xs"
                  helperText={
                    idNeedsExpiry(idType)
                      ? "As printed on the ID. We'll remind you to upload a new one before it expires."
                      : "If your ID has one. We'll remind you before it expires."
                  }
                  minDate={new Date()}
                  maxDate={new Date(new Date().getFullYear() + 25, 11, 31)}
                  inputClassName="h-11"
                />
              )}
            />
          )}
        </>
      )}
    </div>
  );
};

export const BusinessStep = () => {
  const {
    register,
    formState: { errors },
    control,
    watch,
  } = useFormContext<VerificationFormValues>();
  const taxIdLast4 = watch("taxIdLast4");
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
      <Controller
        control={control}
        name="businessDocumentType"
        render={({ field, fieldState }) => (
          <SelectField
            label="Registration document"
            required
            value={field.value}
            setValue={field.onChange}
            options={BUSINESS_DOCUMENT_TYPES}
            placeholder="What proves the business exists"
            error={fieldState.error?.message}
            helperText="Upload it under Supporting document."
            inputClassName="h-11"
          />
        )}
      />
      <Controller
        control={control}
        name="businessRegisteredOn"
        render={({ field, fieldState }) => (
          <DateSelect
            date={field.value}
            setDate={field.onChange}
            label="Date registered"
            placeholder="As on the certificate"
            error={fieldState.error?.message}
            errorClassName="text-xs"
            minDate={new Date(1900, 0, 1)}
            maxDate={new Date()}
            inputClassName="h-11"
          />
        )}
      />
      <InputField
        label="Authorised representative"
        placeholder="Your full name, as on your ID"
        required
        {...register("authorizedRepresentative")}
        error={errors.authorizedRepresentative?.message}
        helperText="The person applying. The ID you uploaded should be theirs."
      />
      <Controller
        control={control}
        name="representativeRole"
        render={({ field, fieldState }) => (
          <SelectField
            label="Their role in the business"
            required
            value={field.value}
            setValue={field.onChange}
            options={REPRESENTATIVE_ROLES}
            placeholder="Choose a role"
            error={fieldState.error?.message}
            inputClassName="h-11"
          />
        )}
      />
      <InputField
        label="Tax ID"
        placeholder={taxIdLast4 ? `On file: ending ${taxIdLast4}` : "If you have one"}
        {...register("taxId")}
        error={errors.taxId?.message}
        helperText={taxIdLast4 ? "Leave it blank to keep the one on file." : "Optional."}
      />
      <Controller
        control={control}
        name="businessAddress"
        render={({ field, fieldState }) => (
          <AddressField
            label="Registered business address"
            placeholder="As on your registration or tax records"
            required
            anyCountry
            className="md:col-span-2"
            value={field.value ?? ""}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
    </div>
  );
};
