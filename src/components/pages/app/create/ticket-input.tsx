import Joi from "joi";
import React, { memo, useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import InputField from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { TicketIcon, TrashIcon } from "lucide-react";
import { formatCurrency } from "@/lib/functions";

export interface ITicketType {
  ticketName: string;
  ticketPrice: number;
  ticketQuantity: number;
}

const schema = Joi.object({
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

const defaultValues: ITicketType = {
  ticketName: "",
  ticketPrice: 0,
  ticketQuantity: 0,
};

interface ITicketInputProps {
  tickets: ITicketType[];
  setTickets: (tickets: ITicketType[]) => void;
  error?: string;
  errorClassName?: string;
}

const TicketInput: React.FC<ITicketInputProps> = ({
  tickets = [],
  setTickets,
  error,
  errorClassName,
}) => {
  const [showTicketInput, setShowTicketInput] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    control,
    formState: { errors, isValid },
  } = useForm({
    defaultValues,
    resolver: joiResolver(schema),
    mode: "onChange",
  });
  const parsedTickets = useMemo(() => {
    return tickets?.filter(Boolean);
  }, [tickets]);
  const shouldShowTicketInput = useMemo(() => {
    return (parsedTickets?.length || 0) < 1 || showTicketInput;
  }, [parsedTickets, showTicketInput]);
  const onSubmit = useCallback(
    (data: ITicketType) => {
      setTickets([...tickets, data]);
      reset();
      setShowTicketInput(false);
    },
    [tickets, setTickets, setShowTicketInput, reset]
  );
  const handleRemoveTicket = useCallback(
    (index: number) => {
      setTickets(tickets.filter((_, i) => i !== index));
    },
    [tickets, setTickets]
  );
  return (
    <div className="space-y-4">
      <Label htmlFor="ticketName" className="opacity-60">
        Tickets
      </Label>

      {parsedTickets?.length > 0 && (
        <div className="space-y-2 mt-7">
          {parsedTickets?.map((ticket, index) => (
            <div
              key={index}
              className="flex items-center gap-6 justify-between flex-1 bg-muted rounded-md p-2"
            >
              <div
                className={cn(
                  "flex items-center gap-2 justify-between flex-1",
                  index > 0 && "border-b"
                )}
              >
                <span className="p-2 rounded-md bg-secondary-100 flex items-center justify-center">
                  <TicketIcon />
                </span>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium">{ticket?.ticketName}</p>
                  <p className="text-xs opacity-60">
                    {ticket?.ticketPrice > 0
                      ? formatCurrency(ticket?.ticketPrice)
                      : "Free"}{" "}
                    per ticket x {ticket?.ticketQuantity}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-xs inline-flex items-center gap-2 text-red-500"
                onClick={() => handleRemoveTicket(index)}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {shouldShowTicketInput && (
        <div className="space-y-3 mt-7">
          <div className="text-xs bg-secondary-50 rounded-md p-2 text-secondary-900">
            <p>
              <span className="font-bold">Note:</span> Leave ticket price as 0
              for free tickets and you can only add one free ticket.
            </p>
          </div>
          <div className="gap-6 grid grid-cols-2">
            <InputField
              label="Ticket Name"
              className="col-span-2"
              placeholder="Enter ticket name"
              error={errors?.ticketName?.message}
              {...register("ticketName")}
            />
            <Controller
              control={control}
              name="ticketPrice"
              render={({ field, fieldState }) => (
                <InputField
                  label="Ticket Price"
                  value={field?.value?.toString() || ""}
                  className=""
                  leftIcon={
                    <span className="border-r inline-flex items-center justify-center w-6 text-center">
                      ₦
                    </span>
                  }
                  type="number"
                  onChange={(e) => {
                    const value = e?.target?.value;
                    const parsedValue = Number(value || "0");
                    if (isNaN(parsedValue)) {
                      return;
                    }
                    if (parsedValue < 0) {
                      return;
                    }
                    field.onChange(Number(parsedValue));
                  }}
                  //   leftButtonClassName="border-r px-3"
                  placeholder="Enter ticket price"
                  error={fieldState?.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="ticketQuantity"
              render={({ field, fieldState }) => (
                <InputField
                  label="Ticket Quantity"
                  className=""
                  type="number"
                  value={field?.value?.toString() || ""}
                  placeholder="Enter ticket quantity"
                  error={fieldState?.error?.message}
                  onChange={(e) => {
                    const value = e?.target?.value;
                    const parsedValue = parseInt(value || "0", 10);
                    if (isNaN(parsedValue)) {
                      return;
                    }
                    if (parsedValue < 0) {
                      return;
                    }
                    field.onChange(Number(parsedValue));
                  }}
                />
              )}
            />
            <div className="col-span-2 flex-row justify-end flex gap-2">
              {parsedTickets?.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="text-xs inline-flex items-center gap-2 text-red-500 border-red-300"
                  onClick={() => setShowTicketInput(false)}
                >
                  Cancel
                </Button>
              )}
              <Button
                disabled={!isValid}
                variant="outline"
                size="sm"
                type="button"
                className="text-xs inline-flex items-center gap-2"
                onClick={handleSubmit(onSubmit)}
              >
                Add
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
              setTimeout(() => {
                setFocus("ticketName");
              }, 100);
            }}
          >
            Add Ticket
          </Button>
        </div>
      )}

      {error && (
        <p
          className={cn(
            "text-sm",

            error && errorClassName,
            error && "text-destructive"
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default memo(TicketInput);
