"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download,
  Gift,
  TrendingUp,
  Calendar,
  MapPin,
  User,
  DollarSign,
} from "lucide-react";
import { PayrollData } from "./PayrollCard";

interface BonusBreakdown {
  bonusType: string;
  amount: number;
  month: string;
  date: string;
  description?: string;
}

interface CommissionBreakdown {
  date: string;
  unitName: string;
  tenantName: string;
  hasInsurance: boolean;
  amount: number;
  rentalType?: string;
}

interface PayrollBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollData: PayrollData;
  onExport?: (format: "csv" | "pdf") => void;
}

export function PayrollBreakdownModal({
  open,
  onOpenChange,
  payrollData,
  onExport,
}: PayrollBreakdownModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const bonusBreakdown = payrollData.monthlyBonusBreakdown || [];
  const commissionBreakdown = payrollData.commissionBreakdown || [];

  const totalBonuses = payrollData.monthlyBonus + payrollData.christmasBonus;
  const hasBreakdownData =
    bonusBreakdown.length > 0 || commissionBreakdown.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Payroll Breakdown - {payrollData.employeeName}
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown for pay period{" "}
            {formatDate(payrollData.payPeriodStart)} -{" "}
            {formatDate(payrollData.payPeriodEnd)}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bonuses" disabled={bonusBreakdown.length === 0}>
              Bonuses ({bonusBreakdown.length})
            </TabsTrigger>
            <TabsTrigger
              value="commission"
              disabled={commissionBreakdown.length === 0}
            >
              Commission ({commissionBreakdown.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pay Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Pay:
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(payrollData.totalPay)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Vacation Hours:
                      </span>
                      <span>{payrollData.vacationHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Holiday Hours:
                      </span>
                      <span>{payrollData.holidayHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Monthly Bonus:
                      </span>
                      <span>{formatCurrency(payrollData.monthlyBonus)}</span>
                    </div>
                    {payrollData.christmasBonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Christmas Bonus:
                        </span>
                        <span>
                          {formatCurrency(payrollData.christmasBonus)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commission:</span>
                      <span>{formatCurrency(payrollData.commission)}</span>
                    </div>
                    {payrollData.mileageDollars > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mileage:</span>
                        <span>
                          {formatCurrency(payrollData.mileageDollars)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Location & Period Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location & Period
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Location:
                    </span>
                    <span className="font-medium">
                      {payrollData.locationName}
                    </span>
                    <Badge variant="outline">
                      {payrollData.locationAbbreviation}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(payrollData.payPeriodStart)} -{" "}
                      {formatDate(payrollData.payPeriodEnd)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Pay Period ID:
                    </span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {payrollData.payPeriodId}
                    </code>
                  </div>

                  {payrollData.hasUnpaidCommission && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        {payrollData.unpaidCommissionCount} Unpaid Commission
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">
                    {payrollData.commissionCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Rentals</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalBonuses)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Bonuses
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">
                    {formatCurrency(payrollData.commission)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Commission
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">
                    {payrollData.vacationHours + payrollData.holidayHours}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Hours
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bonuses Tab */}
          <TabsContent value="bonuses" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Bonus Breakdown
                </h3>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(totalBonuses)} across{" "}
                  {bonusBreakdown.length} bonuses
                </p>
              </div>
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport("csv")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>

            {bonusBreakdown.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bonusBreakdown.map((bonus, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(bonus.date)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{bonus.bonusType}</Badge>
                          </TableCell>
                          <TableCell>{bonus.month}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(bonus.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="font-medium">
                          Total Bonuses
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            bonusBreakdown.reduce(
                              (sum, bonus) => sum + bonus.amount,
                              0
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">
                    No bonus breakdown available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bonus details are not available for this pay period
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Commission Tab */}
          <TabsContent value="commission" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Commission Breakdown
                </h3>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(payrollData.commission)} from{" "}
                  {payrollData.commissionCount} rentals
                </p>
              </div>
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport("csv")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>

            {commissionBreakdown.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead className="text-center">Insurance</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionBreakdown.map((commission, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(commission.date)}</TableCell>
                          <TableCell className="font-medium">
                            {commission.unitName}
                          </TableCell>
                          <TableCell>{commission.tenantName}</TableCell>
                          <TableCell className="text-center">
                            {commission.hasInsurance ? (
                              <Badge variant="default" className="text-xs">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(commission.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={4} className="font-medium">
                          Total Commission
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            commissionBreakdown.reduce(
                              (sum, comm) => sum + comm.amount,
                              0
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">
                    No commission breakdown available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Commission details are not available for this pay period
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Employee ID: {payrollData.employeeId} • Period:{" "}
            {payrollData.payPeriodId}
          </div>

          <div className="flex gap-2">
            {onExport && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport("csv")}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport("pdf")}
                >
                  Export PDF
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
