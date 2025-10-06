import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
  SwitchField,
  DateField,
} from "@/components/forms/FormField";

const testSchema = z.object({
  textField: z.string().min(1, "Text field is required"),
  emailField: z.string().email("Invalid email"),
  passwordField: z.string().min(8, "Password must be at least 8 characters"),
  textareaField: z.string().min(10, "Message must be at least 10 characters"),
  selectField: z.string().min(1, "Please select an option"),
  checkboxField: z.boolean(),
  switchField: z.boolean(),
  dateField: z.date().optional(),
});

type TestFormData = z.infer<typeof testSchema>;

function TestFormWrapper({ children }: { children: React.ReactNode }) {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      textField: "",
      emailField: "",
      passwordField: "",
      textareaField: "",
      selectField: "",
      checkboxField: false,
      switchField: false,
      dateField: undefined,
    },
  });

  return <form>{children}</form>;
}

describe("Form Field Components", () => {
  describe("TextField", () => {
    it("renders text field correctly", () => {
      const form = useForm<TestFormData>();

      render(
        <TextField
          control={form.control}
          name="textField"
          label="Test Field"
          placeholder="Enter text"
        />
      );

      expect(screen.getByLabelText("Test Field")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("shows required indicator when required", () => {
      const form = useForm<TestFormData>();

      render(
        <TextField
          control={form.control}
          name="textField"
          label="Required Field"
          required
        />
      );

      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("shows password toggle for password fields", async () => {
      const user = userEvent.setup();
      const form = useForm<TestFormData>();

      render(
        <TextField
          control={form.control}
          name="passwordField"
          type="password"
          label="Password"
          showPasswordToggle
        />
      );

      const input = screen.getByLabelText("Password");
      const toggleButton = screen.getByRole("button");

      expect(input).toHaveAttribute("type", "password");

      await user.click(toggleButton);
      expect(input).toHaveAttribute("type", "text");

      await user.click(toggleButton);
      expect(input).toHaveAttribute("type", "password");
    });

    it("handles number input with min/max/step", () => {
      const form = useForm<TestFormData>();

      render(
        <TextField
          control={form.control}
          name="textField"
          type="number"
          label="Number Field"
          min={0}
          max={100}
          step={0.1}
        />
      );

      const input = screen.getByLabelText("Number Field");
      expect(input).toHaveAttribute("type", "number");
      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "100");
      expect(input).toHaveAttribute("step", "0.1");
    });
  });

  describe("TextareaField", () => {
    it("renders textarea with character count", () => {
      const form = useForm<TestFormData>();

      render(
        <TextareaField
          control={form.control}
          name="textareaField"
          label="Message"
          maxLength={100}
          showCharCount
        />
      );

      expect(screen.getByLabelText("Message")).toBeInTheDocument();
      expect(screen.getByText("0 / 100")).toBeInTheDocument();
    });

    it("updates character count as user types", async () => {
      const user = userEvent.setup();
      const form = useForm<TestFormData>();

      render(
        <TextareaField
          control={form.control}
          name="textareaField"
          label="Message"
          maxLength={100}
          showCharCount
        />
      );

      const textarea = screen.getByLabelText("Message");
      await user.type(textarea, "Hello");

      expect(screen.getByText("5 / 100")).toBeInTheDocument();
    });
  });

  describe("SelectField", () => {
    const options = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
      { value: "option3", label: "Option 3", disabled: true },
    ];

    it("renders select field with options", async () => {
      const user = userEvent.setup();
      const form = useForm<TestFormData>();

      render(
        <SelectField
          control={form.control}
          name="selectField"
          label="Select Option"
          options={options}
        />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("shows empty text when no options", async () => {
      const user = userEvent.setup();
      const form = useForm<TestFormData>();

      render(
        <SelectField
          control={form.control}
          name="selectField"
          label="Select Option"
          options={[]}
          emptyText="No options available"
        />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.getByText("No options available")).toBeInTheDocument();
    });
  });

  describe("CheckboxField", () => {
    it("renders checkbox with label", () => {
      const form = useForm<TestFormData>();

      render(
        <CheckboxField
          control={form.control}
          name="checkboxField"
          checkboxLabel="Accept terms"
        />
      );

      expect(screen.getByRole("checkbox")).toBeInTheDocument();
      expect(screen.getByText("Accept terms")).toBeInTheDocument();
    });

    it("toggles checkbox state", async () => {
      const user = userEvent.setup();
      const form = useForm<TestFormData>();

      render(
        <CheckboxField
          control={form.control}
          name="checkboxField"
          checkboxLabel="Accept terms"
        />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe("SwitchField", () => {
    it("renders switch with label", () => {
      const form = useForm<TestFormData>();

      render(
        <SwitchField
          control={form.control}
          name="switchField"
          switchLabel="Enable notifications"
        />
      );

      expect(screen.getByRole("switch")).toBeInTheDocument();
      expect(screen.getByText("Enable notifications")).toBeInTheDocument();
    });

    it("toggles switch state", async () => {
      const user = userEvent.setup();
      const form = useForm<TestFormData>();

      render(
        <SwitchField
          control={form.control}
          name="switchField"
          switchLabel="Enable notifications"
        />
      );

      const switchElement = screen.getByRole("switch");
      expect(switchElement).toHaveAttribute("data-state", "unchecked");

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute("data-state", "checked");
    });
  });

  describe("DateField", () => {
    it("renders date field with calendar trigger", () => {
      const form = useForm<TestFormData>();

      render(
        <DateField
          control={form.control}
          name="dateField"
          label="Select Date"
          placeholder="Pick a date"
        />
      );

      expect(screen.getByText("Pick a date")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("opens calendar when clicked", async () => {
      const user = userEvent.setup();
      const form = useForm<TestFormData>();

      render(
        <DateField
          control={form.control}
          name="dateField"
          label="Select Date"
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Calendar should be visible
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });
  });

  describe("Form Integration", () => {
    it("displays validation errors", async () => {
      const form = useForm<TestFormData>({
        resolver: zodResolver(testSchema),
      });

      render(
        <TestFormWrapper>
          <TextField
            control={form.control}
            name="textField"
            label="Required Field"
            required
          />
        </TestFormWrapper>
      );

      // Trigger validation
      await form.trigger("textField");

      await waitFor(() => {
        expect(screen.getByText("Text field is required")).toBeInTheDocument();
      });
    });

    it("clears validation errors when field becomes valid", async () => {
      const user = userEvent.setup();
      const form = useForm<TestFormData>({
        resolver: zodResolver(testSchema),
      });

      render(
        <TestFormWrapper>
          <TextField
            control={form.control}
            name="textField"
            label="Required Field"
            required
          />
        </TestFormWrapper>
      );

      // Trigger validation to show error
      await form.trigger("textField");

      await waitFor(() => {
        expect(screen.getByText("Text field is required")).toBeInTheDocument();
      });

      // Enter valid text
      const input = screen.getByLabelText("Required Field");
      await user.type(input, "Valid text");

      await waitFor(() => {
        expect(
          screen.queryByText("Text field is required")
        ).not.toBeInTheDocument();
      });
    });
  });
});
