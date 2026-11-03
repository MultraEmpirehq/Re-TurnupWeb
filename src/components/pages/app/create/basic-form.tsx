"use client";
import VenueField from "./venue-field";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getData } from "@/api";
import { IVenueDetailsType } from "@/lib/types";
import dynamic from "next/dynamic";
import Joi from "joi";
import { Button } from "@/components/ui/button";
import CustomImageComponent from "@/components/ui/custom-image.component";
import InputField from "@/components/ui/input-field";
import { Input } from "@/components/ui/input";
import DateSelect from "@/components/ui/date-select";
import EventZoneField, { TZoneSource } from "./event-zone-field";
import { deviceZone, TEventPlace, zoneForPlace } from "@/lib/event-zone";
import TextareaField from "@/components/ui/textarea-field";
import { Skeleton } from "@/components/ui/skeleton";
import { TrashIcon, UploadIcon } from "lucide-react";
import { Country, State } from "country-state-city";
import type { ICity } from "country-state-city";

const ComboboxSelect = dynamic(
  () => import("@/components/ui/combobox-select"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-full rounded-md" />,
  },
);
import LineupPicker from "@/components/discovery/lineup-picker";
import { IPerformerSummary } from "@/lib/types";
import EventActivitiesInput, { IEventActivity } from "./event-activities-input";
import EventDaysInput, {
  firstEventDays,
  IEventDayFormValue,
} from "./event-days-input";
import { Controller, useFormContext } from "react-hook-form";
import useCategory from "@/hooks/use-category";
import { TComboboxItem } from "@/components/ui/combobox-select";
import { constructErrorMessage } from "@/api/functions";
import { saveCustomCategory } from "@/lib/custom-event-options";
import { toast } from "sonner";
import { useMarketOptions } from "@/hooks/use-markets";

export interface IBasicFormValues {
  coverImage: File | string | null;
  eventName: string;
  organizerName: string;
  eventDate: Date;
  eventTimezone: string;
  eventCountry: string;
  eventCountryCode: string;
  eventState: string;
  eventStateCode: string;
  eventCity: string;
  /** A directory venue's id, or empty when the venue is typed in. */
  venueId: string;
  venueName?: string;
  /** Typed with a venue that isn't in the directory. */
  venueAddress?: string;
  /** How many the venue holds: from the directory, or as typed. Caps tickets. */
  venueCapacity?: number | null;
  categoryId: string;
  categoryName?: string;
  guestIds: string[];
  unRegisteredGuestNames: string[];
  /** Who's on the bill, headliner first; saved as performerIds. */
  lineup: IPerformerSummary[];
  /** Runs over several days, each with its own times and line-up. */
  isMultiDay: boolean;
  /** The days, in order, when `isMultiDay`; the first one is the event date. */
  eventDays: IEventDayFormValue[];
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
  eventDate: Joi.date().required().messages({
    "date.empty": "Event date is required",
    "any.required": "Event date is required",
  }),
  eventTimezone: Joi.string().allow("").optional(),
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
  // A directory venue, or a name typed in.
  venueId: Joi.string().allow("").optional(),
  venueName: Joi.when("venueId", {
    is: Joi.string().min(1),
    then: Joi.any(),
    otherwise: Joi.string().trim().required().messages({
      "string.empty": "Venue is required",
      "any.required": "Venue is required",
    }),
  }),
  venueAddress: Joi.string().allow("").optional(),
  venueCapacity: Joi.number().integer().min(1).allow(null).optional(),
  categoryId: Joi.string().required().messages({
    "string.empty": "Category is required",
    "any.required": "Category is required",
  }),
  // Guests of honour were replaced by the line-up; kept only for old drafts.
  guestIds: Joi.array().items(Joi.string()).optional(),
  lineup: Joi.array().items(Joi.object().unknown(true)).optional(),
  isMultiDay: Joi.boolean().optional(),
  eventDays: Joi.when("isMultiDay", {
    is: true,
    then: Joi.array()
      .min(2)
      .items(Joi.object().unknown(true))
      .custom((days: IEventDayFormValue[], helpers) => {
        for (let i = 1; i < days.length; i += 1) {
          if (new Date(days[i].startsAt) <= new Date(days[i - 1].startsAt)) {
            return helpers.error("days.order");
          }
        }
        return days;
      })
      .messages({
        "array.min": "Add at least two days, or turn off multi-day",
        "days.order": "Each day has to start after the one before it",
      }),
    otherwise: Joi.any(),
  }),
  unRegisteredGuestNames: Joi.array().items(Joi.string()).optional(),
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
        activityDescription: Joi.string().allow("").optional(),
      }),
    )
    .required()
    .messages({
      "array.empty": "Event activities are required",
      "any.required": "Event activities are required",
    }),
}).unknown(true);

const BasicForm: React.FC<{
  handleNextStep: () => void | Promise<void>;
  isSaving?: boolean;
}> = ({ handleNextStep, isSaving = false }) => {
  const {
    register,
    watch,
    control,
    setValue,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useFormContext<IBasicFormValues>();
  const eventDate = watch("eventDate");
  const isMultiDay = watch("isMultiDay");
  const coverImage = watch("coverImage");
  const coverImagePreviewUrl = useMemo(
    () => getImagePreviewUrl(coverImage),
    [coverImage],
  );
  const eventCountryCode = watch("eventCountryCode");
  const eventStateCode = watch("eventStateCode");
  const eventCountry = watch("eventCountry");
  const eventState = watch("eventState");
  // Venues are offered for the chosen location, so a venue picked for the old
  // one no longer applies. A venue the user typed in themselves isn't tied to a
  // location and stays.
  // The timezone follows the location; where it came from decides what's said.
  const [zoneAction, setZoneSource] = useState<TZoneSource | null>(null);
  const eventTimezone = watch("eventTimezone");
  // Before they touch it (a new event, or a draft): read it off the values.
  const zoneSource: TZoneSource =
    zoneAction ??
    (eventTimezone &&
    eventTimezone ===
      zoneForPlace({ countryCode: eventCountryCode, stateCode: eventStateCode })
      ? "location"
      : eventTimezone === deviceZone()
        ? "device"
        : "chosen");
  const applyZone = useCallback(
    (place: TEventPlace) => {
      const zone = zoneForPlace(place);
      if (!zone) return;
      setValue("eventTimezone", zone, { shouldDirty: true });
      setZoneSource("location");
    },
    [setValue],
  );
  const needsZoneDetail =
    !!eventCountryCode &&
    (Country.getCountryByCode(eventCountryCode)?.timezones?.length ?? 0) > 1 &&
    zoneSource !== "location" &&
    zoneSource !== "chosen";

  const clearVenueForNewLocation = useCallback(() => {
    const venueId = getValues("venueId");
    if (!venueId || venueId.startsWith("custom-venue-")) return;
    setValue("venueId", "", { shouldValidate: true, shouldDirty: true });
    setValue("venueName", "", { shouldDirty: true });
    setValue("venueAddress", "", { shouldDirty: true });
    setValue("venueCapacity", null, { shouldDirty: true });
  }, [getValues, setValue]);

  // From the Venues page ("Use for an event"): start with that venue, and the
  // country, state and city it's in.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const linkedVenueId = searchParams.get("venueId");
  const venueApplied = useRef(false);
  useEffect(() => {
    if (!linkedVenueId || venueApplied.current) return;
    venueApplied.current = true;
    void (async () => {
      try {
        const { data } = await getData<
          IVenueDetailsType & { city?: string; state?: string | null; country?: string }
        >(`/venue/${linkedVenueId}`);
        const venue = data?.data;
        if (!venue) return;
        const country = Country.getAllCountries().find(
          (c) => c.name.toLowerCase() === venue.country?.toLowerCase(),
        );
        if (country) {
          const state = State.getStatesOfCountry(country.isoCode).find(
            (s) => s.name.toLowerCase() === venue.state?.toLowerCase(),
          );
          setValue("eventCountry", country.name, { shouldDirty: true });
          setValue("eventCountryCode", country.isoCode, { shouldDirty: true, shouldValidate: true });
          setValue("eventState", state?.name ?? "", { shouldDirty: true });
          setValue("eventStateCode", state?.isoCode ?? "", { shouldDirty: true });
          setValue("eventCity", venue.city ?? "", { shouldDirty: true });
        }
        setValue("venueId", venue.id, { shouldDirty: true });
        setValue("venueName", venue.name, { shouldDirty: true, shouldValidate: true });
        setValue("venueAddress", venue.address ?? "", { shouldDirty: true });
        setValue("venueCapacity", venue.totalAvailableSeat || null, { shouldDirty: true });
        applyZone({
          countryCode: country?.isoCode ?? "",
          stateCode: "",
          latitude: venue.latitude,
          longitude: venue.longitude,
        });
      } catch {
        // The venue can still be picked by hand.
      } finally {
        router.replace(pathname);
      }
    })();
  }, [linkedVenueId, setValue, applyZone, router, pathname]);

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

  // Only where Turnupz is open (the backend's list).
  const countryOptions = useMarketOptions("code");

  const stateOptions = useMemo(() => {
    if (!eventCountryCode) return [];
    return State.getStatesOfCountry(eventCountryCode).map((state) => ({
      label: state.name,
      value: state.isoCode,
    }));
  }, [eventCountryCode]);

  // Every city in the world is 8 MB, so it's fetched once a state is picked
  // rather than sent with the page.
  const [stateCities, setStateCities] = useState<ICity[]>([]);
  useEffect(() => {
    if (!eventCountryCode || !eventStateCode) {
      setStateCities([]);
      return;
    }
    let cancelled = false;
    import("country-state-city/lib/city").then(({ default: City }) => {
      if (!cancelled) {
        setStateCities(City.getCitiesOfState(eventCountryCode, eventStateCode));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventCountryCode, eventStateCode]);

  const cityOptions = useMemo(
    () =>
      stateCities.map((city) => ({
        label: city.name,
        value: city.name,
      })),
    [stateCities],
  );

  return (
    <form className="space-y-6 md:space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <p className="text-sm font-semibold text-secondary-950">
              Event Banner
            </p>
            <p className="mt-1 text-sm text-secondary-500">
              Upload the main image that appears at the top of the event
              preview.
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

        {!isMultiDay && (
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
        )}

        <Controller
          control={control}
          name="eventCountryCode"
          render={({ field, fieldState }) => (
            <ComboboxSelect
              label="Event Country"
              required={true}
              item={field.value}
              setItem={(countryCode) => {
                const selectedCountry = Country.getCountryByCode(countryCode);
                if (countryCode !== field.value) clearVenueForNewLocation();
                field.onChange(countryCode);
                // A single-zone country settles the timezone; in others the
                // province and city do.
                // A new country: the old zone no longer applies until this
                // one's is known.
                if (countryCode !== field.value) setZoneSource("device");
                applyZone({ countryCode });
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
              items={countryOptions}
              error={fieldState?.error?.message}
              placeholder="Select event country"
              emptyText="No country found."
              inputClassName="h-10"
            />
          )}
        />

        <Controller
          control={control}
          name="eventStateCode"
          render={({ field, fieldState }) => (
            <ComboboxSelect
              label="Province / State"
              required={true}
              item={field.value}
              setItem={(stateCode) => {
                const selectedState = State.getStateByCodeAndCountry(
                  stateCode,
                  eventCountryCode,
                );
                if (stateCode !== field.value) clearVenueForNewLocation();
                field.onChange(stateCode);
                applyZone({ countryCode: eventCountryCode, stateCode });
                setValue("eventState", selectedState?.name ?? "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue("eventCity", "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              items={stateOptions}
              error={fieldState?.error?.message}
              placeholder={
                eventCountryCode
                  ? "Select province or state"
                  : "Select country first"
              }
              emptyText="No province or state found."
              inputClassName="h-10"
            />
          )}
        />

        <Controller
          control={control}
          name="eventCity"
          render={({ field, fieldState }) => (
            <ComboboxSelect
              label="City"
              required={true}
              item={field.value}
              setItem={(cityName) => {
                field.onChange(cityName);
                const city = stateCities.find((item) => item.name === cityName);
                applyZone({
                  countryCode: eventCountryCode,
                  stateCode: eventStateCode,
                  latitude: city?.latitude,
                  longitude: city?.longitude,
                });
              }}
              items={cityOptions}
              error={fieldState?.error?.message}
              placeholder={
                eventStateCode ? "Select event city" : "Select province first"
              }
              emptyText="No city found."
              inputClassName="h-10"
            />
          )}
        />

        <Controller
          control={control}
          name="venueName"
          render={({ fieldState }) => (
            <VenueField
              venueId={watch("venueId") ?? ""}
              venueName={watch("venueName") ?? ""}
              venueAddress={watch("venueAddress") ?? ""}
              country={eventCountry}
              state={eventState}
              error={fieldState?.error?.message}
              onPick={(venue) => {
                setValue("venueId", venue.id, { shouldDirty: true });
                setValue("venueName", venue.name, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue("venueAddress", venue.address ?? "", {
                  shouldDirty: true,
                });
                setValue("venueCapacity", venue.capacity || null, {
                  shouldDirty: true,
                });
                // The venue's own map position is the surest guide.
                applyZone({
                  countryCode: eventCountryCode,
                  stateCode: eventStateCode,
                  latitude: venue.latitude,
                  longitude: venue.longitude,
                });
              }}
              venueCapacity={watch("venueCapacity") ?? null}
              onTypeCapacity={(capacity) =>
                setValue("venueCapacity", capacity, { shouldDirty: true })
              }
              onTypeName={(name) => {
                // Typing makes it their own venue, not a directory one; a
                // directory venue's capacity no longer applies.
                const linked = getValues("venueId");
                if (linked && !linked.startsWith("custom-venue-")) {
                  setValue("venueCapacity", null, { shouldDirty: true });
                }
                setValue("venueId", "", { shouldDirty: true });
                setValue("venueName", name, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              onTypeAddress={(address) =>
                setValue("venueAddress", address, { shouldDirty: true })
              }
            />
          )}
        />

        <Controller
          control={control}
          name="eventTimezone"
          render={({ field, fieldState }) => (
            <EventZoneField
              value={field.value}
              onChange={(zone) => {
                field.onChange(zone);
                setZoneSource("chosen");
              }}
              source={zoneSource}
              needsMoreDetail={needsZoneDetail}
              error={fieldState?.error?.message}
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
              emptyText="No category matches."
              // A new one waits for our team; it's found under "Other" meanwhile.
              helperText={
                field.value?.startsWith("custom-category-")
                  ? `New category. Your event shows "${watch("categoryName")}", and people find it under Other in Explore until our team adds it.`
                  : undefined
              }
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
                  setValue("categoryName", nextCategory.name, {
                    shouldValidate: false,
                  });
                }
              }}
            />
          )}
        />

        <Controller
          control={control}
          name="eventDays"
          render={({ field, fieldState }) => (
            <div className="lg:col-span-2">
              <EventDaysInput
                enabled={!!isMultiDay}
                onEnabledChange={(enabled) => {
                  setValue("isMultiDay", enabled, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  if (enabled && (field.value?.length ?? 0) < 2) {
                    // Starts from the date and line-up already entered.
                    const days = firstEventDays(getValues("eventDate"));
                    days[0].lineup = getValues("lineup") ?? [];
                    field.onChange(days);
                  }
                }}
                days={field.value ?? []}
                onChange={(days) => {
                  field.onChange(days);
                  // The event date is the first day's start.
                  if (days[0]?.startsAt) {
                    setValue("eventDate", new Date(days[0].startsAt), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
                error={fieldState?.error?.message}
              />
            </div>
          )}
        />

        <Controller
          control={control}
          name="eventActivities"
          render={({ field, fieldState }) => (
            <EventActivitiesInput
              selectedDate={eventDate}
              days={isMultiDay ? (watch("eventDays") ?? []) : []}
              eventActivities={field.value}
              setEventActivities={field.onChange}
              error={fieldState?.error?.message}
            />
          )}
        />

        {!isMultiDay && (
          <Controller
            control={control}
            name="lineup"
            render={({ field }) => (
              <div className="lg:col-span-2">
                <LineupPicker
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              </div>
            )}
          />
        )}
      </div>
      <Button
        type="button"
        onClick={handleNextStep}
        disabled={!isValid || isSubmitting || isSaving}
        loading={isSubmitting || isSaving}
      >
        {isSaving ? "Saving draft..." : "Next"}
      </Button>
    </form>
  );
};

export default memo(BasicForm);
