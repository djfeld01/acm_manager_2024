"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ServerActionForm,
  FileUpload,
} from "@/components/forms/ServerActionForm";
import { ServerActionLocationForm } from "@/components/forms/examples/ServerActionLocationForm";
import {
  submitContactForm,
  updateUserProfile,
  uploadFile,
  exportData,
} from "@/lib/actions/formActions";
import {
  useServerAction,
  useOptimisticAction,
} from "@/lib/hooks/useServerAction";
import { toast } from "sonner";
import {
  Server,
  Upload,
  Download,
  User,
  MapPin,
  MessageSquare,
  Zap,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function ServerFormsDemo() {
  const [activeTab, setActiveTab] = useState("contact");
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  // Example of using server action hook directly
  const exportAction = useServerAction(
    (formData: FormData) => {
      const type = formData.get("type") as string;
      const format = formData.get("format") as string;
      return exportData(type as any, format as any);
    },
    {
      onSuccess: (data) => {
        setExportProgress("Export completed!");
        setTimeout(() => setExportProgress(null), 3000);
      },
      successMessage: "Export started successfully",
    }
  );

  // Example of optimistic updates
  const [notifications, setNotifications] = useState([
    { id: "1", message: "Welcome to the demo!", type: "info" },
    { id: "2", message: "Server actions are working!", type: "success" },
  ]);

  const addNotification = (message: string, type: string = "info") => {
    const newNotification = {
      id: Date.now().toString(),
      message,
      type,
    };
    setNotifications((prev) => [newNotification, ...prev]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== newNotification.id)
      );
    }, 5000);
  };

  const handleExport = async (type: string, format: string) => {
    setExportProgress(`Exporting ${type} as ${format}...`);
    const formData = new FormData();
    formData.append("type", type);
    formData.append("format", format);
    await exportAction.execute(formData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Server Actions Demo
        </h1>
        <p className="text-muted-foreground">
          Demonstration of server-side form handling with Next.js Server Actions
        </p>
      </div>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Server Action Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <h4 className="font-semibold">Server-Side Processing</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Form validation on server</li>
                <li>• Secure data processing</li>
                <li>• Database operations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold">Optimistic Updates</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Instant UI feedback</li>
                <li>• Automatic rollback on error</li>
                <li>• Better user experience</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <h4 className="font-semibold">Error Handling</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Field-level validation</li>
                <li>• User-friendly messages</li>
                <li>• Automatic retry options</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-purple-500" />
                <h4 className="font-semibold">File Handling</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Drag & drop uploads</li>
                <li>• Progress tracking</li>
                <li>• File validation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center gap-2 p-2 border rounded animate-in slide-in-from-top-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{notification.message}</span>
                  <Badge variant="outline" className="ml-auto">
                    {notification.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact">
          <ServerActionForm
            action={submitContactForm}
            title="Contact Support"
            description="Send a message to our support team using server actions"
            submitButtonText="Send Message"
            successMessage="Message sent successfully!"
            resetOnSuccess={true}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium mb-2"
                >
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select category</option>
                  <option value="general">General Inquiry</option>
                  <option value="billing">Billing Question</option>
                  <option value="technical">Technical Support</option>
                  <option value="complaint">Complaint</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium mb-2"
                >
                  Priority *
                </label>
                <select
                  id="priority"
                  name="priority"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium mb-2"
              >
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Brief description of your inquiry"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium mb-2"
              >
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Please provide details about your inquiry..."
              />
            </div>
          </ServerActionForm>
        </TabsContent>

        <TabsContent value="profile">
          <ServerActionForm
            action={(formData) => updateUserProfile("user123", formData)}
            title="Update Profile"
            description="Update your profile information with server-side validation"
            submitButtonText="Update Profile"
            successMessage="Profile updated successfully!"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-sm font-medium mb-2"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="profile-name"
                  name="name"
                  required
                  defaultValue="John Doe"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-sm font-medium mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="profile-email"
                  name="email"
                  required
                  defaultValue="john@example.com"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-phone"
                className="block text-sm font-medium mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="profile-phone"
                name="phone"
                defaultValue="(555) 123-4567"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="profile-image"
                className="block text-sm font-medium mb-2"
              >
                Profile Image URL
              </label>
              <input
                type="url"
                id="profile-image"
                name="image"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </ServerActionForm>
        </TabsContent>

        <TabsContent value="location">
          <ServerActionLocationForm
            initialData={{
              facilityName: "Demo Storage Center",
              facilityAbbreviation: "DEMO",
              streetAddress: "123 Demo Street",
              city: "Austin",
              state: "TX",
              zipCode: "78701",
              email: "demo@storage.com",
              phoneNumber: "(555) 123-4567",
              isActive: true,
              storageCommissionRate: 5.0,
              insuranceCommissionRate: 10.0,
            }}
            onSuccess={(data) => {
              addNotification("Location created successfully!", "success");
            }}
          />
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>File Upload with Server Actions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload files with drag & drop, progress tracking, and
                server-side validation
              </p>
            </CardHeader>
            <CardContent>
              <FileUpload
                uploadAction={uploadFile}
                onSuccess={(data) => {
                  addNotification(`File uploaded: ${data.filename}`, "success");
                }}
                onError={(error) => {
                  addNotification(`Upload failed: ${error}`, "error");
                }}
                accept="image/*"
                maxSize={5 * 1024 * 1024}
                multiple={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <p className="text-sm text-muted-foreground">
                Export data using server actions with progress tracking
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {exportProgress && (
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 animate-bounce" />
                    <span className="text-sm font-medium">
                      {exportProgress}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <Button
                  onClick={() => handleExport("locations", "csv")}
                  disabled={exportAction.isLoading}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <Download className="h-6 w-6" />
                  <span>Export Locations (CSV)</span>
                </Button>

                <Button
                  onClick={() => handleExport("users", "pdf")}
                  disabled={exportAction.isLoading}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <Download className="h-6 w-6" />
                  <span>Export Users (PDF)</span>
                </Button>

                <Button
                  onClick={() => handleExport("reports", "excel")}
                  disabled={exportAction.isLoading}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <Download className="h-6 w-6" />
                  <span>Export Reports (Excel)</span>
                </Button>
              </div>

              {exportAction.error && (
                <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {exportAction.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Server Action Status */}
      <Card>
        <CardHeader>
          <CardTitle>Server Action Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {exportAction.isLoading ? "Processing" : "Ready"}
              </div>
              <div className="text-sm text-muted-foreground">Export Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {notifications.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Notifications
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                Server Actions
              </div>
              <div className="text-sm text-muted-foreground">
                Form Processing
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
