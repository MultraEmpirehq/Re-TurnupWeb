"use client";
import SelectField, { ISelectFieldOption } from "@/components/ui/select-field";
import React, { memo, useCallback, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Joi from "joi";
import InputField from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import TicketInput, { ITicketType } from "./ticket-input";
import { IEventDayFormValue } from "./event-days-input";
import AccessPassesInput, { IAccessPassType } from "./access-passes-input";
import { getCurrencyForCountry } from "@/lib/currency";
import useUserStore from "@/stores/user-store";
import useVendorVerificationStatus from "@/hooks/use-vendor-verification-status";
import { ROUTES } from "@/lib/variables";
import Link from "next/link";

export enum ESaleMethods {
  SELL_ON_TURNUP = "on_turnup",
  REGISTER = "register",
  EXTERNAL_LINK = "external_link",
}

export type { IAccessPassType };

export interface ITicketFormValues {
  saleMethod: string;
  eventTimezone?: string;
  ticketUrl?: string;
  eventTickets?: ITicketType[];
  passAssignments?: IAccessPassType[];
  eventCountry?: string;
  eventCountryCode?: string;
  /** From the first step: when it starts, which sales have to fit before. */
  eventDate?: Date;
  /** From the first step: the venue, and how many it holds (if known). */
  venueName?: string;
  venueCapacity?: number | null;
  /** From the first step: tickets then choose which days they're for. */
  isMultiDay?: boolean;
  eventDays?: IEventDayFormValue[];
}

const ticketSaleMethodOptions: ISelectFieldOption[] = [
  { label: "Sell tickets on Turnupz", value: ESaleMethods.SELL_ON_TURNUP },
  { label: "Free registration (no payment)", value: ESaleMethods.REGISTER },
  { label: "Use my own ticket link", value: ESaleMethods.EXTERNAL_LINK },
];

const ticketItemSchema = Joi.object({
  ticketName: Joi.string().required(),
  ticketPrice: Joi.number().min(0).required(),
  ticketQuantity: Joi.number().min(1).required(),
  visibility: Joi.string().valid("public", "private").required(),
  actionType: Joi.string().valid("paid", "register").required(),
  transferable: Joi.boolean().optional(),
  privateAccessCode: Joi.string().allow("").optional(),
  salesStartAt: Joi.string().allow(null, "").optional(),
  salesEndAt: Joi.string().allow(null, "").optional(),
  maxPerOrder: Joi.number().integer().min(1).allow(null).optional(),
  dayIndexes: Joi.array().items(Joi.number().integer().min(0)).optional(),
  // A draft loaded back also carries display-only fields (id, soldCount, isOnSale);
  // the request is built from the fields above, so let those through.
}).unknown(true);

const passItemSchema = Joi.object({
  passName: Joi.string().required().messages({
    "string.empty": "Pass name is required",
    "any.required": "Pass name is required",
  }),
  quantity: Joi.number().min(1).required().messages({
    "number.min": "Pass quantity must be at least 1",
    "any.required": "Pass quantity is required",
  }),
  assigneeEmails: Joi.array()
    .items(Joi.string().email({ tlds: false }))
    .required(),
  transferable: Joi.boolean().optional(),
}).unknown(true);

export const ticketFormSchema = Joi.object({
  saleMethod: Joi.string()
    .required()
    .valid(
      ESaleMethods.SELL_ON_TURNUP,
      ESaleMethods.REGISTER,
      ESaleMethods.EXTERNAL_LINK,
    )
    .messages({
      "any.only": "Invalid sale method",
      "any.required": "Sale method is required",
    }),
  ticketUrl: Joi.when("saleMethod", {
    is: ESaleMethods.EXTERNAL_LINK,
    then: Joi.string().uri().required().messages({
      "string.uri": "Invalid external link",
      "string.empty": "Please provide your external ticket link",
      "any.required": "Please provide your external ticket link",
    }),
    otherwise: Joi.string().allow("").optional(),
  }),
  eventTickets: Joi.when("saleMethod", {
    is: Joi.valid(ESaleMethods.SELL_ON_TURNUP, ESaleMethods.REGISTER),
    then: Joi.array().items(ticketItemSchema).min(1).required().messages({
      "array.min": "Please add at least one category",
      "any.required": "Please add at least one category",
    }),
    otherwise: Joi.array().items(ticketItemSchema).optional(),
  }),
  passAssignments: Joi.array().items(passItemSchema).optional(),
}).unknown(true);

const TicketForm: React.FC<{
  handleNextStep: () => Promise<void>;
  handlePreviousStep?: () => void;
  isSaving?: boolean;
}> = ({ handleNextStep, handlePreviousStep, isSaving = false }) => {
  const userDetails = useUserStore((state) => state.userDetails);
  const {
    control,
    watch,
    register,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useFormContext<ITicketFormValues>();

  // Hosts approved for free events only run free and register-only events.
  const { canSellTickets, isChecking } = useVendorVerificationStatus();
  const isFreeHost = !isChecking && !canSellTickets;
  const saleMethodOptions = useMemo(
    () =>
      isFreeHost
        ? ticketSaleMethodOptions
            .filter((option) => option.value !== ESaleMethods.EXTERNAL_LINK)
            .map((option) =>
              option.value === ESaleMethods.SELL_ON_TURNUP
                ? { ...option, label: "Free tickets on Turnupz" }
                : option,
            )
        : ticketSaleMethodOptions,
    [isFreeHost],
  );

  const saleMethod = watch("saleMethod");
  const eventCountry = watch("eventCountry");
  const eventCountryCode = watch("eventCountryCode");
  const eventTimezone = watch("eventTimezone");
  // Set on the first step; a multi-day event's tickets say which days they're for.
  const isMultiDay = watch("isMultiDay");
  const eventDays = watch("eventDays");
  const eventDate = watch("eventDate");
  const venueName = watch("venueName");
  const venueCapacity = watch("venueCapacity");
  const dayStarts = useMemo(
    () =>
      isMultiDay
        ? (eventDays ?? []).map((day) => day.startsAt).filter(Boolean)
        : [],
    [isMultiDay, eventDays],
  );
  const dayNames = useMemo(
    () =>
      isMultiDay
        ? (eventDays ?? []).map((day, index) =>
            day.label?.trim() ||
            (day.startsAt
              ? new Date(day.startsAt).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })
              : `Day ${index + 1}`),
          )
        : [],
    [isMultiDay, eventDays],
  );
  const watchedEventTickets = watch("eventTickets");
  const watchedPassAssignments = watch("passAssignments");
  const eventTickets = useMemo(
    () => watchedEventTickets ?? [],
    [watchedEventTickets],
  );
  const passAssignments = useMemo(
    () => watchedPassAssignments ?? [],
    [watchedPassAssignments],
  );

  // Who can come: tickets (sold or registered) and passes (given out), apart.
  const capacity = useMemo(() => {
    const tickets = (eventTickets ?? []).reduce(
      (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
      0,
    );
    const passes = (passAssignments ?? []).reduce(
      (sum, pass) => sum + Number(pass.quantity || 0),
      0,
    );
    return { tickets, passes, total: tickets + passes };
  }, [eventTickets, passAssignments]);

  const ticketCurrency = useMemo(
    () =>
      getCurrencyForCountry(
        eventCountryCode ||
          eventCountry ||
          userDetails?.platformCurrency ||
          userDetails?.countryCode ||
          userDetails?.country,
      ),
    [
      eventCountry,
      eventCountryCode,
      userDetails?.country,
      userDetails?.countryCode,
      userDetails?.platformCurrency,
    ],
  );

  const handleContinue = useCallback(async () => {
    clearErrors(["saleMethod", "ticketUrl", "eventTickets"]);

    if (!saleMethod) {
      setError("saleMethod", {
        type: "manual",
        message: "Sale method is required",
      });
      return;
    }

    if (saleMethod === ESaleMethods.EXTERNAL_LINK) {
      const ticketUrl = watch("ticketUrl")?.trim();
      if (!ticketUrl) {
        setError("ticketUrl", {
          type: "manual",
          message: "Please provide your external ticket link",
        });
        return;
      }
      await handleNextStep();
      return;
    }

    // No more tickets and passes than the venue holds.
    if (venueCapacity && capacity.total > venueCapacity) {
      setError("eventTickets", {
        type: "manual",
        message: `That's ${capacity.total.toLocaleString()} tickets and passes, but ${venueName || "the venue"} holds ${venueCapacity.toLocaleString()}. Lower the quantities, or change the capacity on the first step.`,
      });
      return;
    }

    if (
      isFreeHost &&
      (saleMethod === ESaleMethods.EXTERNAL_LINK ||
        eventTickets.some((ticket) => Number(ticket.ticketPrice) > 0))
    ) {
      setError("eventTickets", {
        type: "manual",
        message:
          "Free hosting is for free events. Set every ticket to 0, or finish your verification to sell tickets.",
      });
      return;
    }

    if (
      (saleMethod === ESaleMethods.SELL_ON_TURNUP ||
        saleMethod === ESaleMethods.REGISTER) &&
      eventTickets.length === 0
    ) {
      setError("eventTickets", {
        type: "manual",
        message:
          saleMethod === ESaleMethods.REGISTER
            ? "Please add at least one registration category"
            : "Please add at least one ticket category",
      });
      return;
    }

    await handleNextStep();
  }, [
    capacity.total,
    venueCapacity,
    venueName,
    clearErrors,
    eventTickets,
    handleNextStep,
    isFreeHost,
    saleMethod,
    setError,
    watch,
  ]);

  return (
    <div className="space-y-10 w-full flex flex-col items-center justify-center">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleContinue();
        }}
        className="space-y-8 w-full"
      >
        <Controller
          control={control}
          name="saleMethod"
          render={({ field, fieldState }) => (
            <SelectField
              options={saleMethodOptions}
              label="Ticket Option"
              required
              value={field.value}
              setValue={(value) => {
                field.onChange(value);
                setValue("eventTickets", [], { shouldValidate: true });
                setValue("ticketUrl", "", { shouldValidate: true });
              }}
              error={fieldState?.error?.message}
              placeholder="Select ticket option"
              helperText={
                field.value === ESaleMethods.SELL_ON_TURNUP
                  ? isFreeHost
                    ? "People get their tickets on Turnupz. Add the categories below."
                    : "People buy on Turnupz and pay by card or bank. Add the categories below."
                  : field.value === ESaleMethods.REGISTER
                    ? "Free for attendees: people register for a place and pay nothing. Add the registration types below, for example General or VIP."
                    : field.value === ESaleMethods.EXTERNAL_LINK
                      ? "Your event page sends people to your own ticketing link."
                      : undefined
              }
            />
          )}
        />

        {isFreeHost && (
          <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4 text-sm leading-6 text-secondary-800">
            You&apos;re verified to host free events, so tickets here are free.{" "}
            <Link
              href={ROUTES.VENDOR_VERIFICATION.href}
              className="font-semibold text-primary-700 underline-offset-2 hover:underline"
            >
              Finish your verification
            </Link>{" "}
            to sell tickets.
          </div>
        )}

        {saleMethod && saleMethod !== ESaleMethods.EXTERNAL_LINK && (
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-secondary-100 bg-secondary-50 p-5">
            <div>
              <p className="text-sm text-secondary-500">Event capacity</p>
              <p className="mt-1 text-3xl font-bold text-secondary-950">
                {capacity.total.toLocaleString()}
                {!!venueCapacity && (
                  <span
                    className={
                      capacity.total > venueCapacity
                        ? "ml-2 text-base font-semibold text-destructive"
                        : "ml-2 text-base font-medium text-secondary-500"
                    }
                  >
                    of {venueCapacity.toLocaleString()} the venue holds
                  </span>
                )}
              </p>
              {!venueCapacity && (
                <p className="mt-1 text-xs text-secondary-500">
                  Add how many your venue holds on the first step, so you
                  don&apos;t sell more than fit.
                </p>
              )}
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-xs text-secondary-500">
                  {saleMethod === ESaleMethods.REGISTER ? "Registration spots" : "Tickets"}
                </p>
                <p className="font-semibold text-secondary-950">
                  {capacity.tickets.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-500">Access passes</p>
                <p className="font-semibold text-secondary-950">
                  {capacity.passes.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {saleMethod === ESaleMethods.EXTERNAL_LINK && (
          <InputField
            label="External Ticket Link"
            placeholder="https://example.com/tickets"
            error={errors?.ticketUrl?.message}
            {...register("ticketUrl")}
          />
        )}

        {saleMethod === ESaleMethods.SELL_ON_TURNUP && (
          <>
            <Controller
              control={control}
              name="eventTickets"
              render={({ field, fieldState }) => (
                <TicketInput
                  timezone={eventTimezone}
                  tickets={field.value ?? []}
                  setTickets={(tickets) => {
                    field.onChange(tickets);
                    setValue("eventTickets", tickets, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  error={fieldState?.error?.message}
                  mode="paid"
                  currency={ticketCurrency}
                  dayNames={dayNames}
                  eventDate={eventDate}
                  dayStarts={dayStarts}
                />
              )}
            />
            <Controller
              control={control}
              name="passAssignments"
              render={({ field }) => (
                <AccessPassesInput
                  passes={field.value ?? []}
                  setPasses={field.onChange}
                />
              )}
            />
          </>
        )}

        {saleMethod === ESaleMethods.REGISTER && (
          <>
            <Controller
              control={control}
              name="eventTickets"
              render={({ field, fieldState }) => (
                <TicketInput
                  timezone={eventTimezone}
                  tickets={field.value ?? []}
                  setTickets={(tickets) => {
                    field.onChange(tickets);
                    setValue("eventTickets", tickets, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  error={fieldState?.error?.message}
                  mode="register"
                  currency={ticketCurrency}
                  dayNames={dayNames}
                  eventDate={eventDate}
                  dayStarts={dayStarts}
                />
              )}
            />
            <Controller
              control={control}
              name="passAssignments"
              render={({ field }) => (
                <AccessPassesInput
                  passes={field.value ?? []}
                  setPasses={field.onChange}
                />
              )}
            />
          </>
        )}

        <div className="w-full mt-4 flex flex-row items-center justify-start gap-3">
          <Button
            type="button"
            onClick={handlePreviousStep}
            disabled={isSaving}
            variant="outline"
            className="border-secondary-700 text-secondary-700"
          >
            Previous
          </Button>
          <Button
            disabled={isSubmitting || isSaving}
            loading={isSubmitting || isSaving}
            type="button"
            onClick={handleContinue}
          >
            {isSaving ? "Saving draft..." : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default memo(TicketForm);
