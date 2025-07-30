# Frontend Rebuild Plan - ACM Manager 2024

## Project Overview

**Created:** July 25, 2025
**Status:** Ready for Implementation
**Branch:** `frontend-rebuild-2025`
**Approach:** Methodical, incremental rebuild with testing at each step

---

## 1. Application Discovery & Requirements

### Core Application Purpose

**Industry:** Self Storage Management Company
**Scale:** 17 Self Storage facilities + 2 Salon locations + Management company operations
**Primary Software:** Sitelink (by Storable/SMD) for day-to-day facility operations
**Vision:** Management layer above Sitelink that consolidates metrics, reports, and operations into unified platform

**Key Problems Solved:**

- Replaces hodgepodge of spreadsheets and separate reports
- Centralizes management operations (payroll, payables, store monitoring, hiring, firing, owner interactions)
- Provides better metric visualization and reporting for management team
- Creates single source of truth for multi-location oversight

### Target Users & Roles

**ADMIN/ACM Office Staff (5 people):**

- **David** - Manager of Technology & Accounting (monthly financials, cash flow, deposits verification, owner distributions, payroll, tech oversight)
- **Jacque** - Director of Operations (everything oversight, day-to-day ops, area manager supervision, facility communication, bank signatures, payables, repairs/maintenance, owner communication)
- **Ashley** - Office Manager (mail, bill entry to QuickBooks, bank reconciliation, deposit verification, payroll support, general office operations)
- **Jayden** - Director of Marketing (remote, marketing ROI optimization, manager coordination for offsite marketing, web/SEO team communication)
- **Brad** - Owner (hands-off day-to-day, owns some facilities directly, high-level oversight)

**SUPERVISOR/Area Managers (3 people):**

- **Andrea, Tabatha, Ezra** - Direct supervisors to facility managers/assistants, need location performance visibility, staff performance monitoring, payroll participation, deposit alert access
- _Note: Tabatha also manages a location; Ezra floats between locations_

**MANAGER/Facility Managers:**

- **Scope:** Typically single facility, full-time
- **Responsibilities:** Unit rentals, rent collection, past-due follow-up, auctions, facility cleanliness, maintenance coordination, "ownership mentality" for their location

**ASSISTANT/Assistant Managers:**

- **Scope:** Same responsibilities as managers but under manager supervision, part-time, sometimes multi-location
- **Access:** Similar to managers but potentially more limited

**Future Vision:** Scalable for other management companies with potentially different organizational structures

### Primary Use Cases

**Core Workflows (Iterative Discovery):**

**High Priority - Known Needs:**

1. **Bi-weekly Payroll Processing** (every 2 weeks)

   - Admin/Office staff: Process payroll for all locations
   - Managers/Assistants: View own payroll details, bonus status, commission tracking
   - Area Managers: View direct reports' payroll information

2. **Executive Dashboard** (daily/weekly monitoring)

   - Area Managers and above: Key metrics overview
   - Alert system: Flag unusual patterns (low rentals, delayed deposits, etc.)
   - Performance monitoring across locations

3. **Employee Performance Tracking**
   - Bonus calculations based on monthly rentals
   - Commission tracking from new rentals
   - Individual vs location performance metrics

**Flexible/Iterative Areas:**

- User adoption will drive additional feature priorities
- Real-world usage will reveal most valuable workflows
- Features will be added/refined based on actual user feedback

**Note:** Limited current user base means iterative approach is essential

### Current Pain Points

**What Works (Keep/Improve):**

- ✅ Payroll pages functionality is largely good
- ✅ Deposits page concept is solid
- ✅ Front page data display is helpful

**Major Issues to Fix:**

- ❌ Client-side DB calls (need server-side handling)
- ❌ Payroll only shows by store (need employee view for multi-location staff)
- ❌ Deposits page incomplete (needs rebuild)
- ❌ Front page data needs rework
- ❌ Poor mobile/tablet experience (need mobile-first priority)
- ❌ Inadequate data isolation/security by role
- ❌ Information feels like "hodgepodge" - poor organization
- ❌ Not fluid UX experience

**Critical Security/Access Requirements:**

- Managers: See OWN payroll + own store data only
- Area Managers: See direct reports' payroll + their assigned stores (metrics access TBD)
- Office Staff: Full access as needed
- Multi-location staff: Need unified view across their locations

**Overall Status:** Currently in beta mode - everything is fair game for rebuild

---

## 2. Technical Foundation

### Backend Status

✅ **SOLID** - User authentication, role-based permissions, facility-based access control, database integration

### Frontend Technology Stack

✅ **DECIDED**

- **Framework:** Next.js 15 (existing, with App Router)
- **UI Library:** Shadcn/ui (familiar, customizable, business-appropriate)
- **Styling:** Tailwind CSS (existing, excellent for rapid development)
- **State Management:** React Server Components + minimal client state (Zustand for complex client state if needed)
- **Data Visualization:** Recharts (React-native, excellent Tailwind integration)
- **Additional Tools:**
  - React Hook Form (forms with validation)
  - Zod (schema validation)
  - Date-fns (date manipulation)
  - Lucide React (icons, already in use)

---

## 3. Design & User Experience Plan

### Design System

**Current Status:** Foundation exists (Shadcn/ui + Tailwind), needs organization and enhancement

**Color Palette:**

- **Current**: Blue/purple theme with light/dark mode support
- **Business Context**: Professional, modern feel suitable for management software
- **Status**: ✅ Functional base, needs business-specific enhancement

**Typography:**

- **Current**: Inter font family with Tailwind defaults
- **Mobile Priority**: Readable sizes for tablet/mobile use
- **Status**: ✅ Good foundation, needs mobile optimization

**Component Library:**

- **Base**: Shadcn/ui components (buttons, forms, navigation, etc.)
- **Custom**: ACM-specific business components needed
- **Status**: 🔄 Needs ACM-specific component creation

**Spacing & Layout:**

- **Grid System**: Tailwind's responsive grid
- **Mobile-First**: Breakpoints optimized for tablet usage
- **Status**: 🔄 Needs mobile-first optimization

**Next Steps:**

1. Create design system documentation
2. Establish ACM brand colors and themes
3. Build component showcase/storybook
4. Define mobile-first spacing standards

### Navigation Structure

✅ **DECIDED: Hybrid Role-Based + Dashboard-Centric**

**Core Principles:**

- Role-based navigation (users only see what they can access)
- Dashboard-centric landing pages with quick actions
- Mobile-first navigation pattern

**Landing Page Strategy:**

- **Managers/Assistants**: Hybrid dashboard showing location key metrics + personal info quick access
- **Area Managers**: Multi-location overview + team management shortcuts
- **Admin/Office**: Comprehensive dashboard + admin tools access

**Navigation Pattern Recommendation:**

- **Mobile/Tablet**: Bottom navigation bar (4-5 primary sections) + hamburger for secondary features
- **Desktop**: Sidebar navigation that collapses on smaller screens
- **All Devices**: Personalized dashboard as primary landing page

**Role-Based Menu Structure:**

- **MANAGER/ASSISTANT**: Dashboard, My Payroll, My Location, [Help/Settings]
- **SUPERVISOR**: Dashboard, Team Payroll, Locations, Reports, [Settings]
- **ADMIN**: Dashboard, Payroll, Locations, Reports, Admin, [Settings]

_Note: Exact menu items will be refined during implementation based on feature development_

### Responsive Strategy

✅ **DECIDED: Mobile-First with Adaptive Navigation**

**Navigation Approach:**

- **Mobile/Tablet (Primary)**: Bottom tab navigation for main sections
- **Desktop**: Collapsible sidebar navigation
- **Breakpoint Strategy**: Mobile → Tablet → Desktop progression

**Key Responsive Principles:**

- Dashboard cards stack on mobile, grid on larger screens
- Data tables become scrollable cards on mobile
- Charts maintain readability across all devices
- Touch-friendly interface elements (44px minimum touch targets)

### Accessibility Requirements

_[To be defined]_

---

## 4. Implementation Strategy

### Phase 1: Foundation

_[Core layout, navigation, auth integration]_

### Phase 2: Core Features

_[Main functionality implementation]_

### Phase 3: Enhancement

_[Polish, optimization, advanced features]_

### Phase 4: Testing & Refinement

_[Cross-browser testing, performance optimization]_

---

## 5. Migration Plan

### Data Preservation

_[How to maintain existing functionality during rebuild]_

### Testing Strategy

_[How to verify each component works correctly]_

### Rollback Plan

_[Safety measures if issues arise]_

---

## 6. Timeline & Milestones

_[To be established based on scope]_

---

## Questions & Decisions Log

### Session 1 - Initial Discovery

**Date:** July 25, 2025

**Questions Asked:**

1. ✅ Core Application Purpose - What does ACM Manager 2024 do and what business problem does it solve?
2. ✅ Target Users & Daily Workflows - What does each role do day-to-day in the app?
3. ✅ Current Experience & Pain Points - What works well vs. what frustrates users most?
4. ✅ Vision & Design Inspiration - How should the new experience feel and any design inspiration?
5. ✅ Technology Stack & Development Preferences - UI library, styling approach, state management
6. ✅ Core Workflows & Features - What are the main features/pages users need?
7. ✅ Navigation & Information Architecture - How should information be organized and accessed?

**Discovery Complete!** Ready to move to detailed planning and implementation phases.

**Decisions Made:**

- App is management layer for self storage company operations
- Consolidates spreadsheet-based workflows into unified platform
- Integrates with existing Sitelink system for facility data
- Design Vision: Traditional business feel with modern app aesthetics
- Visual focus: Data visualization through graphs and charts where appropriate
- Aesthetic: Clean, modern appearance
- Branding: Minimal requirements, flexible approach
- Color/Layout: Iterative approach - build and refine based on feel
- Reference Collection: Will gather inspiring websites as found
- Tech Stack: Next.js 15 + Shadcn/ui + Tailwind + RSC + Recharts
- Core Features: Bi-weekly payroll (with employee self-service), executive dashboard with alerts, performance tracking
- Approach: Iterative development driven by real user adoption and feedback
- Navigation: Role-based visibility + dashboard-centric + mobile-first (bottom tabs/collapsible sidebar)
- Landing Strategy: Hybrid dashboards showing relevant metrics + quick access to personal info

---

## Implementation Checklist

_[Updated as we progress]_

- [x] Planning complete
- [x] Git branch created (`frontend-rebuild-2025`)
- [x] Navigation system design complete (Context + Mobile/Desktop components)
- [x] Design system established - comprehensive foundation created
- [x] Role-based navigation implemented
- [x] Business component library built
- [ ] Core dashboard pages implemented
- [ ] Data integration completed
- [ ] Testing completed
- [ ] Production deployment

**Design System Progress:**

- ✅ Created comprehensive design system documentation (`docs/design-system.md`)
- ✅ Implemented ACM-specific CSS design tokens (`src/styles/design-tokens.css`)
- ✅ Enhanced Tailwind config with business-specific colors
- ✅ Built comprehensive design system showcase page (`/design-system`)
- ✅ Integrated new styles into global CSS and navigation

**Role-Based Navigation Progress:**

- ✅ Created navigation configuration system (`src/lib/navigation.ts`)
- ✅ Implemented role-based menu filtering (USER, ASSISTANT, MANAGER, SUPERVISOR, ADMIN)
- ✅ Enhanced TopMenu with role-based visibility and facility-aware dropdowns
- ✅ Improved mobile navigation with role-specific sections and better UX
- ✅ Added user role and location context display
- ✅ Created navigation utility hook for client components
- ✅ Integrated with existing authentication and facility access system

**Business Component Library Progress:**

- ✅ Created comprehensive business component library (`src/components/business/`)
- ✅ Built 5 core component categories with 15+ individual components:
  - ✅ **Metrics & Performance** (`MetricCards.tsx`) - Revenue, occupancy, facility performance
  - ✅ **Employee Management** (`EmployeeComponents.tsx`) - Employee cards, team stats, performance tracking
  - ✅ **Payroll & Compensation** (`PayrollComponents.tsx`) - Payroll summaries, employee items, alerts
  - ✅ **Banking & Deposits** (`DepositComponents.tsx`) - Daily deposits, banking summaries, trends
  - ✅ **Goal Tracking** (`GoalComponents.tsx`) - Goal cards, dashboards, performance monitoring
- ✅ Implemented unified component export system (`src/components/business/index.ts`)
- ✅ Added Progress UI component for goal tracking
- ✅ Created comprehensive demo pages:
  - ✅ Main demo with auth integration (`/business-components-demo`)
  - ✅ Standalone demo without database dependency (`/business-components-standalone`)
  - ✅ Status dashboard with troubleshooting (`/status`)
- ✅ Integrated with role-based navigation system
- ✅ Ensured mobile-first responsive design across all components
- ✅ Implemented TypeScript interfaces for all data structures
- ✅ Added ACM design token integration throughout component library

**Database & Infrastructure:**

- ✅ Resolved Supabase connection timeout issues
- ✅ Verified database connectivity and table access
- ✅ Confirmed authentication system operational
- ✅ All demo pages functional with live database

---

## Current Status & Next Steps

**Last Updated:** July 25, 2025
**Development Status:** ✅ Foundation Complete - Ready for Data Integration

### ✅ Completed Major Milestones

1. **Design System Foundation** - Comprehensive design tokens, component library foundation
2. **Role-Based Navigation** - Complete 5-tier role system with facility-aware routing
3. **Business Component Library** - 15+ production-ready components across 5 categories
4. **Demo Infrastructure** - Multiple demonstration pages showcasing all functionality
5. **Database Infrastructure** - Supabase connection restored and operational

### 🎯 Immediate Next Steps (Priority Order)

**Phase 1: Data Integration (1-2 weeks)**

1. **Connect Components to Real Data**

   - Replace sample data in business components with live ACM database queries
   - Implement data fetching hooks and API endpoints
   - Add loading states and error handling

2. **Build Role-Specific Dashboards**

   - Manager dashboard with facility-specific metrics
   - Supervisor dashboard with multi-facility oversight
   - Admin dashboard with company-wide analytics
   - Employee self-service portal for payroll/goals

3. **Facility-Specific Views**
   - Add facility filtering to all components
   - Implement facility context throughout application
   - Create facility switching functionality

**Phase 2: Core Workflows (2-3 weeks)**

1. **Payroll System Integration**

   - Connect payroll components to existing payroll data
   - Implement payroll processing workflows
   - Add employee self-service features

2. **Banking & Deposits**

   - Integrate daily deposit tracking with bank data
   - Implement deposit reconciliation workflows
   - Add banking alert systems

3. **Goal Tracking System**
   - Connect goal components to performance data
   - Implement goal creation and management
   - Add performance tracking and reporting

**Phase 3: Advanced Features (3-4 weeks)**

1. **Advanced Analytics**

   - Implement trend analysis and forecasting
   - Add comparative performance metrics
   - Create executive-level reporting

2. **Mobile Optimization**

   - Enhance mobile experience for field users
   - Add offline capability where needed
   - Implement push notifications for alerts

3. **Testing & Polish**
   - Comprehensive user testing with each role
   - Performance optimization
   - Accessibility compliance verification

### 📊 Component Library Status

**Ready for Integration:**

- All 15+ business components built and tested
- TypeScript interfaces defined for all data structures
- Mobile-responsive design verified
- Role-based access patterns established

**Available Demo URLs:**

- `/business-components-demo` - Full component showcase with auth
- `/business-components-standalone` - Static demo without database
- `/design-system` - Design system reference
- `/navigation-demo` - Role-based navigation testing
- `/status` - Current system status and troubleshooting

**Technical Foundation:**

- Next.js 15 App Router with Server Components
- Shadcn/ui component library with ACM customizations
- Tailwind CSS with business-specific design tokens
- TypeScript with full type safety
- Supabase PostgreSQL with Drizzle ORM

---

## Notes & References

_[Additional context, links, inspiration, etc.]_
