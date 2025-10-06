"use client";

import React from "react";
import { createLocation, updateLocation } from "@/lib/actions/formActions";
import { ServerActionForm } from "../ServerActionForm";
import { TextField, SelectField, SwitchField } from "../FormField";
import { Location } from "@/lib/validation/schemas";

interface ServerActionLocationFormProps {
  initialData?: Partial<Location>;
  locationId?: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

export function ServerActionLocationForm({
  initialData,
  locationId,
  onSuccess,
  onCancel,
}: ServerActionLocationFormProps) {
  const isEditing = !!locationId;

  const action = isEditing
    ? (formData: FormData) => updateLocation(locationId, formData)
    : createLocation;

  return (
    <ServerActionForm
      action={action}
      title={isEditing ? "Edit Location" : "Create New Location"}
      description={
        isEditing
          ? "Update the details for this storage facility"
          : "Add a new storage facility to the system"
      }
      submitButtonText={isEditing ? "Update Location" : "Create Location"}
      successMessage={
        isEditing
          ? "Location updated successfully"
          : "Location created successfully"
      }
      resetOnSuccess={!isEditing}
      redirectOnSuccess={isEditing ? undefined : "/locations"}
    >
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="facilityName"
              className="block text-sm font-medium mb-2"
            >
              Facility Name *
            </label>
            <input
              type="text"
              id="facilityName"
              name="facilityName"
              defaultValue={initialData?.facilityName}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Downtown Storage Center"
            />
          </div>

          <div>
            <label
              htmlFor="facilityAbbreviation"
              className="block text-sm font-medium mb-2"
            >
              Abbreviation *
            </label>
            <input
              type="text"
              id="facilityAbbreviation"
              name="facilityAbbreviation"
              defaultValue={initialData?.facilityAbbreviation}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="DSC"
              maxLength={10}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            defaultChecked={initialData?.isActive ?? true}
            className="rounded border-gray-300"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Active facility
          </label>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Address Information</h3>

        <div>
          <label
            htmlFor="streetAddress"
            className="block text-sm font-medium mb-2"
          >
            Street Address *
          </label>
          <input
            type="text"
            id="streetAddress"
            name="streetAddress"
            defaultValue={initialData?.streetAddress}
            required
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-2">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              defaultValue={initialData?.city}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Austin"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium mb-2">
              State *
            </label>
            <input
              type="text"
              id="state"
              name="state"
              defaultValue={initialData?.state}
              required
              maxLength={2}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="TX"
            />
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium mb-2">
              ZIP Code *
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              defaultValue={initialData?.zipCode}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="78701"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={initialData?.email}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="info@facility.com"
            />
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium mb-2"
            >
              Phone Number *
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              defaultValue={initialData?.phoneNumber}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium mb-2">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            defaultValue={initialData?.website}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="https://www.facility.com"
          />
        </div>
      </div>

      {/* Commission Rates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Commission Rates</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="storageCommissionRate"
              className="block text-sm font-medium mb-2"
            >
              Storage Commission Rate (%) *
            </label>
            <input
              type="number"
              id="storageCommissionRate"
              name="storageCommissionRate"
              defaultValue={initialData?.storageCommissionRate}
              required
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="5.0"
            />
          </div>

          <div>
            <label
              htmlFor="insuranceCommissionRate"
              className="block text-sm font-medium mb-2"
            >
              Insurance Commission Rate (%) *
            </label>
            <input
              type="number"
              id="insuranceCommissionRate"
              name="insuranceCommissionRate"
              defaultValue={initialData?.insuranceCommissionRate}
              required
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="10.0"
            />
          </div>
        </div>
      </div>

      {onCancel && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}
    </ServerActionForm>
  );
}
