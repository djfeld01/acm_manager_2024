# Design Document

## Overview

The frontend rebuild will create a clean, mobile-first interface for ACM Manager 2024 while preserving the existing backend infrastructure. The design focuses on role-based navigation, dashboard-centric user experience, and proper component architecture. The system will replace the current scattered route structure with a coherent, maintainable codebase that scales with business needs.

**Key Design Principles:**

- Mobile-first responsive design with adaptive navigation
- Role-based access control with clear permission boundaries
- Server-side data handling for security and performance
- Component-driven architecture with clear separation of concerns
- Consistent design system using Shadcn/ui and Tailwind CSS

## Architecture

### Application Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-protected routes
│   │   ├── dashboard/            # Role-based dashboards
│   │   ├── payroll/              # Payroll management
│   │   ├── locations/            # Location management
│   │   ├── reports/              # Reporting features
│   │   └── admin/                # Admin-only features
│   ├── api/                      # API routes (existing)
│   ├── auth/                     # Authentication pages
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # Shadcn/ui components
│   ├── layout/                   # Layout components
│   │   ├── AppShell.tsx          # Main app container
│   │   ├── Navigation/           # Navigation components
│   │   └── MobileNavigation.tsx  # Mobile-specific nav
│   ├── dashboard/                # Dashboard components
│   ├── payroll/                  # Payroll components
│   ├── locations/                # Location components
│   └── shared/                   # Shared business components
├── lib/
│   ├── auth/                     # Auth utilities
│   ├── permissions/              # Role-based access
│   └── utils/                    # Utility functions
└── hooks/                        # Custom React hooks
```

### Route Organization

**Protected Routes Structure:**

```
/(auth)/
├── dashboard/                    # Role-specific dashboards
├── payroll/
│   ├── page.tsx                  # Payroll overview
│   ├── [locationId]/             # Location-specific payroll
│   └── employee/[id]/            # Individual employee view
├── locations/
│   ├── page.tsx                  # Locations overview
│   └── [locationId]/             # Individual location
├── reports/                      # Reporting section
└── admin/                        # Admin-only features
```

### Navigation Architecture

**Desktop Navigation (Sidebar):**

- Collapsible sidebar with role-based menu items
- Persistent across page navigation
- Clear visual hierarchy with icons and labels
- Quick access to user profile and settings

**Mobile Navigation (Bottom Tabs + Hamburger):**

- Bottom tab bar for primary sections (4-5 items max)
- Hamburger menu for secondary features
- Swipe gestures for tab switching
- Optimized touch targets (44px minimum)

## Components and Interfaces

### Core Layout Components

#### AppShell Component

```typescript
interface AppShellProps {
  children: React.ReactNode;
  user: User;
  navigation: NavigationItem[];
}

// Handles responsive layout switching
// Manages navigation state
// Provides consistent header/footer
```

#### Navigation System

```typescript
interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  children?: NavigationItem[];
}

interface NavigationProps {
  items: NavigationItem[];
  currentPath: string;
  userRole: Role;
  isMobile: boolean;
}
```

### Dashboard Components

#### Role-Based Dashboard Cards

```typescript
interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
    period: string;
  };
  alert?: {
    level: "info" | "warning" | "error";
    message: string;
  };
  action?: {
    label: string;
    href: string;
  };
}
```

#### Quick Actions Component

```typescript
interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

interface QuickActionsProps {
  actions: QuickAction[];
  userRole: Role;
}
```

### Data Visualization Components

#### Chart Wrapper

```typescript
interface ChartWrapperProps {
  title: string;
  data: any[];
  type: "line" | "bar" | "area" | "pie";
  loading?: boolean;
  error?: string;
  height?: number;
  responsive?: boolean;
}
```

### Form Components

#### Enhanced Form Components

```typescript
interface FormFieldProps {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "select" | "date";
  required?: boolean;
  validation?: ZodSchema;
  options?: { value: string; label: string }[];
}
```

## Data Models

### User Interface Models

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  image?: string;
  userDetailId?: string;
  facilities: Facility[];
}

interface NavigationState {
  currentPath: string;
  isCollapsed: boolean;
  isMobile: boolean;
  activeSection: string;
}

interface DashboardData {
  metrics: DashboardMetric[];
  alerts: Alert[];
  quickActions: QuickAction[];
  recentActivity: Activity[];
}
```

### Permission Models

```typescript
interface Permission {
  resource: string;
  action: "read" | "write" | "delete" | "admin";
  scope: "own" | "facility" | "all";
}

interface RolePermissions {
  [Role.MANAGER]: Permission[];
  [Role.ASSISTANT]: Permission[];
  [Role.SUPERVISOR]: Permission[];
  [Role.ADMIN]: Permission[];
  [Role.OWNER]: Permission[];
}
```

## Error Handling

### Error Boundary Strategy

```typescript
interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Global error boundary for unhandled errors
// Route-specific error boundaries for graceful degradation
// Network error handling with retry mechanisms
```

### Loading States

```typescript
interface LoadingState {
  isLoading: boolean;
  error?: string;
  retry?: () => void;
}

// Skeleton loaders for consistent loading experience
// Progressive loading for large datasets
// Optimistic updates where appropriate
```

### Form Validation

```typescript
// Zod schemas for client-side validation
// Server-side validation integration
// Real-time validation feedback
// Accessible error messaging
```

## Testing Strategy

### Component Testing

- Unit tests for all business logic components
- Integration tests for complex user flows
- Visual regression testing for UI consistency
- Accessibility testing with automated tools

### User Experience Testing

- Mobile device testing across different screen sizes
- Performance testing on slower networks
- Role-based access testing
- Cross-browser compatibility testing

### Test Structure

```
__tests__/
├── components/
│   ├── dashboard/
│   ├── navigation/
│   └── shared/
├── pages/
├── utils/
└── integration/
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

- Set up new app structure and routing
- Implement authentication integration
- Create base layout components
- Establish design system components

### Phase 2: Navigation & Layout (Week 2-3)

- Build responsive navigation system
- Implement role-based routing
- Create dashboard layouts
- Add loading states and error boundaries

### Phase 3: Core Features (Week 3-5)

- Implement dashboard components
- Build payroll interface
- Create location management views
- Add data visualization components

### Phase 4: Polish & Testing (Week 5-6)

- Performance optimization
- Accessibility improvements
- Cross-browser testing
- Mobile experience refinement

## Migration Strategy

### Gradual Migration Approach

1. **Parallel Development**: Build new frontend alongside existing
2. **Feature Flags**: Toggle between old and new implementations
3. **User Testing**: Beta testing with select users
4. **Gradual Rollout**: Phase rollout by user role
5. **Cleanup**: Remove old code after successful migration

### Data Preservation

- All existing backend APIs remain unchanged
- Database schemas preserved
- User sessions maintained during transition
- Existing bookmarks redirected appropriately

### Rollback Plan

- Feature flags allow instant rollback
- Database migrations are backward compatible
- CDN caching strategies for quick deployment
- Monitoring and alerting for issues detection
