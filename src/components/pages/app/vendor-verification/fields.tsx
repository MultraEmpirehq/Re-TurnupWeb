"use client";

import { Label } from "@/components/ui/label";
import { IVerificationDocument } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FileText, RefreshCw, UploadCloud, X } from "lucide-react";
import React, { useId, useRef } from "react";
import { VendorVerificationStatusBadge } from "./status";
import { VerificationStatus } from "./types";

/** The step's title, what it's for, and where the admin has got to with it. */
export const StepHeader: React.FC<{
  title: string;
  description: string;
  status?: VerificationStatus;
}> = ({ title, description, status }) => (
  <div className="flex flex-col gap-2 border-b border-secondary-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h2 className="text-xl font-bold text-secondary-950">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary-500">
        {description}
      </p>
    </div>
    {status && status !== "not_started" && status !== "in_progress" && (
      <VendorVerificationStatusBadge status={status} prefix={false} />
    )}
  </div>
);

/** A field's label and message, laid out like InputField's, around any control. */
export const FieldShell: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, required, error, helperText, htmlFor, className, children }) => (
  <div className={cn("flex flex-col", className)}>
    <Label htmlFor={htmlFor} className="mb-2 opacity-70">
      {label}
      {required && <span className="ml-1 text-destructive">*</span>}
    </Label>
    {children}
    {(error || helperText) && (
      <p
        className={cn(
          "mt-2 text-xs",
          error ? "text-destructive" : "text-muted-foreground",
        )}
        {...(error ? { role: "alert" } : {})}
      >
        {error || helperText}
      </p>
    )}
  </div>
);

const isFile = (value: unknown): value is File =>
  typeof File !== "undefined" && value instanceof File;

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * One document: drop or pick a file, see what's attached (a new file or the one
 * already on the application), replace or remove it.
 */
export const DocumentField: React.FC<{
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  value?: File | IVerificationDocument | null;
  onChange: (value: File | null) => void;
  disabled?: boolean;
}> = ({ label, required, helperText, error, value, onChange, disabled }) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = () => inputRef.current?.click();

  const name = isFile(value)
    ? value.name
    : value?.url
      ? "Uploaded document"
      : null;
  const detail = isFile(value)
    ? `${formatSize(value.size)} · uploads when you continue`
    : value?.url
      ? "Already on your application"
      : null;

  return (
    <FieldShell
      label={label}
      required={required}
      error={error}
      helperText={helperText}
      htmlFor={inputId}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange(file);
          event.target.value = "";
        }}
      />
      {name ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border bg-white px-3 py-3",
            error ? "border-destructive" : "border-input",
          )}
        >
          <span className="rounded-lg bg-secondary-50 p-2 text-secondary-600">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-secondary-950">
              {name}
            </p>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </div>
          {!disabled && (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={pick}
                className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-50 hover:text-secondary-800"
                aria-label={`Replace ${label.toLowerCase()}`}
              >
                <RefreshCw className="size-4" />
              </button>
              {!required && (
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-50 hover:text-destructive"
                  aria-label={`Remove ${label.toLowerCase()}`}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={disabled}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) onChange(file);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed bg-secondary-50/40 px-4 py-6 text-center transition-colors hover:bg-secondary-50",
            error ? "border-destructive" : "border-secondary-200",
          )}
        >
          <UploadCloud className="size-6 text-secondary-400" />
          <span className="text-sm font-medium text-secondary-800">
            Drop a file or{" "}
            <span className="text-secondary-500 underline">browse</span>
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG or PDF, up to 10 MB
          </span>
        </button>
      )}
    </FieldShell>
  );
};

/** Two equal options as large cards, e.g. individual or business. */
export const ChoiceCards = <T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (value: T) => void;
  options: {
    value: T;
    title: string;
    description: string;
    icon: React.ElementType;
  }[];
  disabled?: boolean;
}) => (
  <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
    {options.map((option) => {
      const Icon = option.icon;
      const selected = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
            selected
              ? "border-secondary-400 bg-secondary-50 ring-1 ring-secondary-400"
              : "border-secondary-100 hover:bg-secondary-50/60",
          )}
        >
          <span
            className={cn(
              "rounded-xl p-2.5",
              selected
                ? "bg-secondary-400 text-white"
                : "bg-secondary-50 text-secondary-600",
            )}
          >
            <Icon className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-secondary-950">
              {option.title}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-secondary-500">
              {option.description}
            </span>
          </span>
        </button>
      );
    })}
  </div>
);
