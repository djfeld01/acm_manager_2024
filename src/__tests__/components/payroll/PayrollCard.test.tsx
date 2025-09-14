import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { PayrollCard, PayrollData } from "@/components/payroll/PayrollCard";

// Mock the UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

const mockPayrollData: PayrollData = {
  employeeId: "emp-001",
  employeeName: "John Smith",
  payPeriodId: "2024-01-01",
  payPeriodStart: "2024-01-01",
  payPeriodEnd: "2024-01-15",
  locationName: "Downtown Storage",
  locationAbbreviation: "DT",
  basePay: 2400,
  vacationHours: 8,
  holidayHours: 4,
  monthlyBonus: 500,
  christmasBonus: 0,
  commission: 750,
  commissionCount: 15,
  mileageDollars: 125,
  hasUnpaidCommission: false,
  unpaidCommissionCount: 0,
  totalPay: 3775,
};

describe("PayrollCard", () => {
  it("renders employee name and total pay", () => {
    render(<PayrollCard payrollData={mockPayrollData} />);

    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("$3,775.00")).toBeInTheDocument();
  });

  it("displays location information when showLocationInfo is true", () => {
    render(
      <PayrollCard payrollData={mockPayrollData} showLocationInfo={true} />
    );

    expect(screen.getByText("Downtown Storage")).toBeInTheDocument();
    expect(screen.getByText("DT")).toBeInTheDocument();
  });

  it("hides location information when showLocationInfo is false", () => {
    render(
      <PayrollCard payrollData={mockPayrollData} showLocationInfo={false} />
    );

    expect(screen.queryByText("Downtown Storage")).not.toBeInTheDocument();
  });

  it("shows vacation and holiday hours", () => {
    render(<PayrollCard payrollData={mockPayrollData} />);

    expect(screen.getByText("8")).toBeInTheDocument(); // vacation hours
    expect(screen.getByText("4")).toBeInTheDocument(); // holiday hours
  });

  it("displays bonus amounts correctly", () => {
    render(<PayrollCard payrollData={mockPayrollData} />);

    expect(screen.getByText("$500.00")).toBeInTheDocument(); // monthly bonus
  });

  it("shows commission with rental count", () => {
    render(<PayrollCard payrollData={mockPayrollData} />);

    expect(screen.getByText(/Commission \(15 rentals\):/)).toBeInTheDocument();
    expect(screen.getByText("$750.00")).toBeInTheDocument();
  });

  it("displays unpaid commission badge when applicable", () => {
    const dataWithUnpaid = {
      ...mockPayrollData,
      hasUnpaidCommission: true,
      unpaidCommissionCount: 3,
    };

    render(<PayrollCard payrollData={dataWithUnpaid} />);

    expect(screen.getByText("3 unpaid")).toBeInTheDocument();
  });

  it("shows mileage when amount is greater than 0", () => {
    render(<PayrollCard payrollData={mockPayrollData} />);

    expect(screen.getByText("$125.00")).toBeInTheDocument(); // mileage
  });

  it("hides mileage when amount is 0", () => {
    const dataWithoutMileage = {
      ...mockPayrollData,
      mileageDollars: 0,
    };

    render(<PayrollCard payrollData={dataWithoutMileage} />);

    // Should not show mileage section
    expect(screen.queryByText("Mileage:")).not.toBeInTheDocument();
  });

  it("calls onViewDetails when View Full Details button is clicked", () => {
    const mockOnViewDetails = jest.fn();

    render(
      <PayrollCard
        payrollData={mockPayrollData}
        onViewDetails={mockOnViewDetails}
      />
    );

    const detailsButton = screen.getByText("View Full Details");
    fireEvent.click(detailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
  });

  it("calls onViewBreakdown when Details button is clicked", () => {
    const mockOnViewBreakdown = jest.fn();
    const dataWithBreakdown = {
      ...mockPayrollData,
      monthlyBonusBreakdown: [
        {
          bonusType: "Performance",
          amount: 300,
          month: "January",
          date: "2024-01-15",
        },
      ],
    };

    render(
      <PayrollCard
        payrollData={dataWithBreakdown}
        onViewBreakdown={mockOnViewBreakdown}
      />
    );

    const detailsButtons = screen.getAllByText("Details");
    fireEvent.click(detailsButtons[0]);

    expect(mockOnViewBreakdown).toHaveBeenCalledWith("bonus");
  });

  it("formats currency amounts correctly", () => {
    const dataWithLargeAmounts = {
      ...mockPayrollData,
      totalPay: 12345.67,
      monthlyBonus: 1234.56,
    };

    render(<PayrollCard payrollData={dataWithLargeAmounts} />);

    expect(screen.getByText("$12,345.67")).toBeInTheDocument();
    expect(screen.getByText("$1,234.56")).toBeInTheDocument();
  });

  it("formats dates correctly", () => {
    render(<PayrollCard payrollData={mockPayrollData} />);

    expect(screen.getByText("Jan 1, 2024 - Jan 15, 2024")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <PayrollCard payrollData={mockPayrollData} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
