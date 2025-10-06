import { useForm, UseFormProps, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useCallback } from "react";

export interface UseFormValidationOptions<T extends z.ZodType>
  extends Omit<UseFormProps<z.infer<T>>, "resolver"> {
  schema: T;
  onSubmit?: (data: z.infer<T>) => Promise<void> | void;
  onError?: (error: Error) => void;
}

export interface UseFormValidationReturn<T extends z.ZodType>
  extends UseFormReturn<z.infer<T>> {
  isSubmitting: boolean;
  submitError: string | null;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  clearSubmitError: () => void;
}

/**
 * Enhanced useForm hook with Zod validation and submission handling
 */
export function useFormValidation<T extends z.ZodType>({
  schema,
  onSubmit,
  onError,
  ...formOptions
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    ...formOptions,
  });

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      if (e) {
        e.preventDefault();
      }

      setSubmitError(null);
      setIsSubmitting(true);

      try {
        const isValid = await form.trigger();
        if (!isValid) {
          setIsSubmitting(false);
          return;
        }

        const data = form.getValues();

        if (onSubmit) {
          await onSubmit(data);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setSubmitError(errorMessage);

        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage));
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSubmit, onError]
  );

  return {
    ...form,
    isSubmitting,
    submitError,
    handleSubmit,
    clearSubmitError,
  };
}

/**
 * Hook for handling async field validation
 */
export function useAsyncValidation<T>(
  validator: (value: T) => Promise<boolean | string>,
  debounceMs: number = 500
) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = useCallback(
    async (value: T) => {
      setIsValidating(true);
      setValidationError(null);

      try {
        const result = await validator(value);

        if (typeof result === "string") {
          setValidationError(result);
          return false;
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Validation failed";
        setValidationError(errorMessage);
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [validator]
  );

  return {
    validate,
    isValidating,
    validationError,
    clearValidationError: () => setValidationError(null),
  };
}

/**
 * Hook for form auto-save functionality
 */
export function useFormAutoSave<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  onSave: (data: T) => Promise<void>,
  options: {
    debounceMs?: number;
    enabled?: boolean;
    excludeFields?: (keyof T)[];
  } = {}
) {
  const { debounceMs = 2000, enabled = true, excludeFields = [] } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveData = useCallback(
    async (data: T) => {
      if (!enabled) return;

      setIsSaving(true);
      setSaveError(null);

      try {
        // Filter out excluded fields
        const filteredData = Object.keys(data).reduce((acc, key) => {
          if (!excludeFields.includes(key as keyof T)) {
            acc[key as keyof T] = data[key as keyof T];
          }
          return acc;
        }, {} as T);

        await onSave(filteredData);
        setLastSaved(new Date());
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Auto-save failed";
        setSaveError(errorMessage);
      } finally {
        setIsSaving(false);
      }
    },
    [onSave, enabled, excludeFields]
  );

  // Set up auto-save on form changes
  const watchedValues = form.watch();

  React.useEffect(() => {
    if (!enabled) return;

    const timeoutId = setTimeout(() => {
      const formData = form.getValues();
      const hasErrors = Object.keys(form.formState.errors).length > 0;

      if (!hasErrors && form.formState.isDirty) {
        saveData(formData);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, saveData, debounceMs, enabled, form]);

  return {
    isSaving,
    lastSaved,
    saveError,
    clearSaveError: () => setSaveError(null),
  };
}

/**
 * Hook for handling form field dependencies
 */
export function useFieldDependency<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  dependencies: {
    field: keyof T;
    dependsOn: keyof T;
    condition: (value: any) => boolean;
    action: "show" | "hide" | "enable" | "disable" | "clear";
  }[]
) {
  const watchedValues = form.watch();

  const getFieldState = useCallback(
    (fieldName: keyof T) => {
      const dependency = dependencies.find((dep) => dep.field === fieldName);
      if (!dependency) return { visible: true, enabled: true };

      const dependentValue = watchedValues[dependency.dependsOn];
      const conditionMet = dependency.condition(dependentValue);

      switch (dependency.action) {
        case "show":
          return { visible: conditionMet, enabled: true };
        case "hide":
          return { visible: !conditionMet, enabled: true };
        case "enable":
          return { visible: true, enabled: conditionMet };
        case "disable":
          return { visible: true, enabled: !conditionMet };
        case "clear":
          if (conditionMet) {
            form.setValue(dependency.field, undefined as any);
          }
          return { visible: true, enabled: true };
        default:
          return { visible: true, enabled: true };
      }
    },
    [dependencies, watchedValues, form]
  );

  return { getFieldState };
}

/**
 * Utility function to create form field props with validation
 */
export function createFieldProps<T extends z.ZodType>(
  form: UseFormReturn<z.infer<T>>,
  fieldName: keyof z.infer<T>,
  options: {
    required?: boolean;
    disabled?: boolean;
  } = {}
) {
  const { required = false, disabled = false } = options;

  return {
    control: form.control,
    name: fieldName as any,
    required,
    disabled: disabled || form.formState.isSubmitting,
  };
}
