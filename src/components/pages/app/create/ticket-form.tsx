"use client";
import SelectField, { ISelectFieldOption } from "@/components/ui/select-field";
import React, { memo, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Joi from "joi";
import InputField from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import TicketInput, { ITicketType } from "./ticket-input";

enum ESaleMethods {
  SELL_ON_TURNUP = "on_turnup",
  EXTERNAL_LINK = "external_link",
}

export interface ITicketFormValues {
  saleMethod: string;
  ticketUrl?: string;
  eventTickets?: ITicketType[];
}

const ticketSaleMethodOptions: ISelectFieldOption[] = [
  { label: "Sell on Turnup", value: ESaleMethods.SELL_ON_TURNUP },
  { label: "External Link", value: ESaleMethods.EXTERNAL_LINK },
];

const ticketItemSchema = Joi.object({
  ticketName: Joi.string().required().messages({
    "string.empty": "Ticket name is required",
    "any.required": "Ticket name is required",
  }),
  ticketPrice: Joi.number().allow(0).positive().required().messages({
    "number.empty": "Ticket price is required",
    "any.required": "Ticket price is required",
    "number.positive": "Ticket price must be positive",
    "number.base": "Ticket price must be a number",
    "number.integer": "Ticket price must be an integer",
  }),
  ticketQuantity: Joi.number().min(1).required().messages({
    "number.empty": "Ticket quantity is required",
    "any.required": "Ticket quantity is required",
    "number.min": "Ticket quantity must be at least 1",
  }),
});

export const ticketFormSchema = Joi.object({
  saleMethod: Joi.string()
    .required()
    .valid(ESaleMethods.SELL_ON_TURNUP, ESaleMethods.EXTERNAL_LINK)
    .messages({
      "any.only": "Invalid sale method",
      "any.required": "Sale method is required",
    }),
  ticketUrl: Joi.when("saleMethod", {
    is: ESaleMethods.EXTERNAL_LINK,
    then: Joi.string().uri().required().messages({
      "string.uri": "Invalid ticket URL",
      "string.empty": "Please provide your ticket URL",
      "any.required": "Please provide your ticket URL",
    }),
    otherwise: Joi.string().allow("").optional(),
  }),
  eventTickets: Joi.when("saleMethod", {
    is: ESaleMethods.SELL_ON_TURNUP,
    then: Joi.array()
      .items(ticketItemSchema)
      .min(1)
      .required()
      .custom((value: ITicketType[], helpers) => {
        const freeTickets = (value ?? []).filter((t) => t.ticketPrice === 0);
        if (freeTickets.length > 1) {
          return helpers.error("array.custom", {
            message: "Only one ticket can have a price of 0",
          });
        }
        return value;
      })
      .messages({
        "array.min": "Please add at least one ticket",
        "any.required": "Please add at least one ticket",
        "array.custom": "Only one ticket can have a price of 0",
      }),
    otherwise: Joi.array().items(ticketItemSchema).optional(),
  }),
}).unknown(true);

const TicketForm: React.FC<{
  handleNextStep: () => Promise<void>;
  handlePreviousStep?: () => void;
}> = ({ handleNextStep, handlePreviousStep }) => {
  const {
    control,
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useFormContext<ITicketFormValues>();
  const saleMethod = watch("saleMethod");
  const onSubmit = useCallback(() => {
    handleNextStep?.();
  }, [handleNextStep]);
  return (
    <div className="space-y-6 md:space-y-10 w-full flex flex-col items-center justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 md:space-y-10 w-full"
      >
        <Controller
          control={control}
          name="saleMethod"
          render={({ field, fieldState }) => (
            <SelectField
              options={ticketSaleMethodOptions}
              label="Sale Method"
              required={true}
              value={field.value}
              setValue={(value) => {
                field?.onChange(value);
                setValue("eventTickets", [], { shouldValidate: true });
                setValue("ticketUrl", "", { shouldValidate: true });
              }}
              error={fieldState?.error?.message}
              placeholder="Select sale method"
            />
          )}
        />
        {saleMethod === ESaleMethods.EXTERNAL_LINK && (
          <InputField
            label="Ticket URL"
            placeholder="Enter ticket URL"
            error={errors?.ticketUrl?.message}
            {...register("ticketUrl")}
          />
        )}
        {saleMethod === ESaleMethods.SELL_ON_TURNUP && (
          <Controller
            control={control}
            name="eventTickets"
            render={({ field, fieldState }) => (
              <TicketInput
                tickets={field.value ?? []}
                setTickets={field.onChange}
                error={fieldState?.error?.message}
              />
            )}
          />
        )}
        <div className="w-full mt-6 md:mt-10 flex flex-row items-center justify-start gap-3">
          <Button
            onClick={handlePreviousStep}
            variant="outline"
            className="border-secondary-700 text-secondary-700"
          >
            Previous
          </Button>
          <Button disabled={!isValid} loading={isSubmitting} type="submit">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};

export default memo(TicketForm);
