"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  userProfileSchema,
  locationSchema,
  contactFormSchema,
  changePasswordSchema,
  UserProfile,
  Location,
  ContactForm,
  ChangePassword,
} from "@/lib/validation/schemas";

// Generic form action result type
export type FormActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Generic server action wrapper with validation
export async function createFormAction<T extends z.ZodType>(
  schema: T,
  handler: (data: z.infer<T>) => Promise<any>
) {
  return async (formData: FormData): Promise<FormActionResult> => {
    try {
      // Convert FormData to object
      const rawData = Object.fromEntries(formData.entries());

      // Parse and validate data
      const validatedData = schema.parse(rawData);

      // Execute handler
      const result = await handler(validatedData);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: "Validation failed",
          fieldErrors: error.flatten().fieldErrors,
        };
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  };
}

// User Profile Actions
export async function updateUserProfile(
  userId: string,
  formData: FormData
): Promise<FormActionResult<UserProfile>> {
  const action = createFormAction(
    userProfileSchema,
    async (data: UserProfile) => {
      // Simulate database update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you would update the database here
      console.log("Updating user profile:", { userId, ...data });

      // Revalidate relevant paths
      revalidatePath("/profile");
      revalidatePath("/dashboard");

      return data;
    }
  );

  return action(formData);
}

export async function changeUserPassword(
  userId: string,
  formData: FormData
): Promise<FormActionResult> {
  const action = createFormAction(
    changePasswordSchema,
    async (data: ChangePassword) => {
      // Simulate password validation and update
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, you would:
      // 1. Verify current password
      // 2. Hash new password
      // 3. Update database
      // 4. Invalidate sessions if needed

      console.log("Changing password for user:", userId);

      return { message: "Password updated successfully" };
    }
  );

  return action(formData);
}

// Location Management Actions
export async function createLocation(
  formData: FormData
): Promise<FormActionResult<Location>> {
  const action = createFormAction(locationSchema, async (data: Location) => {
    // Simulate database creation
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // In a real app, you would create the location in the database
    const newLocation = {
      ...data,
      id: `loc_${Date.now()}`, // Generate ID
      createdAt: new Date().toISOString(),
    };

    console.log("Creating location:", newLocation);

    // Revalidate locations pages
    revalidatePath("/locations");
    revalidatePath("/dashboard");

    return newLocation;
  });

  return action(formData);
}

export async function updateLocation(
  locationId: string,
  formData: FormData
): Promise<FormActionResult<Location>> {
  const action = createFormAction(locationSchema, async (data: Location) => {
    // Simulate database update
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, you would update the location in the database
    const updatedLocation = {
      ...data,
      id: locationId,
      updatedAt: new Date().toISOString(),
    };

    console.log("Updating location:", updatedLocation);

    // Revalidate relevant paths
    revalidatePath("/locations");
    revalidatePath(`/locations/${locationId}`);
    revalidatePath("/dashboard");

    return updatedLocation;
  });

  return action(formData);
}

export async function deleteLocation(
  locationId: string
): Promise<FormActionResult> {
  try {
    // Simulate database deletion
    await new Promise((resolve) => setTimeout(resolve, 800));

    // In a real app, you would:
    // 1. Check if location can be deleted (no active leases, etc.)
    // 2. Soft delete or hard delete from database
    // 3. Clean up related data

    console.log("Deleting location:", locationId);

    // Revalidate locations pages
    revalidatePath("/locations");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { message: "Location deleted successfully" },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete location",
    };
  }
}

// Contact Form Action
export async function submitContactForm(
  formData: FormData
): Promise<FormActionResult> {
  const action = createFormAction(
    contactFormSchema,
    async (data: ContactForm) => {
      // Simulate email sending or ticket creation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real app, you would:
      // 1. Send email notification
      // 2. Create support ticket
      // 3. Store in database
      // 4. Send confirmation email

      console.log("Submitting contact form:", data);

      return {
        ticketId: `TICKET-${Date.now()}`,
        message:
          "Your message has been sent successfully. We'll get back to you soon!",
      };
    }
  );

  return action(formData);
}

// Bulk Operations
export async function bulkUpdateLocations(
  locationIds: string[],
  updates: Partial<Location>
): Promise<FormActionResult> {
  try {
    // Simulate bulk update
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real app, you would update multiple locations in the database
    console.log("Bulk updating locations:", { locationIds, updates });

    // Revalidate locations pages
    revalidatePath("/locations");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        updatedCount: locationIds.length,
        message: `Successfully updated ${locationIds.length} locations`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bulk update failed",
    };
  }
}

// File Upload Action
export async function uploadFile(
  formData: FormData
): Promise<FormActionResult<{ url: string; filename: string }>> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
      };
    }

    if (file.size > maxSize) {
      return {
        success: false,
        error: "File too large. Maximum size is 5MB.",
      };
    }

    // Simulate file upload
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real app, you would:
    // 1. Upload to cloud storage (S3, Cloudinary, etc.)
    // 2. Generate optimized versions
    // 3. Store metadata in database

    const filename = `${Date.now()}-${file.name}`;
    const url = `/uploads/${filename}`;

    console.log("File uploaded:", {
      filename,
      size: file.size,
      type: file.type,
    });

    return {
      success: true,
      data: { url, filename },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "File upload failed",
    };
  }
}

// Data Export Action
export async function exportData(
  type: "locations" | "users" | "reports",
  format: "csv" | "pdf" | "excel",
  filters?: Record<string, any>
): Promise<FormActionResult<{ downloadUrl: string }>> {
  try {
    // Simulate data export
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // In a real app, you would:
    // 1. Query database with filters
    // 2. Generate file in requested format
    // 3. Store temporarily or upload to cloud
    // 4. Return download URL

    const filename = `${type}-export-${Date.now()}.${format}`;
    const downloadUrl = `/exports/${filename}`;

    console.log("Exporting data:", { type, format, filters, filename });

    return {
      success: true,
      data: { downloadUrl },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}
