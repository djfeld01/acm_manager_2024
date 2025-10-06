"use client";

import React from "react";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import { locationSchema, Location } from "@/lib/validation/schemas";
import { FormBuilder, FieldConfig } from "../FormBuilder";
import { toast } from "sonner";

interface LocationFormProps {
  initialData?: Partial<Location>;
  onSubmit?: (data: Location) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
}

export function LocationForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: LocationFormProps) {
  const form = useFormValidation({
    schema: locationSchema,
    defaultValues: {
      facilityName: "",
      facilityAbbreviation: "",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      email: "",
      phoneNumber: "",
      website: "",
      isActive: true,
      storageCommissionRate: 0,
      insuranceCommissionRate: 0,
      ...initialData,
    },
    onSubmit: async (data) => {
      try {
        if (onSubmit) {
          await onSubmit(data);
        }
        toast.success(
          isEditing
            ? "Location updated successfully"
            : "Location created successfully"
        );
      } catch (error) {
        toast.error("Failed to save location");
        throw error;
      }
    },
  });

  const formSections = [
    {
      title: "Basic Information",
      description: "Enter the basic details for this storage facility",
      fields: [
        {
          name: "facilityName",
          type: "text",
          label: "Facility Name",
          placeholder: "Downtown Storage Center",
          required: true,
        },
        {
          name: "facilityAbbreviation",
          type: "text",
          label: "Abbreviation",
          placeholder: "DSC",
          required: true,
          description:
            "Short code for this facility (uppercase letters and numbers only)",
        },
        {
          name: "isActive",
          type: "switch",
          label: "Status",
          switchLabel: "Active facility",
          description: "Inactive facilities won't appear in most reports",
        },
      ] as FieldConfig[],
    },
    {
      title: "Address Information",
      description: "Physical address and contact details",
      fields: [
        {
          name: "streetAddress",
          type: "text",
          label: "Street Address",
          placeholder: "123 Main Street",
          required: true,
        },
        {
          name: "city",
          type: "text",
          label: "City",
          placeholder: "Austin",
          required: true,
        },
        {
          name: "state",
          type: "text",
          label: "State",
          placeholder: "TX",
          required: true,
          description: "Two-letter state code",
        },
        {
          name: "zipCode",
          type: "text",
          label: "ZIP Code",
          placeholder: "78701",
          required: true,
        },
      ] as FieldConfig[],
    },
    {
      title: "Contact Information",
      description: "How customers can reach this facility",
      fields: [
        {
          name: "email",
          type: "email",
          label: "Email Address",
          placeholder: "info@facility.com",
          required: true,
        },
        {
          name: "phoneNumber",
          type: "tel",
          label: "Phone Number",
          placeholder: "(555) 123-4567",
          required: true,
        },
        {
          name: "website",
          type: "url",
          label: "Website",
          placeholder: "https://www.facility.com",
          description: "Optional website URL",
        },
      ] as FieldConfig[],
    },
    {
      title: "Commission Rates",
      description: "Set commission rates for this facility",
      fields: [
        {
          name: "storageCommissionRate",
          type: "number",
          label: "Storage Commission Rate (%)",
          placeholder: "5.0",
          min: 0,
          max: 100,
          step: 0.1,
          required: true,
        },
        {
          name: "insuranceCommissionRate",
          type: "number",
          label: "Insurance Commission Rate (%)",
          placeholder: "10.0",
          min: 0,
          max: 100,
          step: 0.1,
          required: true,
        },
      ] as FieldConfig[],
    },
  ];

  return (
    <FormBuilder
      form={form}
      sections={formSections}
      onSubmit={form.handleSubmit}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      submitButtonText={isEditing ? "Update Location" : "Create Location"}
      showResetButton={!isEditing}
      resetButtonText="Clear Form"
      title={isEditing ? "Edit Location" : "Add New Location"}
      description={
        isEditing
          ? "Update the details for this storage facility"
          : "Create a new storage facility in the system"
      }
      cardWrapper
    />
  );
}
