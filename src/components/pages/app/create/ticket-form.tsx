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
import { getCurrencyForCountry } from "@/lib/currency";
import useUserStore from "@/stores/user-store";

export enum ESaleMethods {
  SELL_ON_TURNUP = "on_turnup",
  REGISTER = "register",
  EXTERNAL_LINK = "external_link",
}

export interface IAccessPassType {
  passName: string;
  quantity: number;
  assigneeEmails: string[];
  transferable?: boolean;
}

export interface ITicketFormValues {
  saleMethod: string;
  ticketUrl?: string;
  eventTickets?: ITicketType[];
  passAssignments?: IAccessPassType[];
  eventCountry?: string;
  eventCountryCode?: string;
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
  transferable: Joi.boolean().optional(),
  privateAccessCode: Joi.string().allow("").optional(),
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
  transferable: Joi.boolean().optional(),
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
    transferable: false,
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
        transferable: draft.transferable,
      },
    ]);
    setDraft({
      passName: "",
      quantity: "1",
      assigneeEmails: "",
      transferable: false,
    });
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
                  {pass.quantity} passes Â· {pass.assigneeEmails.length} email
                  {pass.assigneeEmails.length === 1 ? "" : "s"}
                </p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-secondary-400">
                  {pass.transferable ? "Transferable" : "Non-transferable"}
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
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-secondary-200 bg-white px-3 text-sm text-secondary-700 md:col-span-2">
          <input
            type="checkbox"
            checked={draft.transferable}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                transferable: event.target.checked,
              }))
            }
          />
          <span>Allow recipients to transfer these passes</span>
        </label>
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

  const saleMethod = watch("saleMethod");
  const eventCountry = watch("eventCountry");
  const eventCountryCode = watch("eventCountryCode");
  const watchedEventTickets = watch("eventTickets");
  const watchedPassAssignments = watch("passAssignments");
  const eventTickets = useMemo(() => watchedEventTickets ?? [], [watchedEventTickets]);
  const passAssignments = useMemo(
    () => watchedPassAssignments ?? [],
    [watchedPassAssignments],
  );

  const totalConfiguredCapacity = useMemo(() => {
    const ticketCapacity = (eventTickets ?? []).reduce(
      (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
      0,
    );
    const passCapacity = (passAssignments ?? []).reduce(
      (sum, pass) => sum + Number(pass.quantity || 0),
      0,
    );
    return ticketCapacity + passCapacity;
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
    clearErrors,
    eventTickets.length,
    handleNextStep,
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
              <p className="text-sm text-secondary-500">
                Total event capacity from tickets and passes
              </p>
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
            <div className="rounded-2xl border border-secondary-100 bg-secondary-50 p-5 text-sm text-secondary-600">
              <p className="font-semibold text-secondary-950">
                Registration-only event
              </p>
              <p className="mt-2 leading-6">
                Create free registration categories like Regular, VIP Guest,
                Press, or Invite Only. Categories can be public or private and
                their quantities add up to the event capacity.
              </p>
            </div>
            <Controller
              control={control}
              name="eventTickets"
              render={({ field, fieldState }) => (
                <TicketInput
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
              registration records so users can submit their details without payment.
            </li>
            <li>
              <span className="font-medium">External link:</span> Use a red preview CTA that
              sends users outside the app to your uploaded ticketing URL.
            </li>
            <li>
              <span className="font-medium">Access passes:</span> Passes add to event
              attendance. A recipient should receive passes through a user account and
              distribute individual passes by entering each attendee&apos;s email.
            </li>
            <li>
              <span className="font-medium">Transfers:</span> Ticket transfer belongs on
              the user side after purchase. Vendors configure transferable inventory;
              attendees transfer owned tickets from their account.
            </li>
          </ul>
        </div>

        <div className="w-full mt-4 flex flex-row items-center justify-start gap-3">
          <Button
            type="button"
            onClick={handlePreviousStep}
            variant="outline"
            className="border-secondary-700 text-secondary-700"
          >
            Previous
          </Button>
          <Button
            disabled={isSubmitting}
            loading={isSubmitting}
            type="button"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};

export default memo(TicketForm);
