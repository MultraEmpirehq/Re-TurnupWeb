"use client";

import React, { memo, useEffect, useId, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import InputField from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CountryCode,
  PHONE_COUNTRIES,
  dialCode,
  flagOf,
  fullPhone,
  phoneCountryFrom,
  splitPhone,
} from "@/lib/phone";
import { cn } from "@/lib/utils";

interface IPhoneFieldProps {
  label?: string;
  /** The full number the api stores (+2348012345678), or "" when it's empty. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** ISO code to start from when there's no number yet, e.g. from their profile. */
  defaultCountry?: string | null;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  inputClassName?: string;
}

/** A phone number: pick the country, type the rest. */
const PhoneField: React.FC<IPhoneFieldProps> = ({
  label = "Phone number",
  value,
  onChange,
  onBlur,
  defaultCountry,
  error,
  helperText,
  disabled,
  required,
  inputClassName,
}) => {
  const id = useId();
  const fallback = phoneCountryFrom(defaultCountry);
  const [country, setCountry] = useState<CountryCode>(
    () => splitPhone(value, fallback).country,
  );
  const [typed, setTyped] = useState(() => splitPhone(value, fallback).typed);
  const [open, setOpen] = useState(false);

  // A number loaded later (saved details, say) replaces what's showing.
  useEffect(() => {
    if (value === fullPhone(country, typed)) return;
    const next = splitPhone(value, fallback);
    setCountry(next.country);
    setTyped(next.typed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const change = (nextCountry: CountryCode, nextTyped: string) => {
    // Someone pasted a whole number: its own code decides the country.
    const trimmed = nextTyped.trim();
    const pasted = trimmed.startsWith("+")
      ? splitPhone(trimmed, nextCountry)
      : null;
    const resolvedCountry = pasted?.country ?? nextCountry;
    const resolvedTyped =
      pasted && pasted.typed !== trimmed ? pasted.typed : nextTyped;
    setCountry(resolvedCountry);
    setTyped(resolvedTyped);
    onChange(fullPhone(resolvedCountry, resolvedTyped));
  };

  const message = error || helperText;
  return (
    <div className="w-full">
      <Label htmlFor={id} className="mb-2 opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="flex items-stretch gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label={`Country code ${dialCode(country)}. Change`}
              className={cn(
                "border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-destructive",
              )}
            >
              <span aria-hidden="true">{flagOf(country)}</span>
              <span>{dialCode(country)}</span>
              <ChevronDownIcon className="text-muted-foreground size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <Command>
              <CommandInput placeholder="Search countries" />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {PHONE_COUNTRIES.map((item) => (
                    <CommandItem
                      key={item.code}
                      value={`${item.name} ${item.code} ${dialCode(item.code)}`}
                      onSelect={() => {
                        change(item.code, typed);
                        setOpen(false);
                      }}
                    >
                      <span aria-hidden="true">{flagOf(item.code)}</span>
                      <span className="flex-1 truncate">{item.name}</span>
                      <span className="text-muted-foreground">
                        {dialCode(item.code)}
                      </span>
                      {item.code === country && (
                        <CheckIcon className="size-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="min-w-0 flex-1">
          <InputField
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="Your number"
            value={typed}
            disabled={disabled}
            aria-invalid={!!error}
            inputClassName={inputClassName}
            onChange={(event) => change(country, event.target.value)}
            onBlur={onBlur}
          />
        </div>
      </div>
      {message && (
        <p
          className={cn(
            "mt-2 text-xs",
            error ? "text-destructive" : "text-muted-foreground",
          )}
          {...(error && { role: "alert" })}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default memo(PhoneField);
