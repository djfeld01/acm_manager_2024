"use client";

import React from "react";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import { userProfileSchema, UserProfile } from "@/lib/validation/schemas";
import { FormBuilder, FieldConfig } from "../FormBuilder";
import { toast } from "sonner";

interface UserProfileFormProps {
  initialData?: Partial<UserProfile>;
  onSubmit?: (data: UserProfile) => Promise<void>;
  showImageUpload?: boolean;
}

export function UserProfileForm({
  initialData,
  onSubmit,
  showImageUpload = false,
}: UserProfileFormProps) {
  const form = useFormValidation({
    schema: userProfileSchema,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      image: "",
      ...initialData,
    },
    onSubmit: async (data) => {
      try {
        if (onSubmit) {
          await onSubmit(data);
        }
        toast.success("Profile updated successfully");
      } catch (error) {
        toast.error("Failed to update profile");
        throw error;
      }
    },
  });

  const formFields: FieldConfig[] = [
    {
      name: "name",
      type: "text",
      label: "Full Name",
      placeholder: "John Doe",
      required: true,
    },
    {
      name: "email",
      type: "email",
      label: "Email Address",
      placeholder: "john@example.com",
      required: true,
    },
    {
      name: "phone",
      type: "tel",
      label: "Phone Number",
      placeholder: "(555) 123-4567",
      description: "Optional phone number for contact",
    },
  ];

  if (showImageUpload) {
    formFields.push({
      name: "image",
      type: "url",
      label: "Profile Image URL",
      placeholder: "https://example.com/avatar.jpg",
      description: "Optional profile image URL",
    });
  }

  const formSections = [
    {
      title: "Personal Information",
      description: "Update your personal details",
      fields: formFields,
    },
  ];

  return (
    <FormBuilder
      form={form}
      sections={formSections}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      submitButtonText="Update Profile"
      showResetButton={true}
      resetButtonText="Reset Changes"
      title="Edit Profile"
      description="Keep your profile information up to date"
      cardWrapper
    />
  );
}
