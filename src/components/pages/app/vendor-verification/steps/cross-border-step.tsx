"use client";

import ComboboxSelect from "@/components/ui/combobox-select";
import { Switch } from "@/components/ui/switch";
import TextareaField from "@/components/ui/textarea-field";
import { useMarketOptions } from "@/hooks/use-markets";
import { X } from "lucide-react";
import React from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { DocumentField, FieldShell } from "../fields";
import { VerificationFormValues } from "../types";

/**
 * Optional: only for organisers who'll sell tickets to events outside their own
 * country, which needs its own approval level.
 */
const CrossBorderStep = () => {
  // Events can only be where Turnupz is open (the backend's list).
  const COUNTRY_OPTIONS = useMarketOptions("name");
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<VerificationFormValues>();
  const hostsAbroad = useWatch({ control, name: "hostsAbroad" });

  return (
    <div className="space-y-6">
      <Controller
        control={control}
        name="hostsAbroad"
        render={({ field }) => (
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-secondary-100 p-4">
            <span>
              <span className="block text-sm font-semibold text-secondary-950">
                I&apos;ll host paid events in other countries
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-secondary-500">
                Leave this off if all your events are in your own country. You
                can come back to it later.
              </span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />

      {hostsAbroad && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            control={control}
            name="crossBorderCountries"
            render={({ field, fieldState }) => (
              <FieldShell
                label="Countries you'll host in"
                required
                error={fieldState.error?.message}
                className="md:col-span-2"
              >
                <ComboboxSelect
                  item=""
                  setItem={(value) => {
                    if (value && !field.value.includes(value)) {
                      field.onChange([...field.value, value]);
                    }
                  }}
                  items={COUNTRY_OPTIONS.filter(
                    (option) => !field.value.includes(option.value),
                  )}
                  placeholder="Search to add a country"
                  emptyText="No country found."
                />
                {field.value.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {field.value.map((value) => (
                      <span
                        key={value}
                        className="inline-flex items-center gap-1.5 rounded-full border border-secondary-200 bg-secondary-50 px-3 py-1 text-xs font-semibold text-secondary-800"
                      >
                        {COUNTRY_OPTIONS.find(
                          (option) => option.value === value,
                        )?.label ?? value}
                        <button
                          type="button"
                          onClick={() =>
                            field.onChange(
                              field.value.filter((item) => item !== value),
                            )
                          }
                          className="rounded-full p-0.5 text-secondary-400 hover:bg-secondary-200 hover:text-secondary-700"
                          aria-label={`Remove ${value}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </FieldShell>
            )}
          />
          <TextareaField
            label="Why you'll host there"
            placeholder="e.g. We run a yearly tour with shows in Accra and London."
            required
            containerClassName="md:col-span-2"
            {...register("crossBorderReason")}
            error={errors.crossBorderReason?.message}
          />
          <Controller
            control={control}
            name="supportingDocument"
            render={({ field, fieldState }) => (
              <div className="md:col-span-2">
                <DocumentField
                  label="Supporting document"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  helperText="Optional: a venue booking, partnership letter or business registration abroad helps us approve you faster."
                />
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default CrossBorderStep;
