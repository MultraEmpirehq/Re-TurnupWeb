"use client";

import React, {
  forwardRef,
  memo,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Input } from "./input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";

// Types
interface InputFieldProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
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
      destructive: "[&>input]:border-destructive [&>button]:border-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Button variants for icon buttons
const iconButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-white/20 hover:bg-accent hover:text-accent-foreground self-stretch cursor-pointer absolute top-1/2 -translate-y-1/2 z-[1] opacity-70 [&_svg]:shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      position: {
        left: "left-2",
        right: "right-2",
      },
      variant: {
        default: "",
        destructive: "",
      },
    },
    defaultVariants: {
      position: "left",
      variant: "default",
    },
  },
);

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
        className,
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

// Icon Button Component
interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  position: "left" | "right";
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive";
  ariaLabel?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  children,
  onClick,
  position,
  disabled,
  className,
  variant = "default",
  ariaLabel,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(iconButtonVariants({ position, variant }), className)}
    tabIndex={onClick ? 0 : -1}
    {...(ariaLabel && { "aria-label": ariaLabel })}
    {...(!ariaLabel && { "aria-hidden": "true" })}
  >
    {children}
  </button>
);

// Main InputField Component
const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      error,
      helperText,
      inputClassName,
      labelClassName,
      containerClassName,
      leftIcon,
      rightIcon: propRightIcon,
      leftButtonClassName,
      rightButtonClassName,
      buttonClassName,
      rightButtonAction: propRightButtonAction = () => {},
      leftButtonAction = () => {},
      placeholder = "Enter text...",
      variant = "default",
      type: propType = "text",
      required,
      disabled,
      className,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const inputId = useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const [showPassword, setShowPassword] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const isPasswordType = propType === "password";
    const inputType = isPasswordType && showPassword ? "text" : propType;
    const hasError = !!error;
    const currentVariant = hasError ? "destructive" : variant;

    // Generate right icon for password fields
    const rightIcon = useMemo(() => {
      if (isPasswordType) {
        return showPassword ? (
          <EyeOffIcon className="h-4 w-4" />
        ) : (
          <EyeIcon className="h-4 w-4" />
        );
      }
      return propRightIcon;
    }, [isPasswordType, showPassword, propRightIcon]);

    const rightButtonAction = useCallback(() => {
      if (isPasswordType) {
        setShowPassword((prev) => !prev);
      } else {
        propRightButtonAction();
      }
    }, [isPasswordType, propRightButtonAction]);

    const enhancedInputClassName = useMemo(() => {
      return cn(
        inputWithIconVariants({
          hasLeftIcon: !!leftIcon,
          hasRightIcon: !!rightIcon,
        }),
        hasError && "border-destructive focus-visible:ring-destructive",
        inputClassName,
      );
    }, [leftIcon, rightIcon, hasError, inputClassName]);

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
          {/* Left Icon Button */}
          {leftIcon && (
            <IconButton
              position="left"
              onClick={leftButtonAction}
              disabled={disabled}
              variant={currentVariant || undefined}
              className={cn(buttonClassName, leftButtonClassName)}
            >
              {leftIcon}
            </IconButton>
          )}

          {/* Shadcn Input */}
          <Input
            ref={inputRef}
            id={inputId}
            type={inputType}
            placeholder={placeholder}
            className={enhancedInputClassName}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={combinedAriaDescribedBy}
            {...props}
          />

          {/* Right Icon Button */}
          {rightIcon && (
            <IconButton
              position="right"
              onClick={rightButtonAction}
              disabled={disabled}
              variant={currentVariant || undefined}
              className={cn(buttonClassName, rightButtonClassName)}
              ariaLabel={
                isPasswordType
                  ? showPassword
                    ? "Hide password"
                    : "Show password"
                  : undefined
              }
            >
              {rightIcon}
            </IconButton>
          )}
        </div>

        {/* Error/Helper Text */}
        <MessageText
          message={error || helperText}
          variant={hasError ? "destructive" : "default"}
        />
      </div>
    );
  },
);

InputField.displayName = "InputField";

export default memo(InputField);
export type { InputFieldProps };
