"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import { LocationForm } from "@/components/forms/examples/LocationForm";
import { UserProfileForm } from "@/components/forms/examples/UserProfileForm";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import { contactFormSchema, ContactForm } from "@/lib/validation/schemas";
import { z } from "zod";
import { FormBuilder, FieldConfig } from "@/components/forms/FormBuilder";
import {
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
  SwitchField,
  DateField,
} from "@/components/forms/FormField";
import { toast } from "sonner";
import {
  FileText,
  User,
  MapPin,
  MessageSquare,
  Settings,
  Calendar,
} from "lucide-react";

export default function FormsDemo() {
  const [activeTab, setActiveTab] = useState("individual");

  // Contact form example
  const contactForm = useFormValidation({
    schema: contactFormSchema,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      priority: "medium" as const,
      category: "general" as const,
    },
    onSubmit: async (data) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Message sent successfully!");
      console.log("Contact form data:", data);
    },
  });

  const contactFormSections = [
    {
      title: "Contact Information",
      fields: [
        {
          name: "name",
          type: "text",
          label: "Full Name",
          placeholder: "Your full name",
          required: true,
        },
        {
          name: "email",
          type: "email",
          label: "Email Address",
          placeholder: "your@email.com",
          required: true,
        },
        {
          name: "phone",
          type: "tel",
          label: "Phone Number",
          placeholder: "(555) 123-4567",
        },
      ] as FieldConfig[],
    },
    {
      title: "Message Details",
      fields: [
        {
          name: "category",
          type: "select",
          label: "Category",
          required: true,
          options: [
            { value: "general", label: "General Inquiry" },
            { value: "billing", label: "Billing Question" },
            { value: "technical", label: "Technical Support" },
            { value: "complaint", label: "Complaint" },
          ],
        },
        {
          name: "priority",
          type: "select",
          label: "Priority",
          required: true,
          options: [
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ],
        },
        {
          name: "subject",
          type: "text",
          label: "Subject",
          placeholder: "Brief description of your inquiry",
          required: true,
        },
        {
          name: "message",
          type: "textarea",
          label: "Message",
          placeholder: "Please provide details about your inquiry...",
          required: true,
          rows: 5,
          maxLength: 1000,
          showCharCount: true,
        },
      ] as FieldConfig[],
    },
  ];

  // Individual field examples
  const individualForm = useFormValidation({
    schema: contactFormSchema
      .pick({
        name: true,
        email: true,
        message: true,
      })
      .extend({
        password: z.string().min(8, "Password must be at least 8 characters"),
        category: z.string().optional(),
        newsletter: z.boolean().default(false),
        birthdate: z.date().optional(),
        terms: z.boolean().default(false),
      }),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      message: "",
      category: "",
      newsletter: false,
      birthdate: undefined,
      terms: false,
    },
    onSubmit: async (data) => {
      toast.success("Form submitted!");
      console.log("Individual form data:", data);
    },
  });

  const handleLocationSubmit = async (data: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Location saved successfully!");
    console.log("Location data:", data);
  };

  const handleProfileSubmit = async (data: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Profile updated successfully!");
    console.log("Profile data:", data);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forms Demo</h1>
        <p className="text-muted-foreground">
          Demonstration of enhanced form components with Zod validation
        </p>
      </div>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Form Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold">Validation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Zod schema validation</li>
                <li>• Real-time error feedback</li>
                <li>• Custom validation rules</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Field Types</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Text, Email, Password</li>
                <li>• Textarea with char count</li>
                <li>• Select, Checkbox, Switch</li>
                <li>• Date picker</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">UX Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Loading states</li>
                <li>• Error handling</li>
                <li>• Responsive design</li>
                <li>• Accessibility support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Individual Fields
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Contact Form
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location Form
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Form
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Form Fields</CardTitle>
              <p className="text-sm text-muted-foreground">
                Examples of each form field type with validation
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...(individualForm as any)}>
                <form
                  onSubmit={individualForm.handleSubmit}
                  className="space-y-6"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Text Fields</h4>
                      <TextField
                        control={individualForm.control}
                        name="name"
                        label="Full Name"
                        placeholder="Enter your name"
                        required
                      />
                      <TextField
                        control={individualForm.control}
                        name="email"
                        type="email"
                        label="Email Address"
                        placeholder="your@email.com"
                        required
                      />
                      <TextField
                        control={individualForm.control}
                        name="password"
                        type="password"
                        label="Password"
                        placeholder="Enter password"
                        showPasswordToggle
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Other Field Types</h4>
                      <TextareaField
                        control={individualForm.control}
                        name="message"
                        label="Message"
                        placeholder="Enter your message..."
                        rows={3}
                        maxLength={200}
                        showCharCount
                      />
                      <SelectField
                        control={individualForm.control}
                        name="category"
                        label="Category"
                        placeholder="Select a category"
                        options={[
                          { value: "general", label: "General" },
                          { value: "support", label: "Support" },
                          { value: "billing", label: "Billing" },
                        ]}
                      />
                      <CheckboxField
                        control={individualForm.control}
                        name="terms"
                        checkboxLabel="I agree to the terms and conditions"
                      />
                      <SwitchField
                        control={individualForm.control}
                        name="newsletter"
                        label="Notifications"
                        switchLabel="Subscribe to newsletter"
                      />
                      <DateField
                        control={individualForm.control}
                        name="birthdate"
                        label="Birth Date"
                        disableFuture
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={individualForm.isSubmitting}
                    >
                      Submit Individual Form
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => individualForm.reset()}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <FormBuilder
            form={contactForm as any}
            sections={contactFormSections}
            onSubmit={contactForm.handleSubmit}
            isSubmitting={contactForm.isSubmitting}
            submitError={contactForm.submitError}
            submitButtonText="Send Message"
            showResetButton
            title="Contact Us"
            description="Get in touch with our support team"
            cardWrapper
          />
        </TabsContent>

        <TabsContent value="location">
          <LocationForm
            onSubmit={handleLocationSubmit}
            initialData={{
              facilityName: "Demo Storage Center",
              facilityAbbreviation: "DEMO",
              city: "Austin",
              state: "TX",
            }}
          />
        </TabsContent>

        <TabsContent value="profile">
          <UserProfileForm
            onSubmit={handleProfileSubmit}
            initialData={{
              name: "John Doe",
              email: "john@example.com",
              phone: "(555) 123-4567",
            }}
            showImageUpload
          />
        </TabsContent>
      </Tabs>

      {/* Form State Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Form State Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Current Tab Form State</h4>
              <div className="space-y-2 text-sm">
                {activeTab === "individual" && (
                  <>
                    <div>
                      <Badge variant="outline">
                        Dirty: {individualForm.formState.isDirty ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <Badge variant="outline">
                        Valid: {individualForm.formState.isValid ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <Badge variant="outline">
                        Submitting: {individualForm.isSubmitting ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </>
                )}
                {activeTab === "contact" && (
                  <>
                    <div>
                      <Badge variant="outline">
                        Dirty: {contactForm.formState.isDirty ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <Badge variant="outline">
                        Valid: {contactForm.formState.isValid ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <Badge variant="outline">
                        Submitting: {contactForm.isSubmitting ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Form Errors</h4>
              <div className="text-sm text-muted-foreground">
                {activeTab === "individual" &&
                  Object.keys(individualForm.formState.errors).length === 0 &&
                  "No validation errors"}
                {activeTab === "contact" &&
                  Object.keys(contactForm.formState.errors).length === 0 &&
                  "No validation errors"}
                {activeTab === "individual" &&
                  Object.entries(individualForm.formState.errors).map(
                    ([field, error]) => (
                      <div key={field} className="text-red-600">
                        {field}: {error?.message}
                      </div>
                    )
                  )}
                {activeTab === "contact" &&
                  Object.entries(contactForm.formState.errors).map(
                    ([field, error]) => (
                      <div key={field} className="text-red-600">
                        {field}: {error?.message}
                      </div>
                    )
                  )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
