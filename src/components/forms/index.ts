// Enhanced form components with Zod validation
export {
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
  SwitchField,
  DateField,
  type SelectOption,
  type BaseFieldProps,
  type TextFieldProps,
  type TextareaFieldProps,
  type SelectFieldProps,
  type CheckboxFieldProps,
  type SwitchFieldProps,
  type DateFieldProps,
} from "./FormField";

export {
  FormBuilder,
  createFormSections,
  type FieldType,
  type FieldConfig,
  type FormSection,
  type FormBuilderProps,
} from "./FormBuilder";

// Form validation hooks
export {
  useFormValidation,
  useAsyncValidation,
  useFormAutoSave,
  useFieldDependency,
  createFieldProps,
  type UseFormValidationOptions,
  type UseFormValidationReturn,
} from "@/lib/hooks/useFormValidation";

// Validation schemas
export {
  emailSchema,
  passwordSchema,
  phoneSchema,
  zipCodeSchema,
  currencySchema,
  percentageSchema,
  userProfileSchema,
  changePasswordSchema,
  locationSchema,
  locationUpdateSchema,
  payrollEntrySchema,
  reportFilterSchema,
  reportExportSchema,
  userPreferencesSchema,
  facilitySettingsSchema,
  contactFormSchema,
  searchSchema,
  type UserProfile,
  type ChangePassword,
  type Location,
  type LocationUpdate,
  type PayrollEntry,
  type ReportFilter,
  type ReportExport,
  type UserPreferences,
  type FacilitySettings,
  type ContactForm,
  type SearchParams,
} from "@/lib/validation/schemas";

// Example forms
export { LocationForm } from "./examples/LocationForm";
export { UserProfileForm } from "./examples/UserProfileForm";
