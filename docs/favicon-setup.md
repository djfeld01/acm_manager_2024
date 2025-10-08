# Favicon Setup

## Overview

The ACM logo has been configured as the browser tab icon (favicon) for the application.

## Files Created

- `/public/favicon.svg` - SVG version of the ACM logo for modern browsers
- `/public/favicon.ico` - ICO version for legacy browser compatibility
- `/public/images/acm_logo.svg` - Original logo file (also used as Apple touch icon)

## Configuration

The favicon is configured in `src/app/layout.tsx` using Next.js metadata:

```typescript
export const metadata: Metadata = {
  title: "ACM Dashboard",
  description: "Dashboard to help facilitate the ACM management company",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon.ico",
        sizes: "any",
      },
    ],
    shortcut: "/favicon.svg",
    apple: "/images/acm_logo.svg",
  },
};
```

## Browser Support

- **Modern browsers**: Will use the SVG favicon (`/favicon.svg`)
- **Legacy browsers**: Will fall back to the ICO favicon (`/favicon.ico`)
- **Apple devices**: Will use the Apple touch icon (`/images/acm_logo.svg`)

## Notes

- The current `favicon.ico` is a copy of the SVG file
- For optimal results, consider creating a proper ICO file with multiple sizes (16x16, 32x32, 48x48)
- You can use online tools like [favicon.io](https://favicon.io/) to generate proper ICO files from your SVG

## Testing

After deployment, you can verify the favicon is working by:

1. Opening the application in a browser
2. Checking the browser tab for the ACM logo
3. Bookmarking the page to see the favicon in bookmarks
4. Checking on mobile devices for the Apple touch icon
