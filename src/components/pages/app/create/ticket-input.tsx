import Joi from "joi";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import InputField from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";

import SelectField from "@/components/ui/select-field";
import { AppCurrency, formatAppMoney } from "@/lib/currency";
import TicketCategoryCard from "./ticket-category-card";
import { sameName } from "@/lib/same-name";
import { wallTimeInZoneToInstant } from "@/lib/event-time";
import TicketSaleRulesFields, {
  saleRulesError,
  TTicketSaleRules,
} from "./ticket-sale-rules";

export interface ITicketType extends TTicketSaleRules {
  ticketName: string;
  ticketPrice: number;
  ticketQuantity: number;
  soldCount?: number;
  visibility: "public" | "private";
  actionType: "paid" | "register";
  transferable?: boolean;
  privateAccessCode?: string;
  /** For a multi-day event: positions of the days it admits on. Empty is every day. */
  dayIndexes?: number[];
}

/** "Every day", or the days a ticket is for, by name. */
export const describeTicketDays = (
  dayIndexes: number[] | undefined,
  dayNames: string[],
) =>
  !dayIndexes?.length || dayIndexes.length >= dayNames.length
    ? "Every day"
    : dayIndexes
        .filter((index) => index < dayNames.length)
        .sort((a, b) => a - b)
        .map((index) => dayNames[index])
        .join(", ");

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
  salesStartAt: Joi.string().allow(null, "").optional(),
  salesEndAt: Joi.string().allow(null, "").optional(),
  maxPerOrder: Joi.number().integer().min(1).allow(null).optional(),
  dayIndexes: Joi.array().items(Joi.number().integer().min(0)).optional(),
});

const defaultValues: ITicketType = {
  ticketName: "",
  ticketPrice: 0,
  ticketQuantity: 0,
  visibility: "public",
  actionType: "paid",
  transferable: false,
  privateAccessCode: "",
  salesStartAt: null,
  salesEndAt: null,
  maxPerOrder: null,
  dayIndexes: [],
};

interface ITicketInputProps {
  tickets: ITicketType[];
  setTickets: (tickets: ITicketType[]) => void;
  error?: string;
  errorClassName?: string;
  mode: "paid" | "register";
  currency: AppCurrency;
  /** The event's zone; sales times are entered and shown on its clock. */
  timezone?: string;
  /** A multi-day event's days by name, to choose which ones a ticket is for. */
  dayNames?: string[];
  /** The event's start, on its clock: sales can't run past it. */
  eventDate?: Date;
  /** Each day's start for a multi-day event, in order, on the event's clock. */
  dayStarts?: Date[];
}

/** What's typed as a price: digits and one decimal point, two places at most. */
const cleanPrice = (raw: string) => {
  const [whole = "", ...rest] = raw.replace(/[^\d.]/g, "").split(".");
  const digits = whole.replace(/^0+(?=\d)/, "");
  return rest.length ? `${digits || "0"}.${rest.join("").slice(0, 2)}` : digits;
};

/** "1250000" or 1250000 as "1,250,000" (keeping any decimals as typed). */
const withCommas = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "" || value === 0) {
    return "";
  }
  const [whole, decimals] = String(value).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimals === undefined ? grouped : `${grouped}.${decimals}`;
};

const TicketInput: React.FC<ITicketInputProps> = ({
  tickets = [],
  setTickets,
  error,
  errorClassName,
  mode,
  currency,
  timezone,
  dayNames = [],
  eventDate,
  dayStarts = [],
}) => {
  const [showTicketInput, setShowTicketInput] = useState(false);
  // The price as typed (with commas) while the field is in use.
  const [priceText, setPriceText] = useState<string | null>(null);
  // The ticket being changed (its place in the list), or null when adding.
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    setError,
    control,
    setValue,
    watch,
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

  // What the paid categories bring in if every ticket sells.
  const potentialTotal = useMemo(
    () =>
      parsedTickets.reduce(
        (sum, ticket) =>
          sum + Number(ticket.ticketPrice || 0) * Number(ticket.ticketQuantity || 0),
        0,
      ),
    [parsedTickets],
  );

  // Free tickets and sign-ups can't be passed on, so there's nothing to switch.
  const isFreeTicket =
    mode === "register" || !(Number(watch("ticketPrice")) > 0);

  const saleRules: TTicketSaleRules = {
    salesStartAt: watch("salesStartAt"),
    salesEndAt: watch("salesEndAt"),
    maxPerOrder: watch("maxPerOrder"),
  };

  // When this ticket stops being bookable: the event's start, or the start of
  // the last day it's for (any day, for an every-day pass).
  const ticketDays = watch("dayIndexes");
  const closesAt = useMemo(() => {
    const covered = ticketDays?.length
      ? dayStarts.filter((_, index) => ticketDays.includes(index))
      : dayStarts;
    const starts = covered.filter((day) => !Number.isNaN(new Date(day).getTime()));
    if (starts.length) {
      return new Date(Math.max(...starts.map((day) => new Date(day).getTime())));
    }
    return eventDate ? new Date(eventDate) : null;
  }, [dayStarts, eventDate, ticketDays]);

  const closeForm = useCallback(() => {
    reset({ ...defaultValues, actionType: mode });
    setPriceText(null);
    setEditingIndex(null);
    setShowTicketInput(false);
  }, [mode, reset]);

  const onSubmit = useCallback(
    (data: ITicketType) => {
      // Buyers choose by name, so two the same would look like one.
      const taken = tickets.some(
        (ticket, index) =>
          index !== editingIndex && sameName(ticket.ticketName, data.ticketName),
      );
      if (taken) {
        const name = data.ticketName.trim().replace(/\s+/g, " ");
        setError("ticketName", {
          message: `There's already a category called “${name}”. Give this one another name, e.g. “${name} – Day 2” or “${name} (late)”.`,
        });
        return;
      }
      if (
        saleRulesError(
          data,
          closesAt ? wallTimeInZoneToInstant(closesAt, timezone) : null,
        )
      ) {
        return;
      }
      const ticket: ITicketType = {
        ...data,
        actionType: mode,
        ticketPrice: mode === "register" ? 0 : data.ticketPrice,
        transferable:
          mode !== "register" && data.ticketPrice > 0 && !!data.transferable,
        soldCount: 0,
        privateAccessCode:
          data.visibility === "private"
            ? data.privateAccessCode || createPrivateAccessCode(data.ticketName)
            : "",
      };
      if (editingIndex !== null && tickets[editingIndex]) {
        // The same ticket, changed: it keeps its id and what's sold of it.
        const original = tickets[editingIndex];
        setTickets(
          tickets.map((item, index) =>
            index === editingIndex
              ? { ...original, ...ticket, soldCount: original.soldCount ?? 0 }
              : item,
          ),
        );
      } else {
        setTickets([...tickets, ticket]);
      }
      closeForm();
    },
    [closeForm, closesAt, editingIndex, mode, setError, setTickets, tickets, timezone],
  );

  const handleEditTicket = useCallback(
    (index: number) => {
      const ticket = tickets[index];
      if (!ticket) return;
      // Only the form's own fields: the rest (id, what's sold) stays on the
      // ticket and is kept when it's saved.
      const fields = Object.fromEntries(
        (Object.keys(defaultValues) as (keyof ITicketType)[]).map((key) => [
          key,
          ticket[key] ?? defaultValues[key],
        ]),
      ) as unknown as ITicketType;
      reset({ ...fields, actionType: mode });
      setPriceText(null);
      setEditingIndex(index);
      setShowTicketInput(true);
      setTimeout(() => setFocus("ticketName"), 100);
    },
    [mode, reset, setFocus, tickets],
  );

  const handleRemoveTicket = useCallback(
    (index: number) => {
      setTickets(tickets.filter((_, i) => i !== index));
      // Keep the edit pointing at the same ticket, or stop it if that one went.
      if (editingIndex === index) closeForm();
      else if (editingIndex !== null && index < editingIndex) {
        setEditingIndex(editingIndex - 1);
      }
    },
    [closeForm, editingIndex, tickets, setTickets],
  );

  const shouldShowTicketInput = useMemo(() => {
    return parsedTickets.length < 1 || showTicketInput;
  }, [parsedTickets.length, showTicketInput]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label htmlFor="ticketName" className="opacity-60">
            {mode === "register"
              ? "Registration Categories"
              : "Ticket Categories"}
          </Label>
          {parsedTickets.length > 0 && (
            <p className="mt-1 text-xs text-secondary-500">
              <span className="font-semibold text-secondary-900">
                {parsedTickets.length}{" "}
                {parsedTickets.length === 1 ? "category" : "categories"}
              </span>{" "}
              · {totalCapacity.toLocaleString()}{" "}
              {mode === "register" ? "spots" : "tickets"}
              {mode !== "register" && potentialTotal > 0 && (
                <>
                  {" "}
                  · up to{" "}
                  <span className="font-semibold text-secondary-900">
                    {formatAppMoney(potentialTotal, currency)}
                  </span>{" "}
                  if everything sells
                </>
              )}
            </p>
          )}
        </div>
        {!shouldShowTicketInput && (
          <button
            type="button"
            onClick={() => {
              setShowTicketInput(true);
              setValue("actionType", mode);
              setTimeout(() => {
                setFocus("ticketName");
              }, 100);
            }}
            className="rounded-full border border-dashed border-primary/50 bg-primary-50/50 px-4 py-2 text-xs font-bold text-primary-700 transition hover:border-primary hover:bg-primary-50"
          >
            + Add category
          </button>
        )}
      </div>

      {parsedTickets.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {parsedTickets.map((ticket, index) => (
            <TicketCategoryCard
              key={`${ticket.ticketName}-${index}`}
              ticket={ticket}
              currency={currency}
              timezone={timezone}
              daysLabel={
                dayNames.length > 1
                  ? describeTicketDays(ticket.dayIndexes, dayNames)
                  : undefined
              }
              editing={editingIndex === index}
              onEdit={() => handleEditTicket(index)}
              onDelete={() => handleRemoveTicket(index)}
            />
          ))}
        </div>
      )}

      {shouldShowTicketInput && (
        <div className="mt-7 space-y-3">
          {editingIndex !== null && (
            <p className="text-sm font-semibold text-secondary-950">
              Editing “{tickets[editingIndex]?.ticketName}”
            </p>
          )}
          <div className="rounded-md bg-secondary-50 p-3 text-xs text-secondary-900">
            <p>
              <span className="font-bold">Note:</span> Each category can be
              public or private. Private categories are meant to be shared by
              link only.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <InputField
              label={mode === "register" ? "Registration Name" : "Ticket Name"}
              className="md:col-span-2"
              placeholder={
                mode === "register" ? "Regular registration" : "Diamond ticket"
              }
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
                    value={priceText ?? withCommas(field.value)}
                    leftIcon={
                      <span className="inline-flex min-w-12 items-center justify-center border-r px-2 text-center text-xs font-semibold text-secondary-500">
                        {currency.code}
                      </span>
                    }
                    type="text"
                    inputMode="decimal"
                    // Room for the currency code, which is wider than an icon.
                    inputClassName="pl-16"
                    // Commas go in as they type (1,250,000); the cursor keeps
                    // its place among the digits.
                    onChange={(e) => {
                      const input = e.target;
                      const raw = input.value;
                      const caret = input.selectionStart ?? raw.length;
                      const digitsBefore = raw
                        .slice(0, caret)
                        .replace(/[^\d.]/g, "").length;
                      const clean = cleanPrice(raw);
                      const text = withCommas(clean);
                      setPriceText(text);
                      field.onChange(Number(clean.replace(/\.$/, "") || "0"));
                      requestAnimationFrame(() => {
                        let seen = 0;
                        let at = 0;
                        while (at < text.length && seen < digitsBefore) {
                          if (/[\d.]/.test(text[at])) seen += 1;
                          at += 1;
                        }
                        input.setSelectionRange(at, at);
                      });
                    }}
                    onBlur={() => setPriceText(null)}
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
                  onChange={(e) =>
                    field.onChange(Number(e.target.value || "0"))
                  }
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
                  setValue={(value) =>
                    field.onChange(value as "public" | "private")
                  }
                  error={fieldState?.error?.message}
                  options={[
                    { label: "Public", value: "public" },
                    { label: "Private", value: "private" },
                  ]}
                />
              )}
            />

            {isFreeTicket ? (
              <p className="flex min-h-11 items-center rounded-xl border border-secondary-200 bg-secondary-50 px-3 text-sm text-secondary-500">
                Free tickets can&apos;t be passed on. Guests get their own from
                the event page.
              </p>
            ) : (
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
            )}

            {dayNames.length > 1 && (
              <Controller
                control={control}
                name="dayIndexes"
                render={({ field }) => {
                  const chosen = field.value ?? [];
                  const toggle = (index: number) =>
                    field.onChange(
                      chosen.includes(index)
                        ? chosen.filter((item) => item !== index)
                        : [...chosen, index].sort((a, b) => a - b),
                    );
                  const chip = (active: boolean) =>
                    cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "border-secondary-800 bg-secondary-800 text-white"
                        : "border-secondary-200 bg-white text-secondary-600 hover:border-secondary-400",
                    );
                  return (
                    <fieldset className="col-span-full space-y-2">
                      <legend className="text-sm font-medium">Valid on</legend>
                      <p className="text-xs text-secondary-500">
                        A pass for every day, or a day ticket. Each ticket gets
                        in once on each day it covers.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-pressed={!chosen.length}
                          onClick={() => field.onChange([])}
                          className={chip(!chosen.length)}
                        >
                          Every day
                        </button>
                        {dayNames.map((name, index) => (
                          <button
                            key={index}
                            type="button"
                            aria-pressed={chosen.includes(index)}
                            onClick={() => toggle(index)}
                            className={chip(chosen.includes(index))}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  );
                }}
              />
            )}

            <TicketSaleRulesFields
              className="col-span-full"
              value={saleRules}
              timezone={timezone}
              closesAt={closesAt}
              onChange={(patch) =>
                (Object.keys(patch) as (keyof TTicketSaleRules)[]).forEach(
                  (key) => setValue(key, patch[key] ?? null),
                )
              }
            />

            <div className="col-span-full flex justify-end gap-2">
              {parsedTickets.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="inline-flex items-center gap-2 border-red-300 text-xs text-red-500"
                  onClick={closeForm}
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
                {editingIndex !== null ? "Save changes" : "Add Category"}
              </Button>
            </div>
          </div>
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
