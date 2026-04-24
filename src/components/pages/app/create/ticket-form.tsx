"use client";
import SelectField, { ISelectFieldOption } from "@/components/ui/select-field";
import React, { memo, useCallback, useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Joi from "joi";
import InputField from "@/components/ui/input-field";
import TextareaField from "@/components/ui/textarea-field";
import { Button } from "@/components/ui/button";
import TicketInput, { ITicketType } from "./ticket-input";
import { TrashIcon } from "lucide-react";

export enum ESaleMethods {
  SELL_ON_TURNUP = "on_turnup",
  REGISTER = "register",
  EXTERNAL_LINK = "external_link",
}

export interface IAccessPassType {
  passName: string;
  quantity: number;
  assigneeEmails: string[];
}

export interface ITicketFormValues {
  saleMethod: string;
  ticketUrl?: string;
  eventTickets?: ITicketType[];
  passAssignments?: IAccessPassType[];
}

const ticketSaleMethodOptions: ISelectFieldOption[] = [
  { label: "Sell on Turnupz", value: ESaleMethods.SELL_ON_TURNUP },
  { label: "Register", value: ESaleMethods.REGISTER },
  { label: "External Link", value: ESaleMethods.EXTERNAL_LINK },
];

const ticketItemSchema = Joi.object({
  ticketName: Joi.string().required(),
  ticketPrice: Joi.number().min(0).required(),
  ticketQuantity: Joi.number().min(1).required(),
  visibility: Joi.string().valid("public", "private").required(),
  actionType: Joi.string().valid("paid", "register").required(),
});

const passItemSchema = Joi.object({
  passName: Joi.string().required().messages({
    "string.empty": "Pass name is required",
    "any.required": "Pass name is required",
  }),
  quantity: Joi.number().min(1).required().messages({
    "number.min": "Pass quantity must be at least 1",
    "any.required": "Pass quantity is required",
  }),
  assigneeEmails: Joi.array().items(Joi.string().email({ tlds: false })).required(),
});

export const ticketFormSchema = Joi.object({
  saleMethod: Joi.string()
    .required()
    .valid(ESaleMethods.SELL_ON_TURNUP, ESaleMethods.REGISTER, ESaleMethods.EXTERNAL_LINK)
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

const PassAssignmentsInput: React.FC<{
  passes: IAccessPassType[];
  setPasses: (passes: IAccessPassType[]) => void;
}> = ({ passes = [], setPasses }) => {
  const [draft, setDraft] = useState({
    passName: "",
    quantity: "1",
    assigneeEmails: "",
  });

  const addPass = () => {
    const emails = draft.assigneeEmails
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!draft.passName.trim()) return;

    setPasses([
      ...passes,
      {
        passName: draft.passName.trim(),
        quantity: Number(draft.quantity || "1"),
        assigneeEmails: emails,
      },
    ]);
    setDraft({ passName: "", quantity: "1", assigneeEmails: "" });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-secondary-100 bg-secondary-50 p-5">
      <div>
        <p className="text-sm font-semibold text-secondary-950">Access Passes</p>
        <p className="mt-1 text-xs leading-5 text-secondary-500">
          Create media, sponsor, or worker passes and assign them by email so recipients
          can receive them through their Turnupz user account.
        </p>
      </div>

      {passes.length > 0 && (
        <div className="space-y-2">
          {passes.map((pass, index) => (
            <div
              key={`${pass.passName}-${index}`}
              className="flex items-start justify-between gap-4 rounded-xl bg-white p-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-secondary-950">{pass.passName}</p>
                <p className="text-xs text-secondary-500">
                  {pass.quantity} passes · {pass.assigneeEmails.length} email
                  {pass.assigneeEmails.length === 1 ? "" : "s"}
                </p>
                {pass.assigneeEmails.length > 0 && (
                  <p className="text-[11px] leading-5 text-secondary-400">
                    {pass.assigneeEmails.join(", ")}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500"
                onClick={() => setPasses(passes.filter((_, itemIndex) => itemIndex !== index))}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Pass Type"
          placeholder="Media pass"
          value={draft.passName}
          onChange={(e) => setDraft((current) => ({ ...current, passName: e.target.value }))}
        />
        <InputField
          label="Quantity"
          type="number"
          placeholder="10"
          value={draft.quantity}
          onChange={(e) => setDraft((current) => ({ ...current, quantity: e.target.value }))}
        />
        <TextareaField
          label="Assigned Emails"
          className="md:col-span-2"
          placeholder="one email per line or separated by commas"
          value={draft.assigneeEmails}
          onChange={(e) =>
            setDraft((current) => ({ ...current, assigneeEmails: e.target.value }))
          }
        />
      </div>

      <Button type="button" variant="outline" onClick={addPass}>
        Add Pass
      </Button>
    </div>
  );
};

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
  const watchedEventTickets = watch("eventTickets");
  const eventTickets = useMemo(() => watchedEventTickets ?? [], [watchedEventTickets]);

  const totalConfiguredCapacity = useMemo(() => {
    return (eventTickets ?? []).reduce(
      (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
      0,
    );
  }, [eventTickets]);

  const onSubmit = useCallback(() => {
    handleNextStep?.();
  }, [handleNextStep]);

  return (
    <div className="space-y-10 w-full flex flex-col items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">
        <Controller
          control={control}
          name="saleMethod"
          render={({ field, fieldState }) => (
            <SelectField
              options={ticketSaleMethodOptions}
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
            />
          )}
        />

        {saleMethod && saleMethod !== ESaleMethods.EXTERNAL_LINK && (
          <div className="grid gap-4 rounded-2xl border border-secondary-100 bg-secondary-50 p-5">
            <div>
              <p className="text-sm text-secondary-500">Total event capacity</p>
              <p className="mt-2 text-3xl font-bold text-secondary-950">
                {totalConfiguredCapacity}
              </p>
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
                  tickets={field.value ?? []}
                  setTickets={field.onChange}
                  error={fieldState?.error?.message}
                  mode="paid"
                />
              )}
            />
            <Controller
              control={control}
              name="passAssignments"
              render={({ field }) => (
                <PassAssignmentsInput
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
                  tickets={field.value ?? []}
                  setTickets={field.onChange}
                  error={fieldState?.error?.message}
                  mode="register"
                />
              )}
            />
            <Controller
              control={control}
              name="passAssignments"
              render={({ field }) => (
                <PassAssignmentsInput
                  passes={field.value ?? []}
                  setPasses={field.onChange}
                />
              )}
            />
          </>
        )}

        <div className="rounded-2xl border border-secondary-100 bg-white p-5 text-sm text-secondary-600">
          <p className="font-semibold text-secondary-950">Ticket flow notes</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium">Sell on Turnupz:</span> Create public or private
              paid ticket categories so users can choose the available options on the event page.
            </li>
            <li>
              <span className="font-medium">Register:</span> Create public or private
              registration categories so users can submit their details without payment.
            </li>
            <li>
              <span className="font-medium">External link:</span> Use a red preview CTA that
              sends users outside the app to your uploaded ticketing URL.
            </li>
          </ul>
        </div>

        <div className="w-full mt-4 flex flex-row items-center justify-start gap-3">
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
