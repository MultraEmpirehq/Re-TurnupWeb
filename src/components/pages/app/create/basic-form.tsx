"use client";
import React, { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import Joi from "joi";
import { Button } from "@/components/ui/button";
import CustomImageComponent from "@/components/ui/custom-image.component";
import InputField from "@/components/ui/input-field";
import { Input } from "@/components/ui/input";
import DateSelect from "@/components/ui/date-select";
import TextareaField from "@/components/ui/textarea-field";
import { Skeleton } from "@/components/ui/skeleton";
import SelectField from "@/components/ui/select-field";
import { TrashIcon, UploadIcon } from "lucide-react";
import { City, Country, State } from "country-state-city";

const ComboboxSelect = dynamic(
  () => import("@/components/ui/combobox-select"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-full rounded-md" />,
  },
);
const VenueSelect = dynamic(() => import("@/components/ui/venue-select"), {
  ssr: false,
  loading: () => <Skeleton className="h-10 w-full rounded-md" />,
});
import GuestNamesInput from "./guest-names-input";
import EventActivitiesInput, { IEventActivity } from "./event-activities-input";
import { Controller, useFormContext } from "react-hook-form";
import useCategory from "@/hooks/use-category";
import { TComboboxItem } from "@/components/ui/combobox-select";
import { constructErrorMessage } from "@/api/functions";
import {
  saveCustomCategory,
  saveCustomVenue,
} from "@/lib/custom-event-options";
import { toast } from "sonner";

export interface IBasicFormValues {
  coverImage: File | string | null;
  eventName: string;
  organizerName: string;
  eventYear: string;
  eventDate: Date;
  eventCountry: string;
  eventCountryCode: string;
  eventState: string;
  eventStateCode: string;
  eventCity: string;
  venueId: string;
  venueName?: string;
  categoryId: string;
  categoryName?: string;
  guestIds: string[];
  unRegisteredGuestNames: string[];
  description: string;
  eventActivities: IEventActivity[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const getImagePreviewUrl = (image: File | string | null | undefined) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (image instanceof Blob) return URL.createObjectURL(image);
  return "";
};

export const basicInformationSchema = Joi.object({
  coverImage: Joi.any()
    .required()
    .custom((value, helpers) => {
      if (value == null) {
        return helpers.error("any.required");
      }
      if (typeof value === "string" && value.trim()) {
        return value;
      }
      if (!(value instanceof File)) {
        return helpers.error("any.custom");
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
    })
    .messages({
      "any.required": "Please select an event banner",
      "any.custom": "Please select a valid event banner image",
    }),
  eventName: Joi.string().required().messages({
    "string.empty": "Event name is required",
    "any.required": "Event name is required",
  }),
  organizerName: Joi.string().required().messages({
    "string.empty": "Organizer name is required",
    "any.required": "Organizer name is required",
  }),
  eventYear: Joi.string().required().messages({
    "string.empty": "Event year is required",
    "any.required": "Event year is required",
  }),
  eventDate: Joi.date().required().messages({
    "date.empty": "Event date is required",
    "any.required": "Event date is required",
  }),
  eventCountryCode: Joi.string().required().messages({
    "string.empty": "Event country is required",
    "any.required": "Event country is required",
  }),
  eventStateCode: Joi.string().required().messages({
    "string.empty": "Province or state is required",
    "any.required": "Province or state is required",
  }),
  eventCity: Joi.string().required().messages({
    "string.empty": "Event city is required",
    "any.required": "Event city is required",
  }),
  venueId: Joi.string().required().messages({
    "string.empty": "Venue is required",
    "any.required": "Venue is required",
  }),
  categoryId: Joi.string().required().messages({
    "string.empty": "Category is required",
    "any.required": "Category is required",
  }),
  guestIds: Joi.array().items(Joi.string()).required().messages({
    "array.empty": "Guests are required",
    "any.required": "Guests are required",
  }),
  unRegisteredGuestNames: Joi.array().items(Joi.string()).required().messages({
    "array.empty": "Unregistered guest names are required",
    "any.required": "Unregistered guest names are required",
  }),
  description: Joi.string().required().messages({
    "string.empty": "Description is required",
    "any.required": "Description is required",
  }),
  eventActivities: Joi.array()
    .items(
      Joi.object({
        activityName: Joi.string().required().messages({
          "string.empty": "Activity name is required",
          "any.required": "Activity name is required",
        }),
        activityDate: Joi.date().required().messages({
          "date.empty": "Activity date is required",
          "any.required": "Activity date is required",
        }),
        activityDescription: Joi.string().required().messages({
          "string.empty": "Activity description is required",
          "any.required": "Activity description is required",
        }),
      }),
    )
    .required()
    .messages({
      "array.empty": "Event activities are required",
      "any.required": "Event activities are required",
    }),
}).unknown(true);

const BasicForm: React.FC<{ handleNextStep: () => void }> = ({
  handleNextStep,
}) => {
  const {
    register,
    watch,
    control,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useFormContext<IBasicFormValues>();
  const eventDate = watch("eventDate");
  const coverImage = watch("coverImage");
  const coverImagePreviewUrl = useMemo(
    () => getImagePreviewUrl(coverImage),
    [coverImage],
  );
  const eventCountryCode = watch("eventCountryCode");
  const eventStateCode = watch("eventStateCode");
  const {
    data: categories,
    isLoading,
    error: categoriesError,
    refetch,
  } = useCategory();

  const categoryItems: TComboboxItem[] = useMemo(() => {
    return (categories || [])?.map((category) => ({
      value: category?.id,
      label: category?.name,
    }));
  }, [categories]);

  const fetchingCategoryError = useMemo(() => {
    return categoriesError
      ? constructErrorMessage(
          categoriesError as TApiErrorResponseType,
          "Something went wrong while fetching categories",
        )
      : undefined;
  }, [categoriesError]);

  const countryOptions = useMemo(
    () =>
      Country.getAllCountries().map((country) => ({
        label: `${country.flag} ${country.name}`,
        value: country.isoCode,
      })),
    [],
  );

  const stateOptions = useMemo(() => {
    if (!eventCountryCode) return [];
    return State.getStatesOfCountry(eventCountryCode).map((state) => ({
      label: state.name,
      value: state.isoCode,
    }));
  }, [eventCountryCode]);

  const cityOptions = useMemo(() => {
    if (!eventCountryCode || !eventStateCode) return [];
    return City.getCitiesOfState(eventCountryCode, eventStateCode).map((city) => ({
      label: city.name,
      value: city.name,
    }));
  }, [eventCountryCode, eventStateCode]);

  return (
    <form className="space-y-6 md:space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <p className="text-sm font-semibold text-secondary-950">
              Event Banner
            </p>
            <p className="mt-1 text-sm text-secondary-500">
              Upload the main image that appears at the top of the event preview.
            </p>
          </div>
          <div className="relative flex min-h-[14rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-secondary-200 bg-secondary-50">
            <Controller
              control={control}
              name="coverImage"
              render={({ field }) => (
                <Input
                  key={coverImage ? "has-banner" : "no-banner"}
                  type="file"
                  accept=".jpg, .png, .webp"
                  ref={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      field.onChange(null);
                      return;
                    }
                    if (!file.type.includes("image")) {
                      toast.error("Please select an image file");
                      field.onChange(null);
                      return;
                    }
                    if (file.size > MAX_FILE_SIZE) {
                      toast.error("File size must be less than 5MB");
                      field.onChange(null);
                      return;
                    }
                    field.onChange(file);
                  }}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
              )}
            />
            {coverImagePreviewUrl ? (
              <div className="relative h-64 w-full">
                <CustomImageComponent
                  src={coverImagePreviewUrl}
                  alt="Event banner"
                  fill
                  className="size-full"
                  imageClassName="object-cover object-center"
                />
                <button
                  type="button"
                  className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 text-red-500 opacity-0 transition-opacity hover:opacity-100"
                  onClick={() =>
                    setValue("coverImage", null, { shouldValidate: true })
                  }
                >
                  <TrashIcon className="size-8" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-secondary-700">
                <UploadIcon className="size-10" />
                <p className="font-medium">Upload event banner</p>
                <p className="text-sm text-secondary-500">
                  JPG, PNG, or WEBP. Max 5MB.
                </p>
              </div>
            )}
          </div>
          {errors?.coverImage?.message && (
            <p className="text-sm text-destructive">
              {errors.coverImage.message}
            </p>
          )}
        </div>

        <TextareaField
          label="About Event"
          className="lg:col-span-2"
          required={true}
          error={errors?.description?.message}
          {...register("description")}
        />

        <InputField
          label="Event Name"
          required={true}
          error={errors?.eventName?.message}
          {...register("eventName")}
        />

        <InputField
          label="Organized By"
          required={true}
          placeholder="Turnupz Nigeria Ltd"
          error={errors?.organizerName?.message}
          {...register("organizerName")}
        />

        <InputField
          label="Event Year"
          required={true}
          placeholder="2024"
          error={errors?.eventYear?.message}
          {...register("eventYear")}
        />

        <Controller
          control={control}
          name="eventDate"
          render={({ field, fieldState }) => (
            <DateSelect
              required={true}
              dateModifiers={{
                disabled: (date) => date <= new Date(),
              }}
              label="Event Date"
              date={field.value}
              error={fieldState?.error?.message}
              setDate={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="eventCountryCode"
          render={({ field, fieldState }) => (
            <SelectField
              label="Event Country"
              required={true}
              value={field.value}
              setValue={(countryCode) => {
                const selectedCountry = Country.getCountryByCode(countryCode);
                field.onChange(countryCode);
                setValue("eventCountry", selectedCountry?.name ?? "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue("eventState", "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue("eventStateCode", "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue("eventCity", "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              options={countryOptions}
              error={fieldState?.error?.message}
              placeholder="Select event country"
              inputClassName="h-10"
            />
          )}
        />

        <Controller
          control={control}
          name="eventStateCode"
          render={({ field, fieldState }) => (
            <SelectField
              label="Province / State"
              required={true}
              value={field.value}
              setValue={(stateCode) => {
                const selectedState = State.getStateByCodeAndCountry(
                  stateCode,
                  eventCountryCode,
                );
                field.onChange(stateCode);
                setValue("eventState", selectedState?.name ?? "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue("eventCity", "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              options={stateOptions}
              error={fieldState?.error?.message}
              placeholder={
                eventCountryCode
                  ? "Select province or state"
                  : "Select country first"
              }
              inputClassName="h-10"
            />
          )}
        />

        <Controller
          control={control}
          name="eventCity"
          render={({ field, fieldState }) => (
            <SelectField
              label="City"
              required={true}
              value={field.value}
              setValue={field.onChange}
              options={cityOptions}
              error={fieldState?.error?.message}
              placeholder={
                eventStateCode ? "Select event city" : "Select province first"
              }
              inputClassName="h-10"
            />
          )}
        />

        <Controller
          control={control}
          name="venueId"
          render={({ field, fieldState }) => (
            <VenueSelect
              label="Venue"
              required={true}
              value={field.value}
              onChange={(text) => {
                field.onChange(text);
              }}
              allowCreateOption={true}
              onCreateOption={(venueName) => {
                const nextVenue = saveCustomVenue(venueName);
                if (nextVenue) {
                  field.onChange(nextVenue.id);
                  setValue("venueName", nextVenue.name, { shouldValidate: false });
                }
                return nextVenue ?? undefined;
              }}
              error={fieldState?.error?.message}
              placeholder="Search or type a new venue"
            />
          )}
        />

        <Controller
          control={control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <ComboboxSelect
              label="Category"
              required={true}
              error={fieldState?.error?.message}
              fetchingError={fetchingCategoryError}
              refetch={refetch}
              isLoading={isLoading}
              placeholder="Select or type a new category"
              items={categoryItems || []}
              item={field.value}
              setItem={(value) => {
                field.onChange(value);
                const selectedCategory = (categoryItems || []).find(
                  (item) => item.value === value,
                );
                if (selectedCategory) {
                  setValue("categoryName", selectedCategory.label, {
                    shouldValidate: false,
                  });
                }
              }}
              allowCreateOption={true}
              onCreateOption={(categoryName) => {
                const nextCategory = saveCustomCategory(categoryName);
                if (nextCategory) {
                  field.onChange(nextCategory.id);
                  setValue("categoryName", nextCategory.name, { shouldValidate: false });
                }
              }}
            />
          )}
        />

        <Controller
          control={control}
          name="eventActivities"
          render={({ field, fieldState }) => (
            <EventActivitiesInput
              selectedDate={eventDate}
              eventActivities={field.value}
              setEventActivities={field.onChange}
              error={fieldState?.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="unRegisteredGuestNames"
          render={({ field, fieldState }) => (
            <GuestNamesInput
              error={fieldState?.error?.message}
              guestNames={field.value}
              setGuestNames={field.onChange}
            />
          )}
        />
      </div>
      <Button
        type="button"
        onClick={handleNextStep}
        disabled={!isValid || isSubmitting}
        loading={isSubmitting}
      >
        Next
      </Button>
    </form>
  );
};

export default memo(BasicForm);
