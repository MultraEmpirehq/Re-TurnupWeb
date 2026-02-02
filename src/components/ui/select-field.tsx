import { cn } from "@/lib/utils";
import React, { memo } from "react";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

export interface ISelectFieldOption {
  label: string;
  value: string;
}

interface ISelectFieldProps {
  value: string;
  setValue: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string | undefined;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperText?: string;
  helperTextClassName?: string;
  options: ISelectFieldOption[];
}

const SelectField: React.FC<ISelectFieldProps> = ({
  value,
  setValue,
  label,
  placeholder,
  error,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  helperText,
  helperTextClassName,
  options = [],
}) => {
  return (
    <div className={cn("space-y-2 w-full", className)}>
      {label && (
        <Label className={cn("opacity-70", labelClassName)}>{label}</Label>
      )}
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className={cn("w-full", inputClassName)}>
          <SelectValue
            className="py-4"
            placeholder={placeholder || "Select an item"}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{label}</SelectLabel>
            {options.map((option) => (
              <SelectItem
                key={option?.value}
                value={option?.value}
                className={cn(value === option.value && "bg-accent")}
              >
                {option?.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
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

export default memo(SelectField);
