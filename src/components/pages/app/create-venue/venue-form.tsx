"use client";

import React, { memo, useCallback } from "react";
import Joi from "joi";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import TextareaField from "@/components/ui/textarea-field";
import VenueImagesInput from "./venue-images-input";
import AddressField, { type IPlaceResolved } from "@/components/ui/address-field";


const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export interface IVenueFormValues {
  name: string;
  locationSearch: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number | "";
  longitude: number | "";
  totalAvailableSeat: number | "";
  description: string;
  images: File[];
}

function validateImage(
  value: unknown,
  helpers: Joi.CustomHelpers,
): File | Joi.ErrorReport {
  if (!(value instanceof File)) {
    return helpers.error("any.custom", {
      message: "Please select an image file",
    });
  }
  if (value.size > MAX_FILE_SIZE) {
    return helpers.error("any.custom", {
      message: "File size must be less than 5MB",
    });
  }
  if (!ALLOWED_TYPES.includes(value.type)) {
    return helpers.error("any.custom", {
      message: "Only .jpg, .png, .webp are supported",
    });
  }
  return value;
}

export const venueFormSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Venue name is required",
    "any.required": "Venue name is required",
  }),
  locationSearch: Joi.string().allow("").optional(),
  address: Joi.string().trim().required().messages({
    "string.empty": "Address is required",
    "any.required": "Address is required",
  }),
  city: Joi.string().trim().required().messages({
    "string.empty": "City is required",
    "any.required": "City is required",
  }),
  state: Joi.string().trim().required().messages({
    "string.empty": "State is required",
    "any.required": "State is required",
  }),
  country: Joi.string().trim().required().messages({
    "string.empty": "Country is required",
    "any.required": "Country is required",
  }),
  // Plenty of addresses (most in Nigeria) have none.
  postalCode: Joi.string().trim().allow("").optional(),
  // Filled from the search, never typed: placing the venue on the map.
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.base": "Pick the venue from the search results",
    "any.required": "Pick the venue from the search results",
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.base": "Pick the venue from the search results",
    "any.required": "Pick the venue from the search results",
  }),
  totalAvailableSeat: Joi.number().integer().min(1).required().messages({
    "number.base": "Total available seats is required",
    "number.min": "Must be at least 1 seat",
    "any.required": "Total available seats is required",
  }),
  description: Joi.string().trim().required().messages({
    "string.empty": "Description is required",
    "any.required": "Description is required",
  }),
  images: Joi.array()
    .items(Joi.any().custom(validateImage))
    .min(1)
    .required()
    .messages({
      "array.min": "Please add at least one image",
      "any.required": "Please add at least one image",
    }),
}).unknown(true);

const VenueForm: React.FC<{
  onSubmit: () => Promise<void>;
}> = ({ onSubmit }) => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useFormContext<IVenueFormValues>();

  // What the search found, shown as a one-line summary instead of boxes.
  const city = useWatch({ control, name: "city" });
  const state = useWatch({ control, name: "state" });
  const country = useWatch({ control, name: "country" });
  const place = city || state || country ? { city, state, country } : null;

  const handlePlaceSelected = useCallback(
    (place: IPlaceResolved) => {
      setValue("locationSearch", place.formattedAddress, {
        shouldValidate: true,
      });
      setValue("address", place.address, { shouldValidate: true });
      setValue("city", place.city, { shouldValidate: true });
      setValue("state", place.state, { shouldValidate: true });
      setValue("country", place.country, { shouldValidate: true });
      setValue("postalCode", place.postalCode, { shouldValidate: true });
      setValue("latitude", place.latitude, { shouldValidate: true });
      setValue("longitude", place.longitude, { shouldValidate: true });
    },
    [setValue],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 md:space-y-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <InputField
          label="Venue Name"
          required
          error={errors?.name?.message}
          {...register("name")}
        />

        <InputField
          label="Total Available Seats"
          type="number"
          min={1}
          required
          error={errors?.totalAvailableSeat?.message}
          {...register("totalAvailableSeat", {
            setValueAs: (v) =>
              v === "" || v === null || v === undefined ? "" : Number(v),
          })}
        />

        <Controller
          control={control}
          name="locationSearch"
          render={({ field }) => (
            <AddressField
              label="Search Location"
              required
              value={field.value ?? ""}
              onChange={field.onChange}
              onPlace={handlePlaceSelected}
              placeholder="Search the venue's name or address"
              error={
                errors?.latitude?.message ??
                (place ? undefined : errors?.address?.message)
              }
              className="lg:col-span-2"
            />
          )}
        />

        <p className="-mt-4 text-xs text-muted-foreground lg:col-span-2">
          Can&apos;t find it? Search the street or a landmark next to it, then
          correct the street address below.
        </p>

        {place && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground lg:col-span-2">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
            {[place.city, place.state, place.country].filter(Boolean).join(", ")}
          </p>
        )}

        {/* Hidden fields filled by the search: say so if one came back empty. */}
        {place && (errors?.city || errors?.state || errors?.country) && (
          <p role="alert" className="-mt-4 text-sm text-danger lg:col-span-2">
            That result has no {errors?.city ? "city" : errors?.state ? "state" : "country"}.
            Search a street or landmark nearby instead.
          </p>
        )}

        <InputField
          label="Street address"
          required
          error={errors?.address?.message}
          {...register("address")}
        />

        <InputField
          label="Postal code (optional)"
          error={errors?.postalCode?.message}
          {...register("postalCode")}
        />

        <TextareaField
          label="Description"
          className="lg:col-span-2"
          required
          error={errors?.description?.message}
          {...register("description")}
        />

        <Controller
          control={control}
          name="images"
          render={({ field, fieldState }) => (
            <VenueImagesInput
              images={field.value ?? []}
              setImages={field.onChange}
              error={fieldState?.error?.message}
              required
            />
          )}
        />
      </div>

      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        loading={isSubmitting}
      >
        Create Venue
      </Button>
    </form>
  );
};

export default memo(VenueForm);
