import React from "react";
type EmployeeCardProps = {
  employeeId: string;
  employeeName: string;
};
function EmployeeCard({ employeeId, employeeName }: EmployeeCardProps) {
  return <div>{employeeName}</div>;
}

export default EmployeeCard;
