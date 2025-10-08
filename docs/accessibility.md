# Accessibility Implementation Guide

This document outlines the accessibility features implemented in the ACM Manager 2024 frontend rebuild and provides guidelines for maintaining and extending accessibility support.

## Overview

The application has been enhanced with comprehensive accessibility features to ensure compliance with WCAG 2.1 AA standards and provide an inclusive experience for all users, including those using assistive technologies.

## Key Accessibility Features

### 1. Semantic HTML Structure

- **Proper landmark roles**: `main`, `navigation`, `banner`, `contentinfo`
- **Heading hierarchy**: Logical h1-h6 structure throughout the application
- **Form labels**: All form controls have associated labels or ARIA attributes
- **List structures**: Navigation and data are properly structured using lists

### 2. ARIA (Accessible Rich Internet Applications) Support

#### ARIA Labels and Descriptions

- Navigation items include `aria-current="page"` for active states
- Form fields have `aria-describedby` for help text and errors
- Interactive elements have descriptive `aria-label` attributes
- Complex widgets use `aria-labelledby` for composite labeling

#### ARIA Live Regions

- Status announcements for dynamic content changes
- Error messages announced to screen readers
- Loading states communicated via live regions
- Form validation feedback with appropriate urgency levels

#### ARIA States and Properties

- `aria-expanded` for collapsible navigation items
- `aria-selected` for active navigation and table rows
- `aria-invalid` for form validation states
- `aria-hidden` for decorative icons and elements

### 3. Keyboard Navigation

#### Focus Management

- **Visible focus indicators**: All interactive elements have clear focus styles
- **Focus trapping**: Modals and dialogs trap focus appropriately
- **Focus restoration**: Focus returns to trigger elements when closing modals
- **Skip links**: Allow keyboard users to skip to main content

#### Keyboard Shortcuts

- **Arrow keys**: Navigate through menus and data tables
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dropdown menus
- **Tab/Shift+Tab**: Standard focus navigation
- **Home/End**: Jump to first/last items in lists

#### Roving Tabindex

- Navigation menus use roving tabindex pattern
- Only one item in each group is tabbable at a time
- Arrow keys move focus within groups

### 4. Screen Reader Support

#### Screen Reader Only Content

- Context information for navigation states
- Descriptive text for icon-only buttons
- Status announcements for dynamic changes
- Additional context for complex interactions

#### Proper Announcements

- Form validation errors announced immediately
- Loading states communicated clearly
- Success messages for completed actions
- Navigation changes announced appropriately

### 5. Mobile Accessibility

#### Touch Targets

- Minimum 44px touch target size for all interactive elements
- Adequate spacing between touch targets
- Optimized for one-handed operation

#### Responsive Design

- Content reflows properly at all zoom levels
- Text remains readable at 200% zoom
- No horizontal scrolling required
- Touch-friendly navigation patterns

## Component-Specific Accessibility

### Navigation Components

#### Desktop Sidebar (`DesktopSidebarV2`)

- **Role**: `navigation` with appropriate `aria-label`
- **Menu structure**: Proper `role="menu"` and `role="menuitem"`
- **Active states**: `aria-current="page"` for current page
- **Keyboard support**: Arrow key navigation, Enter to activate
- **Screen reader**: Current page announced, badge counts described

#### Mobile Navigation (`MobileNavigation`)

- **Bottom tabs**: `role="tablist"` with `role="tab"` items
- **Touch targets**: Minimum 44px height for all tabs
- **Active states**: `aria-selected` and visual indicators
- **Hamburger menu**: Proper `aria-expanded` and `aria-haspopup`
- **Sheet navigation**: Focus trapped within open sheet

### Form Components

#### AccessibleTextField

- **Labels**: Proper association with form controls
- **Validation**: Real-time error announcements
- **Required fields**: Clear indication with screen reader support
- **Password toggle**: Accessible show/hide functionality
- **Help text**: Associated via `aria-describedby`

#### AccessibleSelectField

- **Options**: Proper `role="option"` for select items
- **Empty states**: Descriptive text for no options
- **Keyboard navigation**: Arrow keys to navigate options
- **Selection**: Clear announcement of selected values

### Data Display Components

#### AccessibleDataTable

- **Table structure**: Proper `thead`, `tbody`, `th`, `td` elements
- **Headers**: Column headers with sorting capabilities
- **Sorting**: `aria-sort` attributes and keyboard activation
- **Row selection**: Accessible checkboxes with proper labels
- **Pagination**: Keyboard navigable with clear labels
- **Empty states**: Descriptive messages for no data

#### DashboardCard

- **Regions**: Each card is a labeled region
- **Metrics**: Values formatted for screen readers
- **Trends**: Change indicators with descriptive text
- **Alerts**: Proper `role="alert"` for important messages
- **Actions**: Buttons with descriptive labels

### Modal Components

#### AccessibleModal

- **Focus trap**: Focus contained within modal
- **Focus restoration**: Returns to trigger element on close
- **Escape key**: Closes modal when pressed
- **Backdrop**: Optional click-to-close functionality
- **ARIA**: Proper `role="dialog"` and labeling

## Implementation Guidelines

### Adding New Components

When creating new components, follow these accessibility guidelines:

1. **Start with semantic HTML**

   ```tsx
   // Good
   <button onClick={handleClick}>Save</button>

   // Avoid
   <div onClick={handleClick}>Save</div>
   ```

2. **Add proper ARIA attributes**

   ```tsx
   <button
     aria-label="Save document"
     aria-describedby="save-help"
     onClick={handleSave}
   >
     Save
   </button>
   <div id="save-help">Saves the current document</div>
   ```

3. **Implement keyboard support**

   ```tsx
   const handleKeyDown = (event: KeyboardEvent) => {
     if (event.key === "Enter" || event.key === " ") {
       event.preventDefault();
       handleAction();
     }
   };
   ```

4. **Provide screen reader feedback**

   ```tsx
   import { StatusAnnouncement } from "@/lib/accessibility/screen-reader";

   <StatusAnnouncement
     message="Document saved successfully"
     priority="polite"
   />;
   ```

### Using Accessibility Utilities

The application provides several utility functions and hooks:

#### ARIA Utilities

```tsx
import {
  createAriaFormFieldProps,
  generateAriaId,
} from "@/lib/accessibility/aria-utils";

const fieldId = generateAriaId("email-field");
const ariaProps = createAriaFormFieldProps({
  id: fieldId,
  required: true,
  invalid: hasError,
  describedBy: ["help-text", "error-message"],
});
```

#### Keyboard Navigation Hooks

```tsx
import { useKeyboardNavigation } from "@/lib/accessibility/keyboard-navigation";

const { containerRef } = useKeyboardNavigation({
  isOpen: true,
  itemSelector: '[role="menuitem"]',
  orientation: "vertical",
});
```

#### Focus Management

```tsx
import { useFocusTrap } from "@/lib/accessibility/focus-management";

const { containerRef } = useFocusTrap(isModalOpen);
```

### Testing Accessibility

#### Automated Testing

```tsx
import { useAccessibilityTesting } from "@/lib/accessibility/testing";

// In development, automatically test accessibility
useAccessibilityTesting(process.env.NODE_ENV === "development");
```

#### Manual Testing

```tsx
import { logAccessibilityReport } from "@/lib/accessibility/testing";

// Generate and log accessibility report
logAccessibilityReport(document.body);
```

## Testing Checklist

### Keyboard Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are visible and clear
- [ ] Skip links work properly
- [ ] Modal focus trapping works correctly
- [ ] Escape key closes modals and menus

### Screen Reader Testing

- [ ] All content is announced properly
- [ ] Navigation structure is clear
- [ ] Form labels and errors are announced
- [ ] Dynamic content changes are announced
- [ ] Tables have proper headers and structure

### Visual Testing

- [ ] Text contrast meets WCAG AA standards (4.5:1)
- [ ] Content is readable at 200% zoom
- [ ] No information is conveyed by color alone
- [ ] Focus indicators are clearly visible
- [ ] Touch targets are at least 44px

### Mobile Testing

- [ ] All functionality works with touch
- [ ] Touch targets are appropriately sized
- [ ] Content reflows properly on small screens
- [ ] No horizontal scrolling required
- [ ] Voice control works properly

## Browser and Assistive Technology Support

### Supported Screen Readers

- **NVDA** (Windows) - Primary testing target
- **JAWS** (Windows) - Secondary testing target
- **VoiceOver** (macOS/iOS) - Mobile and desktop testing
- **TalkBack** (Android) - Mobile testing

### Supported Browsers

- **Chrome** 90+ (Primary)
- **Firefox** 88+ (Secondary)
- **Safari** 14+ (macOS/iOS)
- **Edge** 90+ (Windows)

## Common Accessibility Patterns

### Loading States

```tsx
import { LoadingAnnouncement } from "@/lib/accessibility/screen-reader";

<LoadingAnnouncement
  isLoading={loading}
  loadingMessage="Loading data"
  completedMessage="Data loaded successfully"
/>;
```

### Error Handling

```tsx
import { ErrorAnnouncement } from "@/lib/accessibility/screen-reader";

<ErrorAnnouncement error={errorMessage} priority="assertive" />;
```

### Progress Indicators

```tsx
import { ProgressAnnouncement } from "@/lib/accessibility/screen-reader";

<ProgressAnnouncement
  value={progress}
  max={100}
  label="Upload progress"
  announceEvery={25}
/>;
```

## Resources and References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)

## Maintenance and Updates

### Regular Testing

- Run accessibility audits monthly
- Test with actual screen reader users quarterly
- Update accessibility features with new component additions
- Monitor and fix accessibility regressions

### Documentation Updates

- Update this guide when adding new accessibility features
- Document any accessibility-related breaking changes
- Maintain examples and code snippets
- Keep testing procedures current

### Training and Awareness

- Provide accessibility training for new team members
- Share accessibility best practices in code reviews
- Encourage accessibility-first development approach
- Celebrate accessibility improvements and achievements
