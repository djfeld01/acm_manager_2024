"use client";

import React from "react";
import { MonitoringDashboard } from "@/components/admin/MonitoringDashboard";

// Mock user data for demo
const mockUser = {
  id: "admin-123",
  role: "admin", // Change this to test different access levels
  name: "Admin User",
};

export default function MonitoringDemoPage() {
  return (
    <div className="container mx-auto p-6">
      <MonitoringDashboard userRole={mockUser.role} />
    </div>
  );
}
