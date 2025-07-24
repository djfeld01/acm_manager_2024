"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SignInButton } from "@/components/auth/AuthButtons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Unauthorized() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Required</CardTitle>
            <CardDescription>
              Please sign in to access the ACM Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SignInButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You have not yet been added to the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Your account ({user?.email}) needs to be configured by an
            administrator before you can access the dashboard.
          </p>
          <p className="text-sm text-center">
            Please reach out to an administrator to gain access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Unauthorized;
