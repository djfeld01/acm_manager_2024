# ACM Design System

## Overview

The ACM Design System provides a consistent, professional, and mobile-first design foundation for the ACM Manager 2024 application.

## Design Principles

### 1. Mobile-First

- Primary users access the app on tablets and mobile devices
- Touch-friendly interface elements (44px minimum touch targets)
- Readable text sizes across all devices
- Simplified layouts that work on small screens

### 2. Professional & Clean

- Traditional business feel with modern aesthetics
- Clean, uncluttered interfaces
- Data visualization emphasis
- Professional color palette

### 3. Role-Based Experience

- Different users see different interfaces based on their role
- Clear visual hierarchy for different permission levels
- Contextual information display

### 4. Data-Driven

- Charts and graphs are first-class citizens
- Tables and data displays are optimized for scanning
- Key metrics prominently displayed

## Color System

### Current Theme

The app uses a blue/purple professional theme with light and dark mode support.

```css
/* Primary Brand Colors */
--primary: 234.5 89.5% 73.9%;        /* Light blue/purple */
--primary-foreground: 0 0% 0%;

/* Semantic Colors */
--background: 234.5 68% 95%;          /* Light background */
--foreground: 234.5 5% 0%;           /* Dark text */
--muted: 196.5 30% 85%;              /* Subtle backgrounds */
--accent: 196.5 30% 80%;             /* Highlight elements */

/* Status Colors */
--destructive: 0 68% 30%;            /* Error/danger */
--chart-1 through chart-5             /* Data visualization */
```

### Recommendations for Enhancement

- Add success/warning semantic colors
- Define ACM brand-specific colors
- Create color variants for different facility types
- Add role-based color coding

## Typography

### Current System

- **Font Family**: Inter (via --font-sans)
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Mobile-First Sizing

```css
/* Recommended text scales for mobile-first */
.text-xs     /* 12px - Fine print, badges */
/* 12px - Fine print, badges */
.text-sm     /* 14px - Secondary text, captions */
.text-base   /* 16px - Body text, primary content */
.text-lg     /* 18px - Subheadings, important text */
.text-xl     /* 20px - Section headings */
.text-2xl    /* 24px - Page titles */
.text-3xl; /* 30px - Main dashboard headings */
```

### Hierarchy Guidelines

1. **Page Titles**: text-2xl or text-3xl, font-bold
2. **Section Headers**: text-xl, font-semibold
3. **Body Text**: text-base, font-normal
4. **Secondary Info**: text-sm, text-muted-foreground
5. **Labels/Captions**: text-xs, text-muted-foreground

## Spacing System

### Tailwind Spacing Scale

Following Tailwind's 4px base unit system, optimized for mobile:

```css
/* Touch-friendly spacing for mobile */
gap-2        /* 8px - Tight element spacing */
gap-4        /* 16px - Standard spacing */
gap-6        /* 24px - Section spacing */
gap-8        /* 32px - Large section spacing */

/* Padding/Margins */
p-2          /* 8px - Tight padding */
p-4          /* 16px - Standard padding */
p-6          /* 24px - Comfortable padding */
```

### Mobile Guidelines

- Minimum touch target: 44px (h-11 w-11 or larger)
- Comfortable spacing between interactive elements: 16px minimum
- Section breaks: 24px or larger
- Page margins: 16px minimum on mobile

## Component Standards

### Buttons

```tsx
// Primary action buttons
<Button size="lg" className="min-h-[44px]">Primary Action</Button>

// Secondary actions
<Button variant="outline" size="lg">Secondary</Button>

// Mobile-optimized button sizes
<Button size="sm">Compact</Button>
```

### Cards

```tsx
// Standard content cards
<Card className="p-4 md:p-6">
  <CardHeader className="pb-4">
    <CardTitle className="text-lg">Section Title</CardTitle>
  </CardHeader>
  <CardContent>{/* Card content */}</CardContent>
</Card>
```

### Data Display

```tsx
// Mobile-friendly tables
<div className="overflow-x-auto">
  <Table className="min-w-full">
    {/* Table content */}
  </Table>
</div>

// Dashboard metrics
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard />
</div>
```

## Layout Patterns

### Page Structure

```tsx
<div className="min-h-screen bg-background">
  {/* Navigation - mobile bottom tabs, desktop sidebar */}

  <main className="p-4 md:p-6 pb-20 md:pb-6">
    {/* Page header */}
    <div className="mb-6">
      <h1 className="text-2xl font-bold">Page Title</h1>
      <p className="text-muted-foreground">Page description</p>
    </div>

    {/* Page content */}
    <div className="space-y-6">{/* Content sections */}</div>
  </main>
</div>
```

### Responsive Grid

```tsx
// Dashboard layout
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div className="space-y-6">{/* Sidebar content */}</div>
</div>
```

## Accessibility Guidelines

### Color Contrast

- Text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio
- Interactive elements: Clear focus states

### Mobile Accessibility

- Touch targets: Minimum 44px
- Text: Minimum 16px base size to prevent zoom
- Focus management for screen readers

### Interactive States

```css
/* Standard interactive states */
.interactive {
  @apply transition-colors duration-200;
  @apply hover:bg-accent hover:text-accent-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring;
  @apply active:scale-95;
}
```

## Data Visualization Guidelines

### Chart Colors

Using the predefined chart color palette:

- chart-1: Primary data series
- chart-2: Secondary comparison
- chart-3: Tertiary data
- chart-4: Additional categories
- chart-5: Special highlighting

### Chart Sizing

- Mobile: Full width, minimum 300px height
- Tablet: Responsive within cards
- Desktop: Flexible sizing based on data density

## Next Steps

1. **Create Component Library**: Build ACM-specific components
2. **Brand Enhancement**: Define ACM brand colors and identity
3. **Component Showcase**: Create design system documentation site
4. **Mobile Testing**: Test all components on target devices
5. **Accessibility Audit**: Ensure full compliance

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
