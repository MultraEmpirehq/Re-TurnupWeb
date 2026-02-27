import React, { memo } from "react";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "./button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "./calendar";
import { cn } from "@/lib/utils";
import { Label } from "./label";

interface ICalendarSelectProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  error?: string | undefined;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperText?: string;
  helperTextClassName?: string;
  dateModifiers?: React.ComponentProps<typeof Calendar>["modifiers"];
  required?: boolean;
  disabled?: boolean;
}

const DateSelect: React.FC<ICalendarSelectProps> = ({
  date,
  setDate,
  label,
  placeholder,
  error,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  helperText,
  helperTextClassName,
  dateModifiers,
  required,
  disabled,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn("opacity-70", labelClassName)}>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Popover>
        <PopoverTrigger asChild className="">
          <Button
            variant="outline"
            disabled={disabled}
            data-empty={!date}
            className={cn(
              "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
              inputClassName,
            )}
          >
            <CalendarIcon />
            {date ? (
              format(date, "PPP")
            ) : (
              <span>{placeholder || "Pick a date"}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={setDate}
            modifiers={dateModifiers}
          />
        </PopoverContent>
      </Popover>
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

export default memo(DateSelect);
