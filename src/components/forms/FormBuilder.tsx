"use client";

import React from "react";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
import {
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
  SwitchField,
  DateField,
  SelectOption,
} from "./FormField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "textarea"
  | "select"
  | "checkbox"
  | "switch"
  | "date";

export interface BaseFieldConfig {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: "text" | "email" | "password" | "number" | "tel" | "url";
  showPasswordToggle?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface TextareaFieldConfig extends BaseFieldConfig {
  type: "textarea";
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

export interface SelectFieldConfig extends BaseFieldConfig {
  type: "select";
  options: SelectOption[];
  emptyText?: string;
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: "checkbox";
  checkboxLabel?: string;
}

export interface SwitchFieldConfig extends BaseFieldConfig {
  type: "switch";
  switchLabel?: string;
}

export interface DateFieldConfig extends BaseFieldConfig {
  type: "date";
  dateFormat?: string;
  disablePast?: boolean;
  disableFuture?: boolean;
}

export type FieldConfig =
  | TextFieldConfig
  | TextareaFieldConfig
  | SelectFieldConfig
  | CheckboxFieldConfig
  | SwitchFieldConfig
  | DateFieldConfig;

export interface FormSection {
  title?: string;
  description?: string;
  fields: FieldConfig[];
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface FormBuilderProps<T extends z.ZodType> {
  form: UseFormReturn<z.infer<T>>;
  sections: FormSection[];
  onSubmit?: (data: z.infer<T>) => Promise<void> | void;
  isSubmitting?: boolean;
  submitError?: string | null;
  submitButtonText?: string;
  showSubmitButton?: boolean;
  showResetButton?: boolean;
  resetButtonText?: string;
  className?: string;
  cardWrapper?: boolean;
  title?: string;
  description?: string;
}

export function FormBuilder<T extends z.ZodType>({
  form,
  sections,
  onSubmit,
  isSubmitting = false,
  submitError,
  submitButtonText = "Submit",
  showSubmitButton = true,
  showResetButton = false,
  resetButtonText = "Reset",
  className,
  cardWrapper = false,
  title,
  description,
}: FormBuilderProps<T>) {
  const [collapsedSections, setCollapsedSections] = React.useState<Set<number>>(
    new Set(
      sections
        .map((section, index) => (section.defaultCollapsed ? index : null))
        .filter((index): index is number => index !== null)
    )
  );

  const toggleSection = (index: number) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedSections(newCollapsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      const data = form.getValues();
      await onSubmit(data);
    }
  };

  const handleReset = () => {
    form.reset();
  };

  const renderField = (fieldConfig: FieldConfig) => {
    const baseProps = {
      control: form.control,
      name: fieldConfig.name as any,
      label: fieldConfig.label,
      description: fieldConfig.description,
      placeholder: fieldConfig.placeholder,
      required: fieldConfig.required,
      disabled: fieldConfig.disabled || isSubmitting,
      className: fieldConfig.className,
    };

    switch (fieldConfig.type) {
      case "text":
      case "email":
      case "password":
      case "number":
      case "tel":
      case "url":
        return (
          <TextField
            key={fieldConfig.name}
            {...baseProps}
            type={fieldConfig.type}
            showPasswordToggle={fieldConfig.showPasswordToggle}
            min={fieldConfig.min}
            max={fieldConfig.max}
            step={fieldConfig.step}
          />
        );

      case "textarea":
        return (
          <TextareaField
            key={fieldConfig.name}
            {...baseProps}
            rows={fieldConfig.rows}
            maxLength={fieldConfig.maxLength}
            showCharCount={fieldConfig.showCharCount}
          />
        );

      case "select":
        return (
          <SelectField
            key={fieldConfig.name}
            {...baseProps}
            options={fieldConfig.options}
            emptyText={fieldConfig.emptyText}
          />
        );

      case "checkbox":
        return (
          <CheckboxField
            key={fieldConfig.name}
            {...baseProps}
            checkboxLabel={fieldConfig.checkboxLabel}
          />
        );

      case "switch":
        return (
          <SwitchField
            key={fieldConfig.name}
            {...baseProps}
            switchLabel={fieldConfig.switchLabel}
          />
        );

      case "date":
        return (
          <DateField
            key={fieldConfig.name}
            {...baseProps}
            dateFormat={fieldConfig.dateFormat}
            disablePast={fieldConfig.disablePast}
            disableFuture={fieldConfig.disableFuture}
          />
        );

      default:
        return null;
    }
  };

  const renderSection = (section: FormSection, index: number) => {
    const isCollapsed = collapsedSections.has(index);
    const hasTitle = section.title || section.description;

    return (
      <div key={index} className={cn("space-y-4", section.className)}>
        {hasTitle && (
          <div className="space-y-2">
            {section.title && (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{section.title}</h3>
                {section.collapsible && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(index)}
                  >
                    {isCollapsed ? "Expand" : "Collapse"}
                  </Button>
                )}
              </div>
            )}
            {section.description && (
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            )}
            {hasTitle && <Separator />}
          </div>
        )}

        {(!section.collapsible || !isCollapsed) && (
          <div className="grid gap-4 md:grid-cols-2">
            {section.fields.map(renderField)}
          </div>
        )}
      </div>
    );
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
        {title && (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        {submitError && (
          <div className="relative w-full rounded-lg border border-destructive/50 p-4 text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <div className="text-sm">{submitError}</div>
            </div>
          </div>
        )}

        <div className="space-y-8">{sections.map(renderSection)}</div>

        {(showSubmitButton || showResetButton) && (
          <div className="flex items-center gap-4 pt-4">
            {showSubmitButton && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {submitButtonText}
              </Button>
            )}

            {showResetButton && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                {resetButtonText}
              </Button>
            )}
          </div>
        )}
      </form>
    </Form>
  );

  if (cardWrapper) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </CardHeader>
        )}
        <CardContent>{formContent}</CardContent>
      </Card>
    );
  }

  return formContent;
}

// Utility function to create form sections from schema
export function createFormSections(
  fields: FieldConfig[],
  sectionsConfig?: {
    title?: string;
    description?: string;
    fieldsPerSection?: number;
  }
): FormSection[] {
  const {
    title,
    description,
    fieldsPerSection = fields.length,
  } = sectionsConfig || {};

  if (fieldsPerSection >= fields.length) {
    return [
      {
        title,
        description,
        fields,
      },
    ];
  }

  const sections: FormSection[] = [];
  for (let i = 0; i < fields.length; i += fieldsPerSection) {
    const sectionFields = fields.slice(i, i + fieldsPerSection);
    sections.push({
      title: sections.length === 0 ? title : undefined,
      description: sections.length === 0 ? description : undefined,
      fields: sectionFields,
    });
  }

  return sections;
}
