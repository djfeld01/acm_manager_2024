"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface SignInButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function SignInButton({ className, children }: SignInButtonProps) {
  return (
    <Button
      onClick={() => signIn("google")}
      className={className}
      variant="default"
    >
      {children || "Sign In"}
    </Button>
  );
}

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function SignOutButton({ className, children }: SignOutButtonProps) {
  return (
    <Button onClick={() => signOut()} className={className} variant="outline">
      {children || "Sign Out"}
    </Button>
  );
}

export function AuthStatus() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <SignInButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Welcome, {user?.name || user?.email}</span>
      <SignOutButton />
    </div>
  );
}
