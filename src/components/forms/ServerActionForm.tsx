"use client";

import React from "react";
import { z } from "zod";
import { useFormAction, useServerAction } from "@/lib/hooks/useServerAction";
import { FormActionResult } from "@/lib/actions/formActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Loader2, Upload } from "lucide-react";

export interface ServerActionFormProps {
  action: (formData: FormData) => Promise<FormActionResult>;
  title?: string;
  description?: string;
  submitButtonText?: string;
  successMessage?: string;
  errorMessage?: string;
  resetOnSuccess?: boolean;
  redirectOnSuccess?: string;
  showLoadingState?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ServerActionForm({
  action,
  title,
  description,
  submitButtonText = "Submit",
  successMessage,
  errorMessage,
  resetOnSuccess = false,
  redirectOnSuccess,
  showLoadingState = true,
  className,
  children,
}: ServerActionFormProps) {
  const { handleSubmit, isLoading, error, fieldErrors, clearError } =
    useFormAction(action, {
      successMessage,
      errorMessage,
      resetOnSuccess,
      redirectOnSuccess,
    });

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="relative w-full rounded-lg border border-destructive/50 p-4 text-destructive">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {fieldErrors && Object.keys(fieldErrors).length > 0 && (
            <div className="relative w-full rounded-lg border border-destructive/50 p-4 text-destructive">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    Please fix the following errors:
                  </p>
                  <ul className="list-disc list-inside text-sm">
                    {Object.entries(fieldErrors).map(([field, errors]) => (
                      <li key={field}>
                        <strong>{field}:</strong> {errors.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">{children}</div>

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading && showLoadingState && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {submitButtonText}
            </Button>

            {isLoading && showLoadingState && (
              <Badge variant="secondary" className="animate-pulse">
                Processing...
              </Badge>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// File Upload Component with Server Action
export interface FileUploadProps {
  uploadAction: (
    formData: FormData
  ) => Promise<FormActionResult<{ url: string; filename: string }>>;
  onSuccess?: (data: { url: string; filename: string }) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  className?: string;
}

export function FileUpload({
  uploadAction,
  onSuccess,
  onError,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState<
    Array<{ url: string; filename: string }>
  >([]);

  const { execute, isLoading, error, clearError } = useServerAction(
    uploadAction,
    {
      onSuccess: (data) => {
        setUploadedFiles((prev) => [...prev, data]);
        if (onSuccess) {
          onSuccess(data);
        }
      },
      onError,
      successMessage: "File uploaded successfully",
    }
  );

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Client-side validation
      if (file.size > maxSize) {
        const errorMsg = `File "${file.name}" is too large. Maximum size is ${(
          maxSize /
          1024 /
          1024
        ).toFixed(1)}MB.`;
        if (onError) {
          onError(errorMsg);
        }
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      await execute(formData);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isLoading && "opacity-50 pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="space-y-4">
          <p className="text-lg font-medium">
            {isDragging ? "Drop files here" : "Upload files"}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag and drop files here, or click the button below to select
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum file size: {(maxSize / 1024 / 1024).toFixed(1)}MB
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              document.getElementById("file-upload-input")?.click()
            }
            disabled={isLoading}
            className="mt-4"
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose Files
          </Button>
        </div>

        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload-input"
          disabled={isLoading}
        />

        {isLoading && (
          <div className="mt-4">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="relative w-full rounded-lg border border-destructive/50 p-4 text-destructive">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 border rounded"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{file.filename}</span>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline ml-auto"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Optimistic List Component
export interface OptimisticListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  addAction?: (formData: FormData) => Promise<FormActionResult<T>>;
  updateAction?: (
    id: string,
    formData: FormData
  ) => Promise<FormActionResult<T>>;
  deleteAction?: (id: string) => Promise<FormActionResult>;
  getItemId: (item: T) => string;
  optimisticAdd?: (items: T[], formData: FormData) => T[];
  optimisticUpdate?: (items: T[], id: string, formData: FormData) => T[];
  optimisticDelete?: (items: T[], id: string) => T[];
  className?: string;
}

export function OptimisticList<T>({
  items: initialItems,
  renderItem,
  addAction,
  updateAction,
  deleteAction,
  getItemId,
  optimisticAdd,
  optimisticUpdate,
  optimisticDelete,
  className,
}: OptimisticListProps<T>) {
  const [items, setItems] = React.useState<T[]>(initialItems);
  const [isLoading, setIsLoading] = React.useState(false);

  // Update items when initialItems change
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleAdd = async (formData: FormData) => {
    if (!addAction || !optimisticAdd) return;

    setIsLoading(true);
    const originalItems = [...items];

    // Apply optimistic update
    const optimisticItems = optimisticAdd(items, formData);
    setItems(optimisticItems);

    try {
      const result = await addAction(formData);

      if (!result.success) {
        // Revert on error
        setItems(originalItems);
      }
    } catch (error) {
      // Revert on error
      setItems(originalItems);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string, formData: FormData) => {
    if (!updateAction || !optimisticUpdate) return;

    setIsLoading(true);
    const originalItems = [...items];

    // Apply optimistic update
    const optimisticItems = optimisticUpdate(items, id, formData);
    setItems(optimisticItems);

    try {
      const result = await updateAction(id, formData);

      if (!result.success) {
        // Revert on error
        setItems(originalItems);
      }
    } catch (error) {
      // Revert on error
      setItems(originalItems);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!deleteAction || !optimisticDelete) return;

    setIsLoading(true);
    const originalItems = [...items];

    // Apply optimistic update
    const optimisticItems = optimisticDelete(items, id);
    setItems(optimisticItems);

    try {
      const result = await deleteAction(id);

      if (!result.success) {
        // Revert on error
        setItems(originalItems);
      }
    } catch (error) {
      // Revert on error
      setItems(originalItems);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={getItemId(item)} className="relative">
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No items found</p>
        </div>
      )}
    </div>
  );
}
