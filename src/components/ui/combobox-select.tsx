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
import { CheckIcon } from "lucide-react";

type TComboboxItem = {
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
}) => {
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const selectedItem = items.find(
      (contentItem) => contentItem?.value === item
    );
    if (selectedItem) {
      setSearch(selectedItem?.label);
    }
  }, [item, items]);
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn("opacity-70", labelClassName)}>{label}</Label>
      )}
      <Combobox items={items}>
        <ComboboxInput
          placeholder={placeholder || "Select a value"}
          className={cn("w-full", inputClassName)}
          value={search}
          onChange={(e) => setSearch(e?.target?.value)}
        />
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
                <div className="inline-flex items-center gap-2 justify-between w-full">
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

export default memo(ComboboxSelect);
