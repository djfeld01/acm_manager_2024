"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

const mockData = [
  { name: "Jan", revenue: 4000, expenses: 2400 },
  { name: "Feb", revenue: 3000, expenses: 1398 },
  { name: "Mar", revenue: 2000, expenses: 9800 },
  { name: "Apr", revenue: 2780, expenses: 3908 },
  { name: "May", revenue: 1890, expenses: 4800 },
  { name: "Jun", revenue: 2390, expenses: 3800 },
];

export default function DesignSystemShowcase() {
  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">ACM Design System Showcase</h1>
          <p className="page-description">
            A comprehensive showcase of the ACM Manager design system
            components, patterns, and guidelines.
          </p>
        </div>

        <div className="space-y-8">
          {/* Color Palette */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Color Palette</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <div className="h-16 w-full bg-primary rounded-lg"></div>
                <p className="text-sm font-medium">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full bg-secondary rounded-lg"></div>
                <p className="text-sm font-medium">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full bg-success rounded-lg"></div>
                <p className="text-sm font-medium">Success</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full bg-warning rounded-lg"></div>
                <p className="text-sm font-medium">Warning</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full bg-destructive rounded-lg"></div>
                <p className="text-sm font-medium">Destructive</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full bg-info rounded-lg"></div>
                <p className="text-sm font-medium">Info</p>
              </div>
            </div>
          </section>

          {/* Typography */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Typography</h2>
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold">Heading 1 - Page Title</h1>
                <p className="text-sm text-muted-foreground">
                  text-3xl font-bold
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-semibold">
                  Heading 2 - Section Title
                </h2>
                <p className="text-sm text-muted-foreground">
                  text-2xl font-semibold
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium">Heading 3 - Subsection</h3>
                <p className="text-sm text-muted-foreground">
                  text-xl font-medium
                </p>
              </div>
              <div>
                <p className="text-base">
                  Body text - This is the standard body text used throughout the
                  application.
                </p>
                <p className="text-sm text-muted-foreground">text-base</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Small text - Used for captions, labels, and secondary
                  information.
                </p>
                <p className="text-xs text-muted-foreground">
                  text-sm text-muted-foreground
                </p>
              </div>
            </div>
          </section>

          {/* Buttons */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="touch-target">
                Primary Button
              </Button>
              <Button variant="secondary" size="lg" className="touch-target">
                Secondary
              </Button>
              <Button variant="outline" size="lg" className="touch-target">
                Outline
              </Button>
              <Button variant="ghost" size="lg" className="touch-target">
                Ghost
              </Button>
              <Button variant="destructive" size="lg" className="touch-target">
                Destructive
              </Button>
              <Button disabled size="lg" className="touch-target">
                Disabled
              </Button>
            </div>
          </section>

          {/* Status Badges */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Status Indicators</h2>
            <div className="flex flex-wrap gap-4">
              <Badge className="status-success">
                <CheckCircle className="w-3 h-3 mr-1" />
                Success
              </Badge>
              <Badge className="status-warning">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Warning
              </Badge>
              <Badge className="status-error">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Error
              </Badge>
              <Badge className="status-info">
                <Info className="w-3 h-3 mr-1" />
                Info
              </Badge>
            </div>
          </section>

          {/* Dashboard Cards */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Dashboard Components</h2>

            {/* Metric Cards */}
            <div className="dashboard-grid mb-6">
              <Card className="metric-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-revenue" />
                    <span className="text-2xl font-bold">$45,231</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="metric-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Occupancy Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-occupancy" />
                    <span className="text-2xl font-bold">92.4%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +2.3% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="metric-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <LayoutDashboard className="h-5 w-5 text-performance" />
                    <span className="text-2xl font-bold">17</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All locations online
                  </p>
                </CardContent>
              </Card>

              <Card className="metric-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Employees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">43</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +3 new this month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart Example */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>
                  Monthly comparison of revenue and expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="hsl(var(--revenue))" />
                      <Bar dataKey="expenses" fill="hsl(var(--expense))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Form Components */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Form Components</h2>
            <Card>
              <CardHeader>
                <CardTitle>Form Example</CardTitle>
                <CardDescription>
                  Standard form layout with mobile-friendly spacing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="form-grid">
                  <div className="form-field">
                    <Label htmlFor="firstname">First Name</Label>
                    <Input
                      id="firstname"
                      placeholder="Enter first name"
                      className="touch-target"
                    />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="lastname">Last Name</Label>
                    <Input
                      id="lastname"
                      placeholder="Enter last name"
                      className="touch-target"
                    />
                  </div>
                  <div className="form-field md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      className="touch-target"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <Button className="touch-target">Save Changes</Button>
                  <Button variant="outline" className="touch-target">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Mobile Patterns */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Mobile Patterns</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Touch Targets</CardTitle>
                  <CardDescription>
                    All interactive elements meet the 44px minimum
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="touch-target w-full">
                    Full Width Button
                  </Button>
                  <div className="flex gap-2">
                    <Button className="touch-target flex-1">Left</Button>
                    <Button className="touch-target flex-1" variant="outline">
                      Right
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Responsive Grid</CardTitle>
                  <CardDescription>
                    Stacks on mobile, grid on larger screens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-16 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium">Item 1</span>
                    </div>
                    <div className="h-16 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium">Item 2</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
