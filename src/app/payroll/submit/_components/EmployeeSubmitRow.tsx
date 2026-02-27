"use client";
import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeeHoursForm from "./EmployeeHoursForm";
import EmployeeVacationRequestForm from "./EmployeeVacationRequestForm";
import EmployeeMileageForm from "./EmployeeMileageForm";
import EmployeeHolidayComponent from "@/app/payroll/Component/EmployeeHolidayComponent";
import EmployeeCommissionForm from "./EmployeeCommissionForm";

type EmployeeSubmitRowProps = {
  employeeId: string;
  employeeName: string;
  position: string;
  sitelinkId: string;
  payPeriodId: string;
};

function EmployeeSubmitRow({
  employeeId,
  employeeName,
  position,
  sitelinkId,
  payPeriodId,
}: EmployeeSubmitRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{employeeName}</span>
            <Badge variant="outline" className="text-xs">
              {position}
            </Badge>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t">
            <Tabs defaultValue="hours" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="hours" className="flex-1">Hours</TabsTrigger>
                <TabsTrigger value="commission" className="flex-1">Commission</TabsTrigger>
                <TabsTrigger value="vacation" className="flex-1">Vacation</TabsTrigger>
                <TabsTrigger value="mileage" className="flex-1">Mileage</TabsTrigger>
                <TabsTrigger value="holiday" className="flex-1">Holiday</TabsTrigger>
              </TabsList>
              <TabsContent value="hours">
                <EmployeeHoursForm
                  employeeId={employeeId}
                  sitelinkId={sitelinkId}
                  payPeriodId={payPeriodId}
                />
              </TabsContent>
              <TabsContent value="commission">
                <EmployeeCommissionForm
                  employeeId={employeeId}
                  sitelinkId={sitelinkId}
                  payPeriodId={payPeriodId}
                />
              </TabsContent>
              <TabsContent value="vacation">
                <EmployeeVacationRequestForm
                  employeeId={employeeId}
                  sitelinkId={sitelinkId}
                  payPeriodId={payPeriodId}
                />
              </TabsContent>
              <TabsContent value="mileage">
                <EmployeeMileageForm
                  employeeId={employeeId}
                  sitelinkId={sitelinkId}
                  payPeriodId={payPeriodId}
                />
              </TabsContent>
              <TabsContent value="holiday">
                <EmployeeHolidayComponent
                  employeeId={employeeId}
                  sitelinkId={sitelinkId}
                  payPeriodId={payPeriodId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default EmployeeSubmitRow;
