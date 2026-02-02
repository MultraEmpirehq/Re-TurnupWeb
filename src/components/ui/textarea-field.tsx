"use client";

import React, {
  forwardRef,
  memo,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Textarea } from "./textarea";

// Types
interface InputFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof inputWrapperVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  inputClassName?: string;
  labelClassName?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftButtonClassName?: string;
  rightButtonClassName?: string;
  buttonClassName?: string;
  rightButtonAction?: () => void;
  leftButtonAction?: () => void;
}

// Variants for the input wrapper
const inputWrapperVariants = cva("relative flex items-stretch w-full", {
  variants: {
    variant: {
      default: "",
      destructive:
        "[&>textarea]:border-destructive [&>button]:border-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Input variants to work with icons
const inputWithIconVariants = cva("relative py-5", {
  variants: {
    hasLeftIcon: {
      true: "pl-9",
      false: "",
    },
    hasRightIcon: {
      true: "pr-9",
      false: "",
    },
  },
  defaultVariants: {
    hasLeftIcon: false,
    hasRightIcon: false,
  },
});

// Error/Helper Text Component
interface MessageTextProps {
  message?: string;
  variant?: "default" | "destructive";
  className?: string;
}

const MessageText: React.FC<MessageTextProps> = ({
  message,
  variant = "default",
  className,
}) => {
  if (!message) return null;

  return (
    <p
      className={cn(
        "text-xs mt-2",
        variant === "destructive"
          ? "text-destructive"
          : "text-muted-foreground",
        className
      )}
      {...(variant === "destructive" && { role: "alert" })}
    >
      {message}
    </p>
  );
};

// Enhanced Label Component
interface EnhancedLabelProps {
  htmlFor?: string;
  label?: string;
  className?: string;
  required?: boolean;
}

const EnhancedLabel: React.FC<EnhancedLabelProps> = ({
  htmlFor,
  label,
  className,
  required,
}) => {
  if (!label) return null;

  return (
    <Label htmlFor={htmlFor} className={cn("mb-2 opacity-70", className)}>
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );
};

// Main InputField Component
const InputField = forwardRef<HTMLTextAreaElement, InputFieldProps>(
  (
    {
      label,
      error,
      helperText,
      inputClassName,
      labelClassName,
      containerClassName,
      placeholder = "Enter text...",
      variant = "default",
      required,
      disabled,
      className,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const inputId = useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const inputRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLTextAreaElement);

    const hasError = !!error;
    const currentVariant = hasError ? "destructive" : variant;

    const enhancedInputClassName = useMemo(() => {
      return cn(
        inputWithIconVariants({
          hasLeftIcon: false,
          hasRightIcon: false,
        }),
        hasError && "border-destructive focus-visible:ring-destructive",
        inputClassName
      );
    }, [hasError, inputClassName]);

    const combinedAriaDescribedBy = useMemo(() => {
      const ids = [
        ariaDescribedBy,
        error ? errorId : null,
        helperText ? helperId : null,
      ]
        .filter(Boolean)
        .join(" ");
      return ids || undefined;
    }, [ariaDescribedBy, error, errorId, helperText, helperId]);

    return (
      <div className={cn("space-y-2", containerClassName, className)}>
        {/* Label */}
        <EnhancedLabel
          htmlFor={inputId}
          label={label}
          className={labelClassName}
          required={required}
        />

        {/* Input Container */}
        <div className={inputWrapperVariants({ variant: currentVariant })}>
          {/* Shadcn Input */}
          <Textarea
            ref={inputRef}
            id={inputId}
            placeholder={placeholder}
            className={enhancedInputClassName}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={combinedAriaDescribedBy}
            {...props}
          />
        </div>
        <MessageText
          message={error || helperText}
          variant={hasError ? "destructive" : "default"}
        />
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default memo(InputField);
export type { InputFieldProps };
