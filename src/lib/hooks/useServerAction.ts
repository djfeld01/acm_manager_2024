"use client";

import { useState, useTransition, useCallback } from "react";
import { toast } from "sonner";
import { FormActionResult } from "@/lib/actions/formActions";

export interface UseServerActionOptions<T = any> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

export interface UseServerActionReturn<T = any> {
  execute: (formData: FormData) => Promise<FormActionResult<T>>;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  clearError: () => void;
}

/**
 * Hook for executing server actions with loading states and error handling
 */
export function useServerAction<T = any>(
  action: (formData: FormData) => Promise<FormActionResult<T>>,
  options: UseServerActionOptions<T> = {}
): UseServerActionReturn<T> {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showToast = true,
  } = options;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<
    string,
    string[]
  > | null>(null);

  const execute = useCallback(
    async (formData: FormData): Promise<FormActionResult<T>> => {
      setError(null);
      setFieldErrors(null);

      return new Promise((resolve) => {
        startTransition(async () => {
          try {
            const result = await action(formData);

            if (result.success) {
              if (showToast && successMessage) {
                toast.success(successMessage);
              }
              if (onSuccess && result.data !== undefined) {
                onSuccess(result.data);
              }
            } else {
              const errorMsg =
                result.error || errorMessage || "An error occurred";
              setError(errorMsg);

              if (result.fieldErrors) {
                setFieldErrors(result.fieldErrors);
              }

              if (showToast) {
                toast.error(errorMsg);
              }
              if (onError) {
                onError(errorMsg);
              }
            }

            resolve(result);
          } catch (err) {
            const errorMsg =
              err instanceof Error
                ? err.message
                : "An unexpected error occurred";
            setError(errorMsg);

            if (showToast) {
              toast.error(errorMsg);
            }
            if (onError) {
              onError(errorMsg);
            }

            resolve({
              success: false,
              error: errorMsg,
            });
          }
        });
      });
    },
    [action, onSuccess, onError, successMessage, errorMessage, showToast]
  );

  const clearError = useCallback(() => {
    setError(null);
    setFieldErrors(null);
  }, []);

  return {
    execute,
    isLoading: isPending,
    error,
    fieldErrors,
    clearError,
  };
}

/**
 * Hook for optimistic updates with server actions
 */
export function useOptimisticAction<T, U = T>(
  initialData: T[],
  action: (formData: FormData) => Promise<FormActionResult<U>>,
  options: {
    optimisticUpdate: (currentData: T[], formData: FormData) => T[];
    onSuccess?: (data: U, optimisticData: T[]) => T[];
    onError?: (error: string, originalData: T[]) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const [data, setData] = useState<T[]>(initialData);
  const [originalData, setOriginalData] = useState<T[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (formData: FormData) => {
      setError(null);
      setOriginalData(data);

      // Apply optimistic update
      const optimisticData = options.optimisticUpdate(data, formData);
      setData(optimisticData);

      startTransition(async () => {
        try {
          const result = await action(formData);

          if (result.success) {
            // Apply real update or keep optimistic update
            const finalData =
              options.onSuccess && result.data !== undefined
                ? options.onSuccess(result.data, optimisticData)
                : optimisticData;

            setData(finalData);

            if (options.successMessage) {
              toast.success(options.successMessage);
            }
          } else {
            // Revert to original data on error
            setData(originalData);
            const errorMsg =
              result.error || options.errorMessage || "An error occurred";
            setError(errorMsg);
            toast.error(errorMsg);

            if (options.onError) {
              options.onError(errorMsg, originalData);
            }
          }
        } catch (err) {
          // Revert to original data on error
          setData(originalData);
          const errorMsg =
            err instanceof Error ? err.message : "An unexpected error occurred";
          setError(errorMsg);
          toast.error(errorMsg);

          if (options.onError) {
            options.onError(errorMsg, originalData);
          }
        }
      });
    },
    [data, originalData, action, options]
  );

  return {
    data,
    execute,
    isLoading: isPending,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for handling form submissions with server actions
 */
export function useFormAction<T = any>(
  action: (formData: FormData) => Promise<FormActionResult<T>>,
  options: UseServerActionOptions<T> & {
    resetOnSuccess?: boolean;
    redirectOnSuccess?: string;
  } = {}
) {
  const {
    resetOnSuccess = false,
    redirectOnSuccess,
    ...serverActionOptions
  } = options;

  const serverAction = useServerAction(action, {
    ...serverActionOptions,
    onSuccess: (data) => {
      if (resetOnSuccess) {
        // Reset form if needed
        const form = document.querySelector("form") as HTMLFormElement;
        if (form) {
          form.reset();
        }
      }

      if (redirectOnSuccess) {
        window.location.href = redirectOnSuccess;
      }

      if (serverActionOptions.onSuccess) {
        serverActionOptions.onSuccess(data);
      }
    },
  });

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      return serverAction.execute(formData);
    },
    [serverAction]
  );

  return {
    ...serverAction,
    handleSubmit,
  };
}

/**
 * Hook for handling file uploads with progress
 */
export function useFileUpload(
  uploadAction: (
    formData: FormData
  ) => Promise<FormActionResult<{ url: string; filename: string }>>,
  options: {
    onSuccess?: (data: { url: string; filename: string }) => void;
    onError?: (error: string) => void;
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (
      file: File
    ): Promise<FormActionResult<{ url: string; filename: string }>> => {
      setError(null);
      setProgress(0);

      // Client-side validation
      if (options.maxSize && file.size > options.maxSize) {
        const errorMsg = `File too large. Maximum size is ${(
          options.maxSize /
          1024 /
          1024
        ).toFixed(1)}MB.`;
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        const errorMsg = `Invalid file type. Allowed types: ${options.allowedTypes.join(
          ", "
        )}`;
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      setIsUploading(true);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadAction(formData);

        clearInterval(progressInterval);
        setProgress(100);

        if (result.success) {
          toast.success("File uploaded successfully");
          if (options.onSuccess) {
            options.onSuccess(result.data!);
          }
        } else {
          const errorMsg = result.error || "Upload failed";
          setError(errorMsg);
          toast.error(errorMsg);
          if (options.onError) {
            options.onError(errorMsg);
          }
        }

        return result;
      } catch (err) {
        clearInterval(progressInterval);
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setError(errorMsg);
        toast.error(errorMsg);
        if (options.onError) {
          options.onError(errorMsg);
        }
        return { success: false, error: errorMsg };
      } finally {
        setIsUploading(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [uploadAction, options]
  );

  return {
    upload,
    isUploading,
    progress,
    error,
    clearError: () => setError(null),
  };
}
