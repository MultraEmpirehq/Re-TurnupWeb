import React, { memo, useEffect, useState } from "react";
import { Country, ICountry } from "country-state-city";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./combobox";
import { CheckIcon } from "lucide-react";

const contries = Country.getAllCountries();

interface ICountrySelectProps {
  country: string;
  setCountry: (country: string) => void;
  label?: string;
  placeholder?: string;
  error?: string | undefined;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperText?: string;
  helperTextClassName?: string;
}

const CountrySelect: React.FC<ICountrySelectProps> = ({
  country,
  setCountry,
  label,
  placeholder,
  error,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  helperText,
  helperTextClassName,
}) => {
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const selectedCountry = contries.find((item) => item?.isoCode === country);
    if (selectedCountry) {
      setSearch(selectedCountry?.name);
    }
  }, [country]);
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn("opacity-70", labelClassName)}>{label}</Label>
      )}
      <Combobox items={contries}>
        <ComboboxInput
          placeholder={placeholder || "Select a country"}
          className={cn("w-full", inputClassName)}
          value={search}
          onChange={(e) => setSearch(e?.target?.value)}
        />
        <ComboboxContent className="w-full">
          <ComboboxEmpty>No country found.</ComboboxEmpty>
          <ComboboxList className="w-full">
            {(item: ICountry) => (
              <ComboboxItem
                key={item?.isoCode}
                value={item?.isoCode}
                onClick={() => setCountry(item?.isoCode)}
                className={cn(country === item?.isoCode && "bg-accent")}
              >
                <div className="inline-flex items-center gap-2 justify-between w-full">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <span>{item?.flag}</span>
                    <span className="">{item?.name}</span>
                  </span>
                  {country === item?.isoCode && (
                    <CheckIcon className="w-4 h-4" />
                  )}
                </div>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {(error || helperText) && (
        <p
          className={cn(
            "text-sm",
            helperText && !error && "opacity-60",
            helperText && !error && helperTextClassName,
            error && errorClassName,
            error && "text-destructive"
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default memo(CountrySelect);
