"use client";
import SelectField, { ISelectFieldOption } from "@/components/ui/select-field";
import React, { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Joi from "joi";
import InputField from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";

enum ETicketType {
  FREE = "free",
  PAID = "paid",
  EXTERNAL_LINK = "external_link",
}

interface ITicketType {
  ticketName: string;
  ticketPrice: number;
  ticketQuantity: number;
}
export interface ITicketFormValues {
  ticketType: string;
  ticketUrl?: string;
  eventTickets?: ITicketType[];
}

const ticketTypeOptions: ISelectFieldOption[] = [
  { label: "Free", value: ETicketType.FREE },
  { label: "Paid", value: ETicketType.PAID },
  { label: "External Link", value: ETicketType.EXTERNAL_LINK },
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
  ticketQuantity: Joi.number().required().messages({
    "number.empty": "Ticket quantity is required",
    "any.required": "Ticket quantity is required",
  }),
});

export const ticketFormSchema = Joi.object({
  ticketType: Joi.string()
    .required()
    .valid(ETicketType.FREE, ETicketType.PAID, ETicketType.EXTERNAL_LINK)
    .messages({
      "any.only": "Invalid ticket type",
      "any.required": "Ticket type is required",
    }),
  ticketUrl: Joi.when("ticketType", {
    is: ETicketType.EXTERNAL_LINK,
    then: Joi.string().uri().required().messages({
      "string.uri": "Invalid ticket URL",
      "string.empty": "Please provide your ticket URL",
      "any.required": "Please provide your ticket URL",
    }),
    otherwise: Joi.string().allow("").optional(),
  }),
  eventTickets: Joi.when("ticketType", {
    is: Joi.string().valid(ETicketType.FREE, ETicketType.PAID),
    then: Joi.array().items(ticketItemSchema).min(1).required().messages({
      "array.min": "Please add at least one ticket",
      "any.required": "Please add at least one ticket",
    }),
    otherwise: Joi.array().items(ticketItemSchema).optional(),
  }),
}).unknown(true);

const TicketForm = () => {
  const {
    control,
    watch,
    register,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useFormContext<ITicketFormValues>();
  const ticketType = watch("ticketType");
  return (
    <div className="space-y-10 w-full flex flex-col items-center justify-center">
      <form className="space-y-10 w-full">
        <Controller
          control={control}
          name="ticketType"
          render={({ field, fieldState }) => (
            <SelectField
              options={ticketTypeOptions}
              label="Ticket Type"
              value={field.value}
              setValue={(value) => {
                field?.onChange(value);
                setValue("eventTickets", [], { shouldValidate: true });
                setValue("ticketUrl", "", { shouldValidate: true });
              }}
              error={fieldState?.error?.message}
              placeholder="Select ticket type"
            />
          )}
        />
        {ticketType === ETicketType.EXTERNAL_LINK && (
          <InputField
            label="Ticket URL"
            placeholder="Enter ticket URL"
            error={errors?.ticketUrl?.message}
            {...register("ticketUrl")}
          />
        )}
        <Button disabled={!isValid} loading={isSubmitting} type="submit">
          Continue
        </Button>
      </form>
    </div>
  );
};

export default memo(TicketForm);
