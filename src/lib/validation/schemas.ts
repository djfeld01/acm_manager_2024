import { z } from "zod";

// Common validation patterns
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

export const phoneSchema = z
  .string()
  .regex(
    /^(\+1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/,
    "Invalid phone number format"
  );

export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format");

export const currencySchema = z
  .number()
  .min(0, "Amount must be positive")
  .max(999999.99, "Amount too large");

export const percentageSchema = z
  .number()
  .min(0, "Percentage must be at least 0")
  .max(100, "Percentage cannot exceed 100");

// User-related schemas
export const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: emailSchema,
  phone: phoneSchema.optional(),
  image: z.string().url("Invalid image URL").optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Location-related schemas
export const locationSchema = z.object({
  facilityName: z
    .string()
    .min(1, "Facility name is required")
    .max(100, "Facility name too long"),
  facilityAbbreviation: z
    .string()
    .min(1, "Abbreviation is required")
    .max(10, "Abbreviation too long")
    .regex(
      /^[A-Z0-9]+$/,
      "Abbreviation must be uppercase letters and numbers only"
    ),
  streetAddress: z
    .string()
    .min(1, "Street address is required")
    .max(200, "Address too long"),
  city: z.string().min(1, "City is required").max(100, "City name too long"),
  state: z
    .string()
    .min(2, "State is required")
    .max(2, "State must be 2 characters")
    .regex(/^[A-Z]{2}$/, "State must be 2 uppercase letters"),
  zipCode: zipCodeSchema,
  email: emailSchema,
  phoneNumber: phoneSchema,
  website: z.string().url("Invalid website URL").optional(),
  isActive: z.boolean().default(true),
  storageCommissionRate: percentageSchema,
  insuranceCommissionRate: percentageSchema,
});

export const locationUpdateSchema = locationSchema.partial();

// Payroll-related schemas
export const payrollEntrySchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  locationId: z.string().min(1, "Location ID is required"),
  payPeriodStart: z.date(),
  payPeriodEnd: z.date(),
  hoursWorked: z
    .number()
    .min(0, "Hours must be positive")
    .max(168, "Hours cannot exceed 168 per week"),
  hourlyRate: currencySchema,
  overtimeHours: z
    .number()
    .min(0, "Overtime hours must be positive")
    .max(40, "Overtime hours cannot exceed 40"),
  overtimeRate: currencySchema,
  bonusAmount: currencySchema.optional(),
  commissionAmount: currencySchema.optional(),
  deductions: z
    .array(
      z.object({
        type: z.string().min(1, "Deduction type is required"),
        amount: currencySchema,
        description: z.string().optional(),
      })
    )
    .default([]),
});

// Report-related schemas
export const reportFilterSchema = z.object({
  locationIds: z
    .array(z.string())
    .min(1, "At least one location must be selected"),
  startDate: z.date(),
  endDate: z.date(),
  reportType: z.enum(["occupancy", "revenue", "payroll", "performance"]),
  includeInactive: z.boolean().default(false),
});

export const reportExportSchema = z.object({
  format: z.enum(["csv", "pdf", "excel"]),
  includeCharts: z.boolean().default(true),
  includeDetails: z.boolean().default(true),
});

// Settings schemas
export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  defaultView: z
    .enum(["dashboard", "payroll", "locations"])
    .default("dashboard"),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    alerts: z.boolean().default(true),
  }),
  dateFormat: z
    .enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"])
    .default("MM/DD/YYYY"),
  timeFormat: z.enum(["12h", "24h"]).default("12h"),
  currency: z.enum(["USD", "CAD", "EUR"]).default("USD"),
});

export const facilitySettingsSchema = z.object({
  facilityId: z.string().min(1, "Facility ID is required"),
  businessHours: z.object({
    monday: z.object({
      open: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      close: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      closed: z.boolean().default(false),
    }),
    tuesday: z.object({
      open: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      close: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      closed: z.boolean().default(false),
    }),
    wednesday: z.object({
      open: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      close: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      closed: z.boolean().default(false),
    }),
    thursday: z.object({
      open: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      close: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      closed: z.boolean().default(false),
    }),
    friday: z.object({
      open: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      close: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      closed: z.boolean().default(false),
    }),
    saturday: z.object({
      open: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      close: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      closed: z.boolean().default(false),
    }),
    sunday: z.object({
      open: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      close: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      closed: z.boolean().default(false),
    }),
  }),
  autoLockTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  allowOnlinePayments: z.boolean().default(true),
  requireInsurance: z.boolean().default(false),
  defaultUnitSize: z.string().min(1, "Default unit size is required"),
});

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message too long"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z
    .enum(["general", "billing", "technical", "complaint"])
    .default("general"),
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().max(100, "Search query too long"),
  filters: z
    .object({
      category: z.string().optional(),
      dateRange: z
        .object({
          start: z.date(),
          end: z.date(),
        })
        .optional(),
      status: z.string().optional(),
      location: z.string().optional(),
    })
    .optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Export type definitions for use in components
export type UserProfile = z.infer<typeof userProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type Location = z.infer<typeof locationSchema>;
export type LocationUpdate = z.infer<typeof locationUpdateSchema>;
export type PayrollEntry = z.infer<typeof payrollEntrySchema>;
export type ReportFilter = z.infer<typeof reportFilterSchema>;
export type ReportExport = z.infer<typeof reportExportSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type FacilitySettings = z.infer<typeof facilitySettingsSchema>;
export type ContactForm = z.infer<typeof contactFormSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
