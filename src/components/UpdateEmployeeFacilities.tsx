"use client";
import React from "react";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { getUsers } from "@/lib/controllers/userController";
import { Role } from "@/db/schema/user";

function UpdateUsersFacilitiesForm({}): JSX.Element {
  return (
    <Card x-chunk="dashboard-01-chunk-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 ">
        <CardTitle className="text-lg font-medium">
          Update Users Facilities
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export default UpdateUsersFacilitiesForm;
