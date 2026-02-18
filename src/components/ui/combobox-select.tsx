import React, { memo, useEffect, useState } from "react";
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
import { AlertTriangle, CheckIcon } from "lucide-react";
import { Spinner } from "./spinner";
import { Button } from "./button";

export type TComboboxItem = {
  value: string;
  label: string;
};

interface IComboboxSelectProps {
  items: TComboboxItem[];
  setItem: (items: string) => void;
  item: string;
  label?: string;
  placeholder?: string;
  error?: string | undefined;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperText?: string;
  helperTextClassName?: string;
  emptyText?: string;
  isLoading?: boolean;
  refetch?: () => void;
  fetchingError?: string;
  required?: boolean;
}

const ComboboxSelect: React.FC<IComboboxSelectProps> = ({
  item,
  setItem,
  items,
  label,
  placeholder,
  error,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  helperText,
  helperTextClassName,
  emptyText,
  isLoading,
  refetch,
  fetchingError,
  required,
}) => {
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const selectedItem = items.find(
      (contentItem) => contentItem?.value === item,
    );
    if (selectedItem) {
      setSearch(selectedItem?.label);
    }
  }, [item, items]);
  return (
    <div className={cn("space-y-1 relative", className)}>
      {label && (
        <div className="flex items-center gap-2">
          <Label className={cn("opacity-70", labelClassName)}>{label}</Label>
          {required && <span className="text-destructive">*</span>}
          {isLoading && (
            <span className="">
              {<Spinner className="w-4 h-4 animate-spin" />}
            </span>
          )}
        </div>
      )}
      <Combobox items={fetchingError ? [] : items} disabled={isLoading}>
        <ComboboxInput
          placeholder={placeholder || "Select a value"}
          className={cn("w-full", inputClassName)}
          value={search}
          onChange={(e) => setSearch(e?.target?.value)}
          disabled={isLoading}
        />
        {!fetchingError && (
          <ComboboxContent className="w-full">
            <ComboboxEmpty>{emptyText || "No item found."}</ComboboxEmpty>
            <ComboboxList className="w-full">
              {(contentItem: TComboboxItem) => (
                <ComboboxItem
                  key={contentItem?.value}
                  value={contentItem?.value}
                  onClick={() => setItem(contentItem?.value)}
                  className={cn(item === contentItem?.value && "bg-accent")}
                >
                  <div className="flex items-center gap-2 justify-between w-full">
                    <span className="inline-flex items-center gap-2 text-sm">
                      <span className="">{contentItem?.label}</span>
                    </span>
                    {item === contentItem?.value && (
                      <CheckIcon className="w-4 h-4" />
                    )}
                  </div>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        )}
        {fetchingError && (
          <ComboboxContent className="w-full">
            <ComboboxEmpty className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="flex flex-col items-center justify-center gap-1">
                <AlertTriangle className="size-10 text-destructive" />
                <span className="text-sm text-destructive">
                  {fetchingError}
                </span>
              </div>
              <Button variant="link" size="sm" onClick={refetch}>
                <span className="text-sm">Retry</span>
              </Button>
            </ComboboxEmpty>
          </ComboboxContent>
        )}
      </Combobox>

      {(error || helperText) && (
        <p
          className={cn(
            "text-sm",
            helperText && !error && "opacity-60",
            helperText && !error && helperTextClassName,
            error && errorClassName,
            error && "text-destructive",
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default memo(ComboboxSelect);
