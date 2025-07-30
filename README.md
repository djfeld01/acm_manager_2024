# ACM Manager 2024

A comprehensive self-storage facility management system built for ACM company to efficiently manage multiple storage facilities, track rental performance, and monitor business operations.

## What is this for?

ACM Manager 2024 is a web-based management dashboard that helps ACM company:

- **Monitor Multiple Storage Facilities**: Track performance across all storage locations from a single dashboard
- **Rental Goal Management**: Set and monitor monthly rental goals with real-time progress tracking
- **Occupancy Monitoring**: View unit occupancy rates and trends across facilities
- **Financial Tracking**: Monitor daily deposits, payments, and revenue streams
- **Payroll Management**: Handle employee payroll processing and management
- **Performance Analytics**: Track daily, weekly, and monthly rental statistics
- **Operational Insights**: Monitor move-ins, move-outs, and facility activities

## Key Features

### Dashboard Overview
- **Multi-facility Dashboard**: View all storage locations with key metrics at a glance
- **Goal Progress Tracking**: Visual progress bars showing rental goal completion vs. month progress
- **Occupancy Indicators**: Color-coded occupancy rates (90%+ green, 75%+ yellow, <75% red)
- **Real-time Statistics**: Daily, weekly, and monthly rental counts

### Facility Management
- **Facility Details**: Complete facility information including addresses, contact details, and site codes
- **Commission Rates**: Track storage and insurance commission rates per facility
- **Site Integration**: Integration with SiteLink property management system

### Financial Management
- **Daily Deposits**: Track and manage daily payment deposits
- **Bank Integration**: Import and process bank transactions
- **Revenue Tracking**: Monitor rental income and sundry charges
- **QuickBooks Integration**: Sync financial data with accounting systems

### Employee Management
- **Payroll Processing**: Handle employee payroll by facility
- **User Access Control**: Role-based access to different facilities and features
- **Activity Tracking**: Monitor employee activities and performance

## Technology Stack

- **Frontend**: Next.js 15 with React 18
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **State Management**: TanStack Query for server state
- **TypeScript**: Full type safety throughout the application

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Environment variables configured (see `.env.example`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/djfeld01/acm_manager_2024.git
cd acm_manager_2024
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your database and authentication settings
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run migrate` - Run database migrations
- `npm run drop` - Drop database tables (use with caution)

## Project Structure

- `/src/app` - Next.js app router pages and layouts
- `/src/components` - Reusable UI components
- `/src/db` - Database schema and migrations
- `/src/lib/controllers` - Business logic and data controllers
- `/supabase` - Database configuration and setup

## Contributing

This is a private ACM company project. Contact the development team for contribution guidelines.
