"use client";
import React, { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import Joi from "joi";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import DateSelect from "@/components/ui/date-select";
import TextareaField from "@/components/ui/textarea-field";
import AdditionalInformationInput from "./additional-information-input";
import { Skeleton } from "@/components/ui/skeleton";

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

export interface IBasicFormValues {
  eventName: string;
  eventDate: Date;
  venueId: string;
  categoryId: string;
  guestIds: string[];
  unRegisteredGuestNames: string[];
  description: string;
  eventActivities: IEventActivity[];
  additionalInformation: string[];
}

export const basicInformationSchema = Joi.object({
  eventName: Joi.string().required().messages({
    "string.empty": "Event name is required",
    "any.required": "Event name is required",
  }),
  eventDate: Joi.date().required().messages({
    "date.empty": "Event date is required",
    "any.required": "Event date is required",
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
  additionalInformation: Joi.array().items(Joi.string()).required().messages({
    "array.empty": "Additional information is required",
    "any.required": "Additional information is required",
  }),
}).unknown(true);

const BasicForm: React.FC<{ handleNextStep: () => void }> = ({
  handleNextStep,
}) => {
  const {
    register,
    watch,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useFormContext<IBasicFormValues>();
  const eventDate = watch("eventDate");
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
  return (
    <form className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <InputField
          label="Event Name"
          required={true}
          error={errors?.eventName?.message}
          {...register("eventName")}
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
          name="venueId"
          render={({ field, fieldState }) => (
            <VenueSelect
              label="Venue"
              required={true}
              value={field.value}
              onChange={(text) => {
                field.onChange(text);
                console.log("text venueid", text);
              }}
              error={fieldState?.error?.message}
              placeholder="Search venues..."
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
              placeholder="Select a category"
              items={categoryItems || []}
              item={field.value}
              setItem={field.onChange}
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
          name="additionalInformation"
          render={({ field, fieldState }) => (
            <AdditionalInformationInput
              error={fieldState?.error?.message}
              additionalInformation={field.value}
              setAdditionalInformation={field.onChange}
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
        <TextareaField
          label="About Event"
          className="col-span-2"
          required={true}
          error={errors?.description?.message}
          {...register("description")}
        />
      </div>
      <Button
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
