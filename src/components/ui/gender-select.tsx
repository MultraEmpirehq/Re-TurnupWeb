import { cn } from "@/lib/utils";
import { EUserGenders } from "@/stores/user-store";
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

const genderOptions = [
  { label: "Male", value: EUserGenders.MALE },
  { label: "Female", value: EUserGenders.FEMALE },
  { label: "Others", value: EUserGenders.OTHERS },
];

interface IGenderSelectProps {
  gender: EUserGenders;
  setGender: (gender: EUserGenders) => void;
  label?: string;
  placeholder?: string;
  error?: string | undefined;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperText?: string;
  helperTextClassName?: string;
  disabled?: boolean;
}

const GenderSelect: React.FC<IGenderSelectProps> = ({
  gender,
  setGender,
  label,
  placeholder,
  error,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  helperText,
  helperTextClassName,
  disabled,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn("opacity-70", labelClassName)}>{label}</Label>
      )}
      <Select
        value={gender}
        onValueChange={(v) => setGender(v as EUserGenders)}
        disabled={disabled}
      >
        <SelectTrigger className={cn("w-[180px]", inputClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Gender</SelectLabel>
            {genderOptions.map((option) => (
              <SelectItem
                key={option?.value}
                value={option?.value}
                className={cn(gender === option.value && "bg-accent")}
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

export default memo(GenderSelect);
