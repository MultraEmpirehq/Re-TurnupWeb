"use client";

import React, { memo, useCallback } from "react";
import dynamic from "next/dynamic";
import Joi from "joi";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import TextareaField from "@/components/ui/textarea-field";
import { Skeleton } from "@/components/ui/skeleton";
import VenueImagesInput from "./venue-images-input";
import type { IPlaceResolved } from "@/components/ui/google-places-autocomplete";

const GooglePlacesAutocomplete = dynamic(
  () => import("@/components/ui/google-places-autocomplete"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-full rounded-md" />,
  },
);

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
  postalCode: Joi.string().trim().required().messages({
    "string.empty": "Postal code is required",
    "any.required": "Postal code is required",
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.base": "Latitude is required",
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
    "any.required": "Latitude is required",
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.base": "Longitude is required",
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
    "any.required": "Longitude is required",
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
            <GooglePlacesAutocomplete
              label="Search Location"
              required
              value={field.value ?? ""}
              onChange={field.onChange}
              onPlaceSelected={handlePlaceSelected}
              placeholder="Search for the venue location..."
              error={errors?.address?.message}
              className="lg:col-span-2"
            />
          )}
        />

        <InputField
          label="Address"
          required
          readOnly
          error={errors?.address?.message}
          {...register("address")}
        />

        <InputField
          label="City"
          required
          readOnly
          error={errors?.city?.message}
          {...register("city")}
        />

        <InputField
          label="State"
          required
          readOnly
          error={errors?.state?.message}
          {...register("state")}
        />

        <InputField
          label="Country"
          required
          readOnly
          error={errors?.country?.message}
          {...register("country")}
        />

        <InputField
          label="Postal Code"
          required
          readOnly
          error={errors?.postalCode?.message}
          {...register("postalCode")}
        />

        <InputField
          label="Latitude"
          type="number"
          step="any"
          required
          readOnly
          error={errors?.latitude?.message}
          {...register("latitude", {
            setValueAs: (v) =>
              v === "" || v === null || v === undefined ? "" : Number(v),
          })}
        />

        <InputField
          label="Longitude"
          type="number"
          step="any"
          required
          readOnly
          error={errors?.longitude?.message}
          {...register("longitude", {
            setValueAs: (v) =>
              v === "" || v === null || v === undefined ? "" : Number(v),
          })}
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
