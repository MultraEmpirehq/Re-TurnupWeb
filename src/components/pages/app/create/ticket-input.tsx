import Joi from "joi";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import InputField from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { TicketIcon, TrashIcon } from "lucide-react";
import SelectField from "@/components/ui/select-field";
import { AppCurrency, formatAppMoney } from "@/lib/currency";

export interface ITicketType {
  ticketName: string;
  ticketPrice: number;
  ticketQuantity: number;
  soldCount?: number;
  visibility: "public" | "private";
  actionType: "paid" | "register";
  transferable?: boolean;
  privateAccessCode?: string;
}

const createPrivateAccessCode = (ticketName: string) => {
  const slug = ticketName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `${slug || "private"}-${Date.now().toString(36)}`;
};

const schema = Joi.object({
  ticketName: Joi.string().required().messages({
    "string.empty": "Ticket name is required",
    "any.required": "Ticket name is required",
  }),
  ticketPrice: Joi.number().min(0).required().messages({
    "number.empty": "Ticket price is required",
    "any.required": "Ticket price is required",
    "number.min": "Ticket price cannot be negative",
    "number.base": "Ticket price must be a number",
  }),
  ticketQuantity: Joi.number().min(1).required().messages({
    "number.empty": "Ticket quantity is required",
    "any.required": "Ticket quantity is required",
    "number.min": "Ticket quantity must be at least 1",
  }),
  visibility: Joi.string().valid("public", "private").required().messages({
    "any.only": "Visibility must be public or private",
    "any.required": "Visibility is required",
  }),
  actionType: Joi.string().valid("paid", "register").required().messages({
    "any.only": "Action type is required",
    "any.required": "Action type is required",
  }),
  transferable: Joi.boolean().optional(),
  privateAccessCode: Joi.string().allow("").optional(),
});

const defaultValues: ITicketType = {
  ticketName: "",
  ticketPrice: 0,
  ticketQuantity: 0,
  visibility: "public",
  actionType: "paid",
  transferable: false,
  privateAccessCode: "",
};

interface ITicketInputProps {
  tickets: ITicketType[];
  setTickets: (tickets: ITicketType[]) => void;
  error?: string;
  errorClassName?: string;
  mode: "paid" | "register";
  currency: AppCurrency;
}

const TicketInput: React.FC<ITicketInputProps> = ({
  tickets = [],
  setTickets,
  error,
  errorClassName,
  mode,
  currency,
}) => {
  const [showTicketInput, setShowTicketInput] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    control,
    setValue,
    formState: { errors },
  } = useForm<ITicketType>({
    defaultValues: { ...defaultValues, actionType: mode },
    resolver: joiResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    reset({ ...defaultValues, actionType: mode, ticketPrice: 0 });
  }, [mode, reset]);

  const parsedTickets = useMemo(() => tickets.filter(Boolean), [tickets]);
  const totalCapacity = useMemo(
    () =>
      parsedTickets.reduce(
        (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
        0,
      ),
    [parsedTickets],
  );

  const onSubmit = useCallback(
    (data: ITicketType) => {
      setTickets([
        ...tickets,
        {
          ...data,
          actionType: mode,
          ticketPrice: mode === "register" ? 0 : data.ticketPrice,
          soldCount: 0,
          privateAccessCode:
            data.visibility === "private"
              ? data.privateAccessCode || createPrivateAccessCode(data.ticketName)
              : "",
        },
      ]);
      reset({ ...defaultValues, actionType: mode });
      setShowTicketInput(false);
    },
    [mode, reset, setTickets, tickets],
  );

  const handleRemoveTicket = useCallback(
    (index: number) => {
      setTickets(tickets.filter((_, i) => i !== index));
    },
    [tickets, setTickets],
  );

  const shouldShowTicketInput = useMemo(() => {
    return parsedTickets.length < 1 || showTicketInput;
  }, [parsedTickets.length, showTicketInput]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="ticketName" className="opacity-60">
            {mode === "register" ? "Registration Categories" : "Ticket Categories"}
          </Label>
          <p className="mt-1 text-xs text-secondary-500">
            Total event capacity from these categories:{" "}
            <span className="font-semibold text-secondary-900">{totalCapacity}</span>
          </p>
        </div>
      </div>

      {parsedTickets.length > 0 && (
        <div className="mt-7 space-y-2">
          {parsedTickets.map((ticket, index) => (
            <div
              key={`${ticket.ticketName}-${index}`}
              className="flex flex-1 items-center justify-between gap-6 rounded-xl bg-muted p-3"
            >
              <div className="flex flex-1 items-center gap-3">
                <span className="rounded-md bg-secondary-100 p-2">
                  <TicketIcon />
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{ticket.ticketName}</p>
                  <p className="text-xs opacity-70">
                    {ticket.actionType === "register"
                      ? `${ticket.ticketQuantity} registration spots`
                      : `${ticket.ticketQuantity} tickets Â· ${
                          ticket.ticketPrice > 0
                            ? formatAppMoney(ticket.ticketPrice, currency)
                            : formatAppMoney(0, currency)
                        }`}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-secondary-400">
                    {ticket.visibility} -{" "}
                    {ticket.transferable ? "transferable" : "non-transferable"}
                  </p>
                  {ticket.visibility === "private" && ticket.privateAccessCode && (
                    <p className="text-[11px] text-secondary-400">
                      Access code: {ticket.privateAccessCode}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="inline-flex items-center gap-2 text-xs text-red-500"
                onClick={() => handleRemoveTicket(index)}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {shouldShowTicketInput && (
        <div className="mt-7 space-y-3">
          <div className="rounded-md bg-secondary-50 p-3 text-xs text-secondary-900">
            <p>
              <span className="font-bold">Note:</span> Each category can be public or
              private. Private categories are meant to be shared by link only.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <InputField
              label={mode === "register" ? "Registration Name" : "Ticket Name"}
              className="md:col-span-2"
              placeholder={mode === "register" ? "Regular registration" : "Diamond ticket"}
              error={errors?.ticketName?.message}
              {...register("ticketName")}
            />

            {mode === "paid" && (
              <Controller
                control={control}
                name="ticketPrice"
                render={({ field, fieldState }) => (
                  <InputField
                    label="Price"
                    value={field.value?.toString() || ""}
                    leftIcon={
                      <span className="inline-flex min-w-12 items-center justify-center border-r px-2 text-center text-xs font-semibold text-secondary-500">
                        {currency.code}
                      </span>
                    }
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value || "0"))}
                    placeholder="Enter price"
                    error={fieldState?.error?.message}
                  />
                )}
              />
            )}

            <Controller
              control={control}
              name="ticketQuantity"
              render={({ field, fieldState }) => (
                <InputField
                  label="Total Quantity"
                  type="number"
                  value={field.value?.toString() || ""}
                  placeholder="Enter quantity"
                  error={fieldState?.error?.message}
                  onChange={(e) => field.onChange(Number(e.target.value || "0"))}
                />
              )}
            />

            <Controller
              control={control}
              name="visibility"
              render={({ field, fieldState }) => (
                <SelectField
                  label="Visibility"
                  value={field.value}
                  setValue={(value) => field.onChange(value as "public" | "private")}
                  error={fieldState?.error?.message}
                  options={[
                    { label: "Public", value: "public" },
                    { label: "Private", value: "private" },
                  ]}
                />
              )}
            />

            <Controller
              control={control}
              name="transferable"
              render={({ field }) => (
                <label className="flex min-h-11 items-center gap-3 rounded-xl border border-secondary-200 bg-white px-3 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  <span>Allow attendees to transfer this category</span>
                </label>
              )}
            />

            <div className="col-span-full flex justify-end gap-2">
              {parsedTickets.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="inline-flex items-center gap-2 border-red-300 text-xs text-red-500"
                  onClick={() => setShowTicketInput(false)}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="inline-flex items-center gap-2 text-xs"
                onClick={handleSubmit(onSubmit)}
              >
                Add Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {!shouldShowTicketInput && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              setShowTicketInput(true);
              setValue("actionType", mode);
              setTimeout(() => {
                setFocus("ticketName");
              }, 100);
            }}
          >
            Add Category
          </Button>
        </div>
      )}

      {error && (
        <p
          className={cn(
            "text-sm",
            error && errorClassName,
            error && "text-destructive",
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default memo(TicketInput);
