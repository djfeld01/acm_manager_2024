import {
  createFormAction,
  updateUserProfile,
  createLocation,
  submitContactForm,
  uploadFile,
  FormActionResult,
} from "@/lib/actions/formActions";
import {
  userProfileSchema,
  locationSchema,
  contactFormSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

// Mock Next.js functions
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("Form Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createFormAction", () => {
    const testSchema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email"),
    });

    it("should validate and process valid data", async () => {
      const mockHandler = jest.fn().mockResolvedValue({ id: "123" });
      const action = createFormAction(testSchema, mockHandler);

      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("email", "john@example.com");

      const result = await action(formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: "123" });
      expect(mockHandler).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
      });
    });

    it("should return validation errors for invalid data", async () => {
      const mockHandler = jest.fn();
      const action = createFormAction(testSchema, mockHandler);

      const formData = new FormData();
      formData.append("name", "");
      formData.append("email", "invalid-email");

      const result = await action(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation failed");
      expect(result.fieldErrors).toEqual({
        name: ["Name is required"],
        email: ["Invalid email"],
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should handle handler errors", async () => {
      const mockHandler = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));
      const action = createFormAction(testSchema, mockHandler);

      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("email", "john@example.com");

      const result = await action(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile with valid data", async () => {
      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("email", "john@example.com");
      formData.append("phone", "(555) 123-4567");

      const result = await updateUserProfile("user123", formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        name: "John Doe",
        email: "john@example.com",
        phone: "(555) 123-4567",
      });
    });

    it("should return validation errors for invalid profile data", async () => {
      const formData = new FormData();
      formData.append("name", "");
      formData.append("email", "invalid-email");

      const result = await updateUserProfile("user123", formData);

      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
    });
  });

  describe("createLocation", () => {
    it("should create location with valid data", async () => {
      const formData = new FormData();
      formData.append("facilityName", "Test Storage");
      formData.append("facilityAbbreviation", "TS");
      formData.append("streetAddress", "123 Test St");
      formData.append("city", "Austin");
      formData.append("state", "TX");
      formData.append("zipCode", "78701");
      formData.append("email", "test@storage.com");
      formData.append("phoneNumber", "(555) 123-4567");
      formData.append("isActive", "true");
      formData.append("storageCommissionRate", "5.0");
      formData.append("insuranceCommissionRate", "10.0");

      const result = await createLocation(formData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        facilityName: "Test Storage",
        facilityAbbreviation: "TS",
        city: "Austin",
        state: "TX",
      });
      expect(result.data.id).toBeDefined();
      expect(result.data.createdAt).toBeDefined();
    });

    it("should return validation errors for invalid location data", async () => {
      const formData = new FormData();
      formData.append("facilityName", "");
      formData.append("email", "invalid-email");

      const result = await createLocation(formData);

      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
    });
  });

  describe("submitContactForm", () => {
    it("should submit contact form with valid data", async () => {
      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("email", "john@example.com");
      formData.append("subject", "Test Subject");
      formData.append(
        "message",
        "This is a test message with enough characters"
      );
      formData.append("priority", "medium");
      formData.append("category", "general");

      const result = await submitContactForm(formData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        message:
          "Your message has been sent successfully. We'll get back to you soon!",
      });
      expect(result.data.ticketId).toBeDefined();
    });

    it("should return validation errors for invalid contact form data", async () => {
      const formData = new FormData();
      formData.append("name", "");
      formData.append("message", "short");

      const result = await submitContactForm(formData);

      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
    });
  });

  describe("uploadFile", () => {
    it("should upload valid file", async () => {
      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadFile(formData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        filename: expect.stringContaining("test.jpg"),
        url: expect.stringContaining("/uploads/"),
      });
    });

    it("should reject file with invalid type", async () => {
      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadFile(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid file type");
    });

    it("should reject file that is too large", async () => {
      // Create a large file (6MB)
      const largeContent = new Array(6 * 1024 * 1024).fill("a").join("");
      const file = new File([largeContent], "large.jpg", {
        type: "image/jpeg",
      });

      // Mock file size
      Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 });

      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadFile(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("File too large");
    });

    it("should return error when no file provided", async () => {
      const formData = new FormData();

      const result = await uploadFile(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No file provided");
    });
  });

  describe("Error Handling", () => {
    it("should handle unexpected errors gracefully", async () => {
      const mockHandler = jest.fn().mockImplementation(() => {
        throw "String error"; // Non-Error object
      });

      const action = createFormAction(
        z.object({ test: z.string() }),
        mockHandler
      );

      const formData = new FormData();
      formData.append("test", "value");

      const result = await action(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("An unexpected error occurred");
    });
  });

  describe("FormData Conversion", () => {
    it("should handle boolean values correctly", async () => {
      const mockHandler = jest.fn().mockResolvedValue({});
      const schema = z.object({
        isActive: z.string().transform((val) => val === "true"),
      });

      const action = createFormAction(schema, mockHandler);

      const formData = new FormData();
      formData.append("isActive", "true");

      await action(formData);

      expect(mockHandler).toHaveBeenCalledWith({
        isActive: true,
      });
    });

    it("should handle numeric values correctly", async () => {
      const mockHandler = jest.fn().mockResolvedValue({});
      const schema = z.object({
        age: z.string().transform((val) => parseInt(val, 10)),
      });

      const action = createFormAction(schema, mockHandler);

      const formData = new FormData();
      formData.append("age", "25");

      await action(formData);

      expect(mockHandler).toHaveBeenCalledWith({
        age: 25,
      });
    });
  });
});
