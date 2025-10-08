"use client";

import React from "react";
import { Control, FieldPath, FieldValues, FieldError } from "react-hook-form";
import {
  FormField as BaseFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createAriaFormFieldProps,
  generateAriaId,
  getAriaLabel,
} from "@/lib/accessibility/aria-utils";
import {
  ScreenReaderOnly,
  ErrorAnnouncement,
} from "@/lib/accessibility/screen-reader";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

export interface AccessibleFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

interface AccessibleTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends AccessibleFormFieldProps<TFieldValues, TName> {
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  showPasswordToggle?: boolean;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  inputMode?:
    | "text"
    | "decimal"
    | "numeric"
    | "tel"
    | "search"
    | "email"
    | "url";
}

export function AccessibleTextField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled = false,
  required = false,
  className,
  type = "text",
  showPasswordToggle = false,
  min,
  max,
  step,
  autoComplete,
  inputMode,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: AccessibleTextFieldProps<TFieldValues, TName>) {
  const [showPassword, setShowPassword] = React.useState(false);
  const fieldId = React.useMemo(
    () => generateAriaId(`field-${String(name)}`),
    [name]
  );
  const descriptionId = React.useMemo(
    () => generateAriaId(`desc-${String(name)}`),
    [name]
  );
  const errorId = React.useMemo(
    () => generateAriaId(`error-${String(name)}`),
    [name]
  );

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <BaseFormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const describedByIds = [
          description && descriptionId,
          hasError && errorId,
          ariaDescribedBy,
        ].filter(Boolean) as string[];

        const ariaProps = createAriaFormFieldProps({
          id: fieldId,
          required,
          invalid: hasError,
          describedBy: describedByIds,
        });

        return (
          <FormItem className={className}>
            {label && (
              <FormLabel htmlFor={fieldId} className="flex items-center gap-2">
                {label}
                {required && (
                  <>
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                    <ScreenReaderOnly>required</ScreenReaderOnly>
                  </>
                )}
                {hasError && (
                  <AlertCircle
                    className="h-4 w-4 text-destructive"
                    aria-hidden="true"
                  />
                )}
              </FormLabel>
            )}

            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  {...ariaProps}
                  type={inputType}
                  placeholder={placeholder}
                  disabled={disabled}
                  min={min}
                  max={max}
                  step={step}
                  autoComplete={autoComplete}
                  inputMode={inputMode}
                  aria-label={ariaLabel}
                  className={cn(
                    showPasswordToggle && type === "password" && "pr-10",
                    hasError && "border-destructive focus:ring-destructive",
                    "focus:ring-2 focus:ring-offset-2"
                  )}
                />

                {showPasswordToggle && type === "password" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={disabled}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                )}
              </div>
            </FormControl>

            {description && (
              <FormDescription id={descriptionId}>
                {description}
              </FormDescription>
            )}

            <FormMessage id={errorId} role="alert" aria-live="polite" />

            {/* Screen reader error announcement */}
            {hasError && (
              <ErrorAnnouncement
                error={fieldState.error?.message || "Field has an error"}
                priority="assertive"
              />
            )}
          </FormItem>
        );
      }}
    />
  );
}

interface AccessibleSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends AccessibleFormFieldProps<TFieldValues, TName> {
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  emptyText?: string;
}

export function AccessibleSelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  placeholder = "Select an option...",
  disabled = false,
  required = false,
  className,
  options,
  emptyText = "No options available",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: AccessibleSelectFieldProps<TFieldValues, TName>) {
  const fieldId = React.useMemo(
    () => generateAriaId(`field-${String(name)}`),
    [name]
  );
  const descriptionId = React.useMemo(
    () => generateAriaId(`desc-${String(name)}`),
    [name]
  );
  const errorId = React.useMemo(
    () => generateAriaId(`error-${String(name)}`),
    [name]
  );

  return (
    <BaseFormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const describedByIds = [
          description && descriptionId,
          hasError && errorId,
          ariaDescribedBy,
        ].filter(Boolean) as string[];

        return (
          <FormItem className={className}>
            {label && (
              <FormLabel htmlFor={fieldId} className="flex items-center gap-2">
                {label}
                {required && (
                  <>
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                    <ScreenReaderOnly>required</ScreenReaderOnly>
                  </>
                )}
                {hasError && (
                  <AlertCircle
                    className="h-4 w-4 text-destructive"
                    aria-hidden="true"
                  />
                )}
              </FormLabel>
            )}

            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={disabled}
              required={required}
            >
              <FormControl>
                <SelectTrigger
                  id={fieldId}
                  aria-label={ariaLabel}
                  aria-describedby={
                    describedByIds.length > 0
                      ? describedByIds.join(" ")
                      : undefined
                  }
                  aria-invalid={hasError}
                  aria-required={required}
                  className={cn(
                    hasError && "border-destructive focus:ring-destructive",
                    "focus:ring-2 focus:ring-offset-2"
                  )}
                >
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>

              <SelectContent>
                {options.length === 0 ? (
                  <div
                    className="py-2 px-3 text-sm text-muted-foreground"
                    role="option"
                    aria-selected="false"
                  >
                    {emptyText}
                  </div>
                ) : (
                  options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {description && (
              <FormDescription id={descriptionId}>
                {description}
              </FormDescription>
            )}

            <FormMessage id={errorId} role="alert" aria-live="polite" />

            {/* Screen reader error announcement */}
            {hasError && (
              <ErrorAnnouncement
                error={fieldState.error?.message || "Field has an error"}
                priority="assertive"
              />
            )}
          </FormItem>
        );
      }}
    />
  );
}

interface AccessibleCheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends AccessibleFormFieldProps<TFieldValues, TName> {
  checkboxLabel?: string;
}

export function AccessibleCheckboxField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  disabled = false,
  required = false,
  className,
  checkboxLabel,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: AccessibleCheckboxFieldProps<TFieldValues, TName>) {
  const fieldId = React.useMemo(
    () => generateAriaId(`field-${String(name)}`),
    [name]
  );
  const descriptionId = React.useMemo(
    () => generateAriaId(`desc-${String(name)}`),
    [name]
  );
  const errorId = React.useMemo(
    () => generateAriaId(`error-${String(name)}`),
    [name]
  );

  return (
    <BaseFormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const describedByIds = [
          description && descriptionId,
          hasError && errorId,
          ariaDescribedBy,
        ].filter(Boolean) as string[];

        return (
          <FormItem className={className}>
            {label && (
              <FormLabel className="flex items-center gap-2">
                {label}
                {required && (
                  <>
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                    <ScreenReaderOnly>required</ScreenReaderOnly>
                  </>
                )}
                {hasError && (
                  <AlertCircle
                    className="h-4 w-4 text-destructive"
                    aria-hidden="true"
                  />
                )}
              </FormLabel>
            )}

            <div className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  id={fieldId}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                  aria-label={ariaLabel}
                  aria-describedby={
                    describedByIds.length > 0
                      ? describedByIds.join(" ")
                      : undefined
                  }
                  aria-invalid={hasError}
                  aria-required={required}
                  className={cn(
                    hasError && "border-destructive",
                    "focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  )}
                />
              </FormControl>

              {checkboxLabel && (
                <label
                  htmlFor={fieldId}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {checkboxLabel}
                </label>
              )}
            </div>

            {description && (
              <FormDescription id={descriptionId}>
                {description}
              </FormDescription>
            )}

            <FormMessage id={errorId} role="alert" aria-live="polite" />

            {/* Screen reader error announcement */}
            {hasError && (
              <ErrorAnnouncement
                error={fieldState.error?.message || "Field has an error"}
                priority="assertive"
              />
            )}
          </FormItem>
        );
      }}
    />
  );
}

interface AccessibleFormProps {
  children: React.ReactNode;
  onSubmit?: (event: React.FormEvent) => void;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  noValidate?: boolean;
}

export function AccessibleForm({
  children,
  onSubmit,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  noValidate = true,
}: AccessibleFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={className}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      noValidate={noValidate}
      role="form"
    >
      {children}
    </form>
  );
}
